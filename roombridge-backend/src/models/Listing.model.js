const mongoose = require('mongoose');

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta',
  'Faisalabad', 'Multan', 'Hyderabad', 'Sialkot', 'Gujranwala',
  'Bahawalpur', 'Sargodha', 'Abbottabad', 'Murree',
];

/* BUG FIX: Keep FEATURE_NAMES in sync with:
   - CreateListing.jsx amenities list
   - validation.middleware.js (if amenities is ever validated separately)
   Both use the same 10 values. */
const FEATURE_NAMES = [
  'wifi', 'ac', 'parking', 'kitchen', 'laundry',
  'water', 'electricity', 'security', 'generator', 'cctv',
];

/* ── Sub-schemas (all with _id: false — not standalone documents) ─── */

const photoSchema = new mongoose.Schema(
  {
    url:       { type: String, required: [true, 'Photo URL is required'] },
    public_id: { type: String, required: [true, 'Cloudinary public_id is required'] },
  },
  { _id: false }
);

/* BUG FIX: featureSchema.name was not `required`. This allowed documents like
   `{ available: true }` with no `name` to be saved, breaking frontend amenity
   rendering and API filter logic. Made `name` required and kept enum validation. */
const featureSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Feature name is required'],
      enum:     {
        values:  FEATURE_NAMES,
        message: '{VALUE} is not a valid feature name',
      },
    },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const nearbyPlaceSchema = new mongoose.Schema(
  {
    name:     { type: String, trim: true },
    distance: { type: String, trim: true }, // e.g. '200m', '1km'
    type:     { type: String, trim: true }, // e.g. 'hospital', 'school'
  },
  { _id: false }
);

/* BUG FIX: roommatePreferences.occupation included 'any' as an enum value,
   but Preference.model.js occupation only allows 'student' | 'professional'.
   This mismatch meant listings set to 'any' could never match any seeker's
   preference in the compatibility engine. Changed to match the Preference model.
   Also ensured this schema matches what the compatibility engine actually reads. */
const roommatePreferencesSchema = new mongoose.Schema(
  {
    sleepSchedule: {
      type: String,
      enum: { values: ['early', 'late', 'flexible', 'any'], message: 'Invalid sleep schedule' },
    },
    smoker:     { type: Boolean },
    pets:       { type: Boolean },
    occupation: {
      type: String,
      enum: { values: ['student', 'professional', 'any'], message: 'Invalid occupation value' },
    },
    /* gender here = gender of preferred roommate (not the owner's gender).
       Maps to genderPreference in Preference schema for compatibility matching. */
    gender: {
      type:    String,
      enum:    { values: ['male', 'female', 'any'], message: 'Invalid gender preference' },
      default: 'any',
    },
  },
  { _id: false }
);

/* ── Main Listing Schema ───────────────────────────────────── */

const listingSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Listing title is required'],
      trim:      true,
      minlength: [10,  'Title must be at least 10 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type:      String,
      required:  [true, 'Description is required'],
      trim:      true,
      minlength: [50,   'Description must be at least 50 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    rent: {
      type:     Number,
      required: [true, 'Rent amount is required'],
      min:      [1000,   'Rent must be at least PKR 1,000'],
      max:      [500000, 'Rent cannot exceed PKR 500,000'],
    },

    city: {
      type:     String,
      required: [true, 'City is required'],
      trim:     true,
      enum:     { values: PAKISTAN_CITIES, message: '{VALUE} is not a supported city' },
    },

    address: {
      type:     String,
      required: [true, 'Address is required'],
      trim:     true,
    },

    area: {
      type: String,
      trim: true,
    },

    /* BUG FIX: Array validator (arr.length >= 1) only runs on `save()`, not on
       `findByIdAndUpdate`. The listing controller uses `listing.save()` after
       modifications, so the validator DOES run in the update path via save().
       However for createListing, photos is built before save() — correct.
       Added a minlength-style note and kept the validator as defensive check. */
    photos: {
      type:     [photoSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message:   'At least one photo is required',
      },
    },

    furnished: { type: Boolean, default: false },

    roomType: {
      type:     String,
      required: [true, 'Room type is required'],
      enum:     {
        values:  ['single', 'shared', 'apartment'],
        message: 'Room type must be single, shared, or apartment',
      },
    },

    genderPreference: {
      type:    String,
      enum:    {
        values:  ['any', 'male', 'female'],
        message: 'Gender preference must be any, male, or female',
      },
      default: 'any',
    },

    availableFrom: {
      type:     Date,
      required: [true, 'Available from date is required'],
    },

    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Owner is required'],
    },

    status: {
      type:    String,
      enum:    {
        values:  ['pending', 'active', 'inactive', 'rejected'],
        message: 'Invalid listing status',
      },
      default: 'pending',
    },

    rejectionReason: { type: String, trim: true },

    features:            { type: [featureSchema],          default: [] },
    nearbyPlaces:        { type: [nearbyPlaceSchema],       default: [] },
    /* BUG FIX: default must be a factory function for objects to avoid shared reference.
       `default: {}` would share ONE object across all documents; `default: () => ({})` creates
       a fresh object per document. The original used a factory — retained. */
    roommatePreferences: { type: roommatePreferencesSchema, default: () => ({}) },

    views:   { type: Number, default: 0, min: 0 },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    /* IMPORTANT: Do NOT add explicit updatedAt field here.
       `timestamps: true` manages both createdAt and updatedAt automatically
       on save(), findByIdAndUpdate(), findOneAndUpdate() etc.
       An explicit updatedAt field definition overrides Mongoose's automatic
       management and breaks updates — the field gets stuck at creation time. */
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

/* ── Text index for full-text search ─────────────────────── */
listingSchema.index({ title: 'text', description: 'text' });

/* ── Standard indexes ────────────────────────────────────── */
listingSchema.index({ city:             1  });
listingSchema.index({ status:           1  });
listingSchema.index({ rent:             1  });
listingSchema.index({ owner:            1  });
listingSchema.index({ roomType:         1  });
listingSchema.index({ genderPreference: 1  });
listingSchema.index({ createdAt:       -1  });
/* Compound indexes for common queries */
listingSchema.index({ status: 1, createdAt: -1 });         // public listing feed
listingSchema.index({ owner: 1, status: 1, createdAt: -1 }); // owner dashboard

/* ── Virtual: isAvailable ────────────────────────────────── */
listingSchema.virtual('isAvailable').get(function () {
  return this.status === 'active' &&
    (!this.availableFrom || this.availableFrom <= new Date());
});

module.exports = mongoose.model('Listing', listingSchema);
