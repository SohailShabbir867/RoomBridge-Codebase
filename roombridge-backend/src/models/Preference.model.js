const mongoose = require("mongoose");

const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Quetta",
  "Faisalabad",
  "Multan",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Murree",
];

const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    sleepSchedule: {
      type: String,
      required: [true, "Sleep schedule is required"],
      enum: {
        values: ["early", "late", "flexible"],
        message: "Invalid sleep schedule",
      },
    },
    smoker: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    cleanliness: {
      type: Number,
      required: [true, "Cleanliness rating is required"],
      min: [1, "Min rating is 1"],
      max: [5, "Max rating is 5"],
    },
    occupation: {
      type: String,
      required: [true, "Occupation is required"],
      enum: {
        values: ["student", "professional"],
        message: "Invalid occupation",
      },
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: { values: ["male", "female"], message: "Invalid gender" },
    },
    /** What gender roommate this user prefers */
    genderPreference: {
      type: String,
      default: "any",
      enum: {
        values: ["male", "female", "any"],
        message: "Invalid gender preference",
      },
    },
    ageRange: {
      min: {
        type: Number,
        min: [16, "Min age is 16"],
        max: [80, "Max age is 80"],
      },
      max: {
        type: Number,
        min: [16, "Min age is 16"],
        max: [80, "Max age is 80"],
      },
      _id: false,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, "Bio cannot exceed 300 characters"],
    },
    budget: {
      type: Number,
      min: [1000, "Budget must be at least PKR 1,000"],
    },
    preferredCity: {
      type: String,
      trim: true,
      enum: {
        values: PAKISTAN_CITIES,
        message: "{VALUE} is not a supported city",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Pre-validate: ageRange.min ≤ ageRange.max ─────────── */
preferenceSchema.pre("validate", function () {
  if (
    this.ageRange?.min != null &&
    this.ageRange?.max != null &&
    this.ageRange.min > this.ageRange.max
  ) {
    throw new Error("ageRange.min must be ≤ ageRange.max");
  }
});

/* ── Indexes ───────────────────────────────────────────── */
preferenceSchema.index({ preferredCity: 1 }, { sparse: true });
preferenceSchema.index({ gender: 1 });
preferenceSchema.index({ occupation: 1 });
preferenceSchema.index({ genderPreference: 1 });

module.exports = mongoose.model("Preference", preferenceSchema);
