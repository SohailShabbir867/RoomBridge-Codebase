const mongoose = require("mongoose");

/* ── Lightweight by design ─────────────────────────────────
   Unlike Message.model.js (private DMs), community messages are NOT meant
   to be a permanent archive:
     - no `deletedBy` soft-delete array
     - no `isRead` / `readAt` receipts (group chat, receipts don't scale well)
     - a TTL index auto-expires documents after 30 days, so old chatter is
       pruned automatically by MongoDB itself — no cron job needed.
   This keeps the collection small and queries fast even with many active
   communities, per the "lightweight, recent messages only" requirement. */

const COMMUNITY_MESSAGE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

const communityMessageSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: [true, "Community is required"],
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },

    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
      default: "",
    },

    /* Same { url, public_id } Cloudinary shape used across the app
       (User.profilePhoto, Listing.photos, Message.image). */
    image: {
      url: { type: String },
      public_id: { type: String },
    },

    messageType: {
      type: String,
      enum: {
        values: ["text", "image", "system"],
        message: "Invalid message type",
      },
      default: "text",
    },

    /* True only for admin announcement posts inside a private community,
       so the frontend can render them with a distinct "Announcement" style
       instead of a normal chat bubble. */
    isAnnouncement: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Validation: must have either text or an image ───────── */
communityMessageSchema.pre("validate", function () {
  if (!this.message?.trim() && !this.image?.url) {
    this.invalidate(
      "message",
      "A community message needs either text or an image.",
    );
  }
});

/* ── Indexes ───────────────────────────────────────────── */
/* Fetch a community's messages in order — the main read pattern. */
communityMessageSchema.index({ community: 1, createdAt: 1 });

/* TTL index — MongoDB's background task automatically deletes documents
   COMMUNITY_MESSAGE_TTL_SECONDS after their createdAt timestamp.
   This is what makes storage "lightweight": no manual pruning job,
   no unbounded growth, and old noise disappears on its own. */
communityMessageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: COMMUNITY_MESSAGE_TTL_SECONDS },
);

module.exports = mongoose.model("CommunityMessage", communityMessageSchema);
