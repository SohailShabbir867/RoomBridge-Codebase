const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing reference is required"],
    },
    seeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seeker reference is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner reference is required"],
    },
    status: {
      type: String,
      default: "pending",
      enum: {
        values: ["pending", "accepted", "rejected", "cancelled"],
        message: "Invalid status",
      },
    },
    message: {
      type: String,
      required: [true, "A message to the owner is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    moveInDate: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v) return true;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return v >= today;
        },
        message: "Move-in date cannot be in the past",
      },
    },
    ownerNote: {
      type: String,
      trim: true,
      maxlength: [500, "Owner note cannot exceed 500 characters"],
    },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Pre-validate: seeker ≠ owner ──────────────────────── */
bookingSchema.pre("validate", function () {
  if (
    this.seeker &&
    this.owner &&
    this.seeker.toString() === this.owner.toString()
  ) {
    throw new Error("Seeker and owner cannot be the same user");
  }
});

/* ── Pre-save: auto-set timestamp on status change ─────── */
bookingSchema.pre("save", function () {
  if (this.isModified("status")) {
    const now = new Date();
    if (this.status === "accepted" && !this.acceptedAt) this.acceptedAt = now;
    if (this.status === "rejected" && !this.rejectedAt) this.rejectedAt = now;
    if (this.status === "cancelled" && !this.cancelledAt)
      this.cancelledAt = now;
  }
});

/* ── Pre-findOneAndUpdate: auto-set timestamp ──────────── */
bookingSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  const status = update?.status || update?.$set?.status;
  if (status) {
    const now = new Date();
    if (status === "accepted") this.set({ acceptedAt: now });
    if (status === "rejected") this.set({ rejectedAt: now });
    if (status === "cancelled") this.set({ cancelledAt: now });
  }
});

/* ── Indexes ───────────────────────────────────────────── */
bookingSchema.index({ listing: 1 });
bookingSchema.index({ seeker: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ listing: 1, seeker: 1 });
bookingSchema.index({ owner: 1, status: 1, createdAt: -1 });
bookingSchema.index({ seeker: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
