const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },
    /** A report targets EITHER a user OR a listing (mutually exclusive) */
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportedListing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      enum: {
        values: [
          "spam",
          "fake",
          "inappropriate",
          "scam",
          "harassment",
          "other",
        ],
        message: "Invalid reason",
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Min 20 characters"],
      maxlength: [500, "Max 500 characters"],
    },
    status: {
      type: String,
      default: "pending",
      enum: {
        values: ["pending", "reviewed", "resolved", "dismissed"],
        message: "Invalid status",
      },
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: [500, "Max 500 characters"],
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Pre-validate: enforce single target + no self-reporting ── */
reportSchema.pre("validate", function () {
  if (!this.reportedUser && !this.reportedListing) {
    throw new Error("A report must target either a user or a listing");
  }
  if (this.reportedUser && this.reportedListing) {
    throw new Error("Cannot target both a user and a listing");
  }
  if (
    this.reportedUser &&
    this.reporter &&
    this.reporter.toString() === this.reportedUser.toString()
  ) {
    throw new Error("You cannot report yourself");
  }
});

/* ── Pre-save: auto-set resolvedAt ─────────────────────── */
reportSchema.pre("save", function () {
  if (
    this.isModified("status") &&
    ["resolved", "dismissed"].includes(this.status) &&
    !this.resolvedAt
  ) {
    this.resolvedAt = new Date();
  }
});

/* ── Pre-findOneAndUpdate: auto-set resolvedAt ─────────── */
reportSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  const status = update?.status || update?.$set?.status;
  if (status && ["resolved", "dismissed"].includes(status)) {
    if (!update?.resolvedAt && !update?.$set?.resolvedAt) {
      this.set({ resolvedAt: new Date() });
    }
  }
});

/* ── Indexes ───────────────────────────────────────────── */
reportSchema.index({ reporter: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ reportedUser: 1 }, { sparse: true });
reportSchema.index({ reportedListing: 1 }, { sparse: true });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index(
  { reporter: 1, reportedUser: 1, status: 1 },
  { sparse: true },
);
reportSchema.index(
  { reporter: 1, reportedListing: 1, status: 1 },
  { sparse: true },
);

module.exports = mongoose.model("Report", reportSchema);
