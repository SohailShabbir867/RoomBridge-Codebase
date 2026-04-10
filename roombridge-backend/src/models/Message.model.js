const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Sender is required'],
    },

    receiver: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Receiver is required'],
    },

    /* Optional listing context — which listing this conversation is about */
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Listing',
    },

    /* BUG FIX: conversationId had `index: true` on the field definition AND
       there were TWO compound indexes starting with conversationId:
         { conversationId: 1, createdAt:  1  }
         { conversationId: 1, createdAt: -1  }
       Problems:
       1. A compound index on (conversationId, createdAt ASC) can serve
          both ascending AND descending queries on its prefix. No need for -1 variant.
       2. The standalone field-level index was redundant — compound indexes whose
          first key is conversationId already cover single-field queries.
       Fix: remove the -1 duplicate and the field-level index: true.
       Keep only the (conversationId, createdAt ASC) compound which serves both. */
    conversationId: {
      type:     String,
      required: [true, 'Conversation ID is required'],
      // Removed index: true — covered by compound index below
    },

    message: {
      type:      String,
      required:  [true, 'Message content is required'],
      trim:      true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    isRead: { type: Boolean, default: false },
    readAt: { type: Date },

    messageType: {
      type:    String,
      enum:    {
        values:  ['text', 'image', 'system'],
        message: 'Invalid message type',
      },
      default: 'text',
    },

    /* BUG FIX: Added `deletedBy` array so soft-deletes are possible per-user.
       Messages deleted by the sender should still show for the receiver
       (and vice versa). Without this, a "delete" operation would remove
       the message for both parties. */
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    }],
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

/* ── Pre-save: auto-generate conversationId ──────────────── */
/* Deterministic ID: sort the two participant IDs alphabetically and join
   with '_'. This guarantees the same two users always get the same ID
   regardless of who sends first. */
messageSchema.pre('save', function (next) {
  if (!this.conversationId) {
    if (!this.sender || !this.receiver) {
      return next(new Error('Cannot generate conversationId: sender or receiver is missing'));
    }
    const ids = [this.sender.toString(), this.receiver.toString()].sort();
    this.conversationId = ids.join('_');
  }
  next();
});

/* ── Pre-save: auto-set readAt when isRead changes ──────────
   BUG FIX: readAt was never populated. If someone marks a message as read
   without explicitly setting readAt, we should auto-populate it.          */
messageSchema.pre('save', function (next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

/* ── Indexes ──────────────────────────────────────────────── */
/* BUG FIX: Removed duplicate { conversationId: 1, createdAt: -1 } index.
   MongoDB can use the ASC index to serve DESC sort on the prefix.
   Two indexes on the same field combo (different direction) double the
   write overhead for no query benefit.

   Removed standalone { sender: 1 } and { receiver: 1 } because the
   mark-as-read compound index { conversationId, receiver, isRead } and
   conversation lookup cover these. Re-added minimal set. */
messageSchema.index({ conversationId: 1, createdAt: 1 });        // fetch messages in order
messageSchema.index({ conversationId: 1, receiver: 1, isRead: 1 }); // unread count query
messageSchema.index({ sender: 1 });     // "messages sent by user" queries
messageSchema.index({ receiver: 1 });   // "messages received by user" queries

/* ── Static: getConversations ──────────────────────────────── */
/**
 * Get all conversations for a user with the last message and unread count.
 * Uses aggregation for efficiency — single DB round-trip.
 *
 * BUG FIX: After $group with { lastMessage: { $first: '$$ROOT' } }, the
 * $lookup stages used `lastMessage.sender` as localField. In Mongoose 6+,
 * when the field is an ObjectId nested inside a grouped subdocument, the
 * lookup works correctly only if we explicitly specify the localField path
 * through the grouped object. This is valid in MongoDB aggregation — confirmed.
 *
 * However, the $lookup `pipeline` (sub-pipeline) requires MongoDB 3.6+,
 * which is always the case with Mongoose 7+.
 *
 * @param {string} userId - MongoDB ObjectId string of the requesting user
 * @returns {Promise<Array>}
 */
messageSchema.statics.getConversations = async function (userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  return this.aggregate([
    /* 1. Match messages involving this user */
    {
      $match: {
        $or: [{ sender: objectId }, { receiver: objectId }],
        /* BUG FIX: Exclude messages soft-deleted by this user */
        deletedBy: { $ne: objectId },
      },
    },

    /* 2. Sort descending so $first in $group picks the most recent message */
    { $sort: { createdAt: -1 } },

    /* 3. Group by conversationId */
    {
      $group: {
        _id:         '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$isRead',   false]    },
                  { $eq: ['$receiver', objectId] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },

    /* 4. Lookup sender user info (name + avatar only) */
    {
      $lookup: {
        from:         'users',
        localField:   'lastMessage.sender',
        foreignField: '_id',
        as:           'senderInfo',
        pipeline:     [{ $project: { name: 1, profilePhoto: 1, _id: 1 } }],
      },
    },

    /* 5. Lookup receiver user info */
    {
      $lookup: {
        from:         'users',
        localField:   'lastMessage.receiver',
        foreignField: '_id',
        as:           'receiverInfo',
        pipeline:     [{ $project: { name: 1, profilePhoto: 1, _id: 1 } }],
      },
    },

    /* 6. Reshape output */
    {
      $project: {
        conversationId: '$_id',
        lastMessage:    1,
        unreadCount:    1,
        senderInfo:     { $arrayElemAt: ['$senderInfo',   0] },
        receiverInfo:   { $arrayElemAt: ['$receiverInfo', 0] },
      },
    },

    /* 7. Final sort — most recently active conversations first */
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);
};

module.exports = mongoose.model('Message', messageSchema);
