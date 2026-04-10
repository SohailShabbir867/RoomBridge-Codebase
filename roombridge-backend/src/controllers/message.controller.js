const Message = require('../models/Message.model');
const User    = require('../models/User.model');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

/* ── Safe Socket.io getter ────────────────────────────────
   socket.js may not be initialised in test environments.
   Using a lazy require with a null fallback prevents crashes. */
let getIO;
try { getIO = require('../config/socket').getIO; } catch { getIO = null; }

/* ── Emit to a socket room with fault tolerance ─────────── */
const emitToRoom = (room, event, data) => {
  try {
    if (!getIO) return;
    const io = getIO();
    if (io) io.to(room).emit(event, data);
  } catch {
    // Socket.io not ready — silent fail (HTTP response is the source of truth)
  }
};

/* ── Build deterministic conversationId from two user IDs ─
   Sorts alphabetically so the same pair always produces the same result. */
const buildConversationId = (idA, idB) =>
  [idA.toString(), idB.toString()].sort().join('_');

/* ── Verify that req.user is a participant in the conversation ─
   BUG FIX: original just did split('_').includes(userId) which could
   pass for IDs containing underscores or malformed IDs.
   Now we explicitly validate the format and check membership. */
const isParticipant = (conversationId, userId) => {
  const parts = (conversationId || '').split('_');
  /* A valid conversationId has exactly 2 segments, each 24-char hex */
  if (parts.length !== 2) return false;
  const [a, b] = parts;
  if (!/^[a-f0-9]{24}$/i.test(a) || !/^[a-f0-9]{24}$/i.test(b)) return false;
  return a === userId || b === userId;
};

/* ══════════════════════════════════════════════════════════
   GET CONVERSATIONS
   GET /api/v1/messages/conversations
══════════════════════════════════════════════════════════ */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Message.getConversations(req.user._id.toString());
    const myId = req.user._id.toString();

    /* Reshape: determine the "other party" for each conversation */
    const result = conversations.map(conv => {
      /* BUG FIX: Added null-safe check for senderInfo/receiverInfo.
         If the other user was deleted, their info will be null from the lookup.
         Return a graceful placeholder instead of crashing. */
      const iAmSender = conv.lastMessage?.sender?.toString() === myId;
      const otherUser = iAmSender
        ? (conv.receiverInfo || null)
        : (conv.senderInfo   || null);

      return {
        conversationId: conv.conversationId,
        otherUser,
        lastMessage: {
          _id:       conv.lastMessage?._id,
          message:   conv.lastMessage?.message,
          createdAt: conv.lastMessage?.createdAt,
          isRead:    conv.lastMessage?.isRead,
          sender:    conv.lastMessage?.sender,
          messageType: conv.lastMessage?.messageType,
        },
        unreadCount: conv.unreadCount || 0,
      };
    });

    return successResponse(res, 200, 'Conversations retrieved.', { conversations: result });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET MESSAGES IN A CONVERSATION
   GET /api/v1/messages/:conversationId
══════════════════════════════════════════════════════════ */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip     = (pageNum - 1) * limitNum;

    const myId = req.user._id.toString();

    /* BUG FIX: Strict participant check — validates format AND membership */
    if (!isParticipant(conversationId, myId)) {
      return errorResponse(res, 403, 'You are not a participant in this conversation.');
    }

    /* BUG FIX: Filter out messages soft-deleted by this user (deletedBy array) */
    const baseFilter = {
      conversationId,
      deletedBy: { $ne: req.user._id },
    };

    const [messages, total] = await Promise.all([
      Message.find(baseFilter)
        .sort({ createdAt: 1 }) // ascending — oldest first
        .skip(skip)
        .limit(limitNum)
        .populate('sender',   'name profilePhoto')
        .populate('receiver', 'name profilePhoto')
        .lean(),
      Message.countDocuments(baseFilter),
    ]);

    return paginatedResponse(res, 'Messages retrieved.', messages, pageNum, limitNum, total);
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   SEND MESSAGE
   POST /api/v1/messages
══════════════════════════════════════════════════════════ */
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message: messageText, listingId } = req.body;

    /* Validate required fields */
    if (!receiverId) return errorResponse(res, 400, 'receiverId is required.');
    if (!messageText || !messageText.trim()) {
      return errorResponse(res, 400, 'Message content is required.');
    }
    if (messageText.trim().length > 1000) {
      return errorResponse(res, 400, 'Message cannot exceed 1000 characters.');
    }

    /* Cannot message yourself */
    if (req.user._id.toString() === receiverId.toString()) {
      return errorResponse(res, 400, 'You cannot send a message to yourself.');
    }

    /* Validate receiver exists */
    const receiver = await User.findById(receiverId).select('_id name isActive isBanned');
    if (!receiver) return errorResponse(res, 404, 'Receiver not found.');
    if (receiver.isBanned || !receiver.isActive) {
      return errorResponse(res, 400, 'Cannot send a message to this user.');
    }

    /* BUG FIX: Build conversationId BEFORE creating the message so we can
       use it in the Socket.io emit. The Message pre-save hook also sets it
       but we need it synchronously here. */
    const conversationId = buildConversationId(req.user._id, receiverId);

    const msg = await Message.create({
      sender:         req.user._id,
      receiver:       receiverId,
      message:        messageText.trim(),
      conversationId, // pre-set to avoid relying solely on pre-save hook
      listing:        listingId || undefined,
    });

    const populated = await Message.findById(msg._id)
      .populate('sender',   'name profilePhoto')
      .populate('receiver', 'name profilePhoto')
      .lean();

    /* ── Emit via Socket.io ──────────────────────────────── */
    /* Emit to conversation room — both participants receive the message */
    emitToRoom(conversationId, 'new_message', populated);

    /* BUG FIX: was `io.emit("new_message_notification_" + receiverId, ...)`
       io.emit() broadcasts to ALL connected clients — everyone got the notification.
       Fix: emit to the receiver's personal room (set up in socket.js on join).
       socket.js registers each user's socket to room `userId` on connection. */
    emitToRoom(receiverId, 'new_message_notification', {
      conversationId,
      message: populated,
    });

    return successResponse(res, 201, 'Message sent successfully.', { message: populated });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   MARK MESSAGES AS READ
   PUT /api/v1/messages/:conversationId/read
══════════════════════════════════════════════════════════ */
const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user._id.toString();

    /* BUG FIX: Strict format + participant validation */
    if (!isParticipant(conversationId, myId)) {
      return errorResponse(res, 403, 'You are not a participant in this conversation.');
    }

    /* Mark all messages sent TO this user in this conversation as read */
    const result = await Message.updateMany(
      {
        conversationId,
        receiver: req.user._id,
        isRead:   false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    /* Emit read receipt to the conversation room so sender sees ✓✓ */
    emitToRoom(conversationId, 'messages_read', {
      conversationId,
      readBy:     myId,
      readAt:     new Date().toISOString(),
      readCount:  result.modifiedCount,
    });

    return successResponse(
      res,
      200,
      `${result.modifiedCount} message${result.modifiedCount !== 1 ? 's' : ''} marked as read.`,
      { modifiedCount: result.modifiedCount }
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
};
