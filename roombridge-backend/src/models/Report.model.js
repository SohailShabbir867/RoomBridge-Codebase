const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reporter reference is required'],
    },

    /* A report targets EITHER reportedUser OR reportedListing.
       Mutual exclusivity is enforced in the pre('validate') hook. */
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },

    reportedListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Listing',
    },

    reason: {
      type:     String,
      required: [true, 'Report reason is required'],
      enum:     {
        values:  ['spam', 'fake', 'inappropriate', 'scam', 'harassment', 'other'],
        message: 'Reason must be one of: spam, fake, inappropriate, scam, harassment, other',
      },
    },

    description: {
      type:      String,
      required:  [true, 'Description is required'],
      trim:      true,
      minlength: [20,  'Description must be at least 20 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    status: {
      type:    String,
      enum:    {
        values:  ['pending', 'reviewed', 'resolved', 'dismissed'],
        message: 'Status must be pending, reviewed, resolved, or dismissed',
      },
      default: 'pending',
    },

    adminNote: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Admin note cannot exceed 500 characters'],
    },

    /* The admin user who reviewed/resolved this report */
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

/* ── Pre-validate: enforce single target + no self-reporting ── */
reportSchema.pre('validate', function () {
  /* Must target at least one entity */
  if (!this.reportedUser && !this.reportedListing) {
    throw new Error('A report must target either a user or a listing');
  }

  /* Cannot target both simultaneously */
  if (this.reportedUser && this.reportedListing) {
    throw new Error('A report cannot target both a user and a listing simultaneously');
  }

  /* Reporter cannot self-report */
  if (
    this.reportedUser &&
    this.reporter &&
    this.reporter.toString() === this.reportedUser.toString()
  ) {
    throw new Error('You cannot report yourself');
  }
});

/* ── Pre-save: auto-set resolvedAt on status change ────────── */
reportSchema.pre('save', function () {
  if (
    this.isModified('status') &&
    ['resolved', 'dismissed'].includes(this.status) &&
    !this.resolvedAt
  ) {
    this.resolvedAt = new Date();
  }
});

/* ── Pre-findOneAndUpdate: auto-set resolvedAt ──────────────
   BUG FIX: pre('save') does NOT run on findByIdAndUpdate / findOneAndUpdate.
   The admin controller uses findByIdAndUpdate to update report status.
   Without this hook, resolvedAt was never set when resolving reports via the API.
   Fix: mirror the pre('save') logic in a findOneAndUpdate middleware. */
reportSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();
  /* Support both direct { status: '...' } and $set: { status: '...' } patterns */
  const status = update?.status || update?.$set?.status;

  if (
    status &&
    ['resolved', 'dismissed'].includes(status)
  ) {
    /* Check that resolvedAt isn't already set in the update itself */
    const hasResolvedAt = update?.resolvedAt || update?.$set?.resolvedAt;
    if (!hasResolvedAt) {
      this.set({ resolvedAt: new Date() });
    }
  }
});

/* ── Indexes ──────────────────────────────────────────────── */
reportSchema.index({ reporter:        1  });
reportSchema.index({ status:          1  });
reportSchema.index({ createdAt:      -1  });
reportSchema.index({ reportedUser:    1  }, { sparse: true }); // sparse: field is optional
reportSchema.index({ reportedListing: 1  }, { sparse: true }); // sparse: field is optional

/* Compound indexes for admin queue */
reportSchema.index({ status: 1, createdAt: -1 });

/* Compound indexes for duplicate detection
   (same reporter, same target, same status) */
reportSchema.index({ reporter: 1, reportedUser:    1, status: 1 }, { sparse: true });
reportSchema.index({ reporter: 1, reportedListing: 1, status: 1 }, { sparse: true });

module.exports = mongoose.model('Report', reportSchema);
