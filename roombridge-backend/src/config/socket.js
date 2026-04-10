const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.io on the HTTP server.
 * Called once in server.js AFTER MongoDB connects.
 *
 * EVENT CONTRACT (shared between socket.js and message.controller.js):
 *
 *   Client → Server:
 *     user_online  (userId)          — register user as online, join personal room
 *     join_room    (roomId)          — join a conversation room
 *     leave_room   (roomId)          — leave a conversation room
 *     send_message (data)            — relay a saved message to the conversation room
 *     typing       ({ conversationId, senderId })    — typing indicator
 *     stop_typing  ({ conversationId, senderId })    — stop typing indicator
 *
 *   Server → Client:
 *     online_users (string[])        — updated list of online user IDs
 *     new_message  (messageDoc)      — new message (emitted by BOTH socket relay AND REST controller)
 *     typing       ({ conversationId, senderId })
 *     stop_typing  ({ conversationId, senderId })
 *     new_message_notification ({ conversationId, message }) — for notification badge
 *
 * @param {http.Server} server
 * @returns {Server} io instance
 */
const initSocket = (server) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(server, {
    cors: {
      origin:      [clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  /* ── Track online users: userId → socketId ───────────── */
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    /* ── User comes online ──────────────────────────────── */
    socket.on('user_online', (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      /* Join a personal room so the server can emit directly to this user */
      socket.join(userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`👤 User online: ${userId} (socket: ${socket.id})`);
    });

    /* ── Join a conversation room ───────────────────────── */
    socket.on('join_room', (roomId) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(`📥 Socket ${socket.id} joined room: ${roomId}`);
    });

    /* ── Leave a conversation room ──────────────────────── */
    socket.on('leave_room', (roomId) => {
      if (!roomId) return;
      socket.leave(roomId);
      console.log(`📤 Socket ${socket.id} left room: ${roomId}`);
    });

    /* ── Relay a message to a conversation room ────────────
       BUG FIX: The old handler required data.roomId but the frontend
       ChatBox sends the full saved message doc (which has conversationId,
       not roomId). Now we accept EITHER data.roomId OR data.conversationId.

       Also: emit 'new_message' (matching the REST controller event name)
       instead of 'receive_message'. The frontend only listens for 'new_message'. */
    socket.on('send_message', (data) => {
      const room = data?.roomId || data?.conversationId;
      if (!room) return;
      socket.to(room).emit('new_message', data);
    });

    /* ── Typing indicators ──────────────────────────────── 
       BUG FIX: Frontend emits 'typing' / 'stop_typing' with
       { conversationId, senderId }. Old backend listened for
       'typing_start' / 'typing_stop' with { roomId } — complete mismatch.
       Now aligned to accept { conversationId }. */
    socket.on('typing', (data) => {
      const room = data?.roomId || data?.conversationId;
      if (!room) return;
      socket.to(room).emit('typing', data);
    });

    socket.on('stop_typing', (data) => {
      const room = data?.roomId || data?.conversationId;
      if (!room) return;
      socket.to(room).emit('stop_typing', data);
    });

    /* ── Disconnect ─────────────────────────────────────── */
    socket.on('disconnect', (reason) => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('online_users', Array.from(onlineUsers.keys()));
          console.log(`👤 User offline: ${userId} (reason: ${reason})`);
          break;
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

/**
 * Get the initialized io instance from anywhere in the app.
 * Throws if called before initSocket().
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket(server) first.');
  }
  return io;
};

module.exports = { initSocket, getIO };
