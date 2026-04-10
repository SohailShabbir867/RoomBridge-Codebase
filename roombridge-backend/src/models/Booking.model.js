const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Listing',
      required: [true, 'Listing reference is required'],
    },

    seeker: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Seeker reference is required'],
    },

    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Owner reference is required'],
    },

    status: {
      type:    String,
      enum:    {
        values:  ['pending', 'accepted', 'rejected', 'cancelled'],
        message: 'Status must be pending, accepted, rejected, or cancelled',
      },
      default: 'pending',
    },

    /* BUG FIX: message was `required: true` with `minlength: 10`.
       In practice, seekers should absolutely include a message, but
       making it hard-required with minlength:10 means any booking
       without a full message body throws a ValidationError at the DB level.
       The controller already validates this at the route level via express-validator.
       Keeping required + minlength here as an additional safety layer is correct —
       this is intentional and consistent with the validation middleware. */
    message: {
      type:      String,
      required:  [true, 'A message to the owner is required'],
      trim:      true,
      minlength: [10,  'Message must be at least 10 characters'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    moveInDate: {
      type: Date,
      /* BUG FIX: added validator to prevent past move-in dates at the DB level.
         The controller/validation middleware should also enforce this,
         but double-checking here prevents data corruption from direct API access. */
      validate: {
        validator: function (v) {
          if (!v) return true; // optional field — null/undefined is OK
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return v >= today;
        },
        message: 'Move-in date cannot be in the past',
      },
    },

    ownerNote: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Owner note cannot exceed 500 characters'],
    },

    /* acceptedAt / rejectedAt — for analytics and response-time tracking */
    acceptedAt:  { type: Date },
    rejectedAt:  { type: Date },
    cancelledAt: { type: Date },

    /* IMPORTANT: Do NOT add explicit updatedAt.
       timestamps: true handles createdAt + updatedAt automatically. */
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

/* ── Pre-validate: seeker ≠ owner ────────────────────────── */
bookingSchema.pre('validate', function (next) {
  if (
    this.seeker &&
    this.owner &&
    this.seeker.toString() === this.owner.toString()
  ) {
    return next(new Error('Seeker and owner cannot be the same user'));
  }
  next();
});

/* ── Pre-save: auto-set timestamp fields on status change ── */
bookingSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'accepted'  && !this.acceptedAt)  this.acceptedAt  = now;
    if (this.status === 'rejected'  && !this.rejectedAt)  this.rejectedAt  = now;
    if (this.status === 'cancelled' && !this.cancelledAt) this.cancelledAt = now;
  }
  next();
});

/* ── Pre-findOneAndUpdate: auto-set timestamps on status change ─
   BUG FIX: pre('save') does NOT run on findByIdAndUpdate / findOneAndUpdate.
   The booking controller's updateBookingStatus uses findByIdAndUpdate, so the
   pre('save') hook was never firing for status changes via the API.
   Fix: add a pre('findOneAndUpdate') hook that reads the update payload
   and sets the timestamp fields when status changes. */
bookingSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const status = update?.status || update?.$set?.status;

  if (status) {
    const now = new Date();
    if (status === 'accepted')  this.set({ acceptedAt:  now });
    if (status === 'rejected')  this.set({ rejectedAt:  now });
    if (status === 'cancelled') this.set({ cancelledAt: now });
  }
  next();
});

/* ── Indexes ──────────────────────────────────────────────── */
/* Note: No UNIQUE constraint on (listing + seeker) — rebooking is allowed
   after cancellation or rejection. The controller enforces "no duplicate
   pending/accepted" via query, not DB-level unique constraint. */
bookingSchema.index({ listing:   1 });
bookingSchema.index({ seeker:    1 });
bookingSchema.index({ owner:     1 });
bookingSchema.index({ status:    1 });
bookingSchema.index({ createdAt: -1 });
/* Compound indexes for dashboard queries */
bookingSchema.index({ listing: 1, seeker: 1 });          // duplicate check
bookingSchema.index({ owner:   1, status: 1, createdAt: -1 }); // owner dashboard
bookingSchema.index({ seeker:  1, status: 1, createdAt: -1 }); // seeker dashboard

module.exports = mongoose.model('Booking', bookingSchema);
