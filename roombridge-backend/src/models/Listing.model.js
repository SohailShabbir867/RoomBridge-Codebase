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

const FEATURE_NAMES = [
  "wifi",
  "ac",
  "parking",
  "kitchen",
  "laundry",
  "water",
  "electricity",
  "security",
  "generator",
  "cctv",
];

/* ── Sub-schemas (no auto _id) ─────────────────────────── */

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: [true, "Photo URL is required"] },
    public_id: {
      type: String,
      required: [true, "Cloudinary public_id is required"],
    },
  },
  { _id: false },
);

const featureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Feature name is required"],
      enum: {
        values: FEATURE_NAMES,
        message: "{VALUE} is not a valid feature",
      },
    },
    available: { type: Boolean, default: true },
  },
  { _id: false },
);

const nearbyPlaceSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    distance: { type: String, trim: true },
    type: { type: String, trim: true },
  },
  { _id: false },
);

const roommatePreferencesSchema = new mongoose.Schema(
  {
    sleepSchedule: {
      type: String,
      enum: {
        values: ["early", "late", "flexible", "any"],
        message: "Invalid sleep schedule",
      },
    },
    smoker: { type: Boolean },
    pets: { type: Boolean },
    occupation: {
      type: String,
      enum: {
        values: ["student", "professional", "any"],
        message: "Invalid occupation",
      },
    },
    gender: {
      type: String,
      default: "any",
      enum: {
        values: ["male", "female", "any"],
        message: "Invalid gender preference",
      },
    },
  },
  { _id: false },
);

/* ── Main Schema ───────────────────────────────────────── */

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [50, "Description must be at least 50 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    rent: {
      type: Number,
      required: [true, "Rent is required"],
      min: [1000, "Rent must be at least PKR 1,000"],
      max: [500000, "Rent cannot exceed PKR 500,000"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      enum: {
        values: PAKISTAN_CITIES,
        message: "{VALUE} is not a supported city",
      },
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    area: { type: String, trim: true },
    photos: {
      type: [photoSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one photo is required",
      },
    },
    furnished: { type: Boolean, default: false },
    roomType: {
      type: String,
      required: [true, "Room type is required"],
      enum: {
        values: ["single", "shared", "apartment"],
        message: "Invalid room type",
      },
    },
    genderPreference: {
      type: String,
      default: "any",
      enum: {
        values: ["any", "male", "female"],
        message: "Invalid gender preference",
      },
    },
    availableFrom: {
      type: Date,
      required: [true, "Available from date is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    status: {
      type: String,
      default: "pending",
      enum: {
        values: ["pending", "active", "inactive", "rejected"],
        message: "Invalid status",
      },
    },
    rejectionReason: { type: String, trim: true },

    features: { type: [featureSchema], default: [] },
    nearbyPlaces: { type: [nearbyPlaceSchema], default: [] },
    roommatePreferences: {
      type: roommatePreferencesSchema,
      default: () => ({}),
    },

    views: { type: Number, default: 0, min: 0 },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Indexes ───────────────────────────────────────────── */
listingSchema.index({ title: "text", description: "text" });
listingSchema.index({ city: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ rent: 1 });
listingSchema.index({ owner: 1 });
listingSchema.index({ roomType: 1 });
listingSchema.index({ genderPreference: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ owner: 1, status: 1, createdAt: -1 });

/* ── Virtual ───────────────────────────────────────────── */
listingSchema.virtual("isAvailable").get(function () {
  return (
    this.status === "active" &&
    (!this.availableFrom || this.availableFrom <= new Date())
  );
});

module.exports = mongoose.model("Listing", listingSchema);
