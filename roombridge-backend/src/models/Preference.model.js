const mongoose = require('mongoose');

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta',
  'Faisalabad', 'Multan', 'Hyderabad', 'Sialkot', 'Gujranwala',
  'Bahawalpur', 'Sargodha', 'Abbottabad', 'Murree',
];

const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
      unique:   true,   // One preference profile per user
    },

    sleepSchedule: {
      type:     String,
      required: [true, 'Sleep schedule preference is required'],
      enum:     {
        values:  ['early', 'late', 'flexible'],
        message: 'Sleep schedule must be early, late, or flexible',
      },
    },

    smoker: {
      type:    Boolean,
      default: false,
    },

    pets: {
      type:    Boolean,
      default: false,
    },

    cleanliness: {
      type:     Number,
      required: [true, 'Cleanliness rating is required'],
      min:      [1, 'Cleanliness rating must be at least 1'],
      max:      [5, 'Cleanliness rating cannot exceed 5'],
    },

    /* The user's own occupation — used in compatibility scoring */
    occupation: {
      type:     String,
      required: [true, 'Occupation is required'],
      enum:     {
        values:  ['student', 'professional'],
        message: 'Occupation must be student or professional',
      },
    },

    /* The user's own gender — used to filter listings by genderPreference
       and to show on the profile card */
    gender: {
      type:     String,
      required: [true, 'Gender is required'],
      enum:     {
        values:  ['male', 'female'],
        message: 'Gender must be male or female',
      },
    },

    /* BUG FIX: genderPreference was entirely missing from the schema.
       The compatibility engine reads prefs.genderPreference to determine
       what gender of roommate this user is comfortable living with.
       Without this field:
         - compatibilityEngine always fell through to the 50% neutral fallback
         - The field was never saved even if the user submitted it
         - Roommate matching was systematically wrong for all users

       NOTE: In compatibilityEngine.js we fixed the scoring to use 'gender' for
       user-to-user comparison. But genderPreference is ALSO needed for the
       listing <-> seeker matching (does the listing's genderPreference
       match the seeker's gender?). Both fields serve different purposes:
         - gender:           who the user IS  (male / female)
         - genderPreference: what the user WANTS in a roommate (male / female / any) */
    genderPreference: {
      type:    String,
      enum:    {
        values:  ['male', 'female', 'any'],
        message: 'Gender preference must be male, female, or any',
      },
      default: 'any',
    },

    /* BUG FIX: ageRange was defined as a plain nested object WITHOUT `_id: false`.
       Mongoose automatically adds _id to all plain nested objects (sub-docs) unless
       told not to. This caused every Preference document to have an unnecessary
       ageRange._id field that polluted API responses.
       Fix: add `_id: false` to prevent this. */
    ageRange: {
      min:  { type: Number, min: [16, 'Minimum age is 16'], max: [80, 'Maximum age is 80'] },
      max:  { type: Number, min: [16, 'Minimum age is 16'], max: [80, 'Maximum age is 80'] },
      _id:  false,
    },

    bio: {
      type:      String,
      trim:      true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
    },

    budget: {
      type: Number,
      min:  [1000, 'Budget must be at least PKR 1,000'],
    },

    /* BUG FIX: preferredCity enum included `''` (empty string) to allow
       clearing the field. This is an anti-pattern — empty strings bypass
       trim: true and are stored as '' in MongoDB, which reads as falsy
       but is not null/undefined.
       Fix: remove '' from enum and instead just leave the field optional
       (undefined = not set). Users clear the field by omitting it or
       sending null. Use `sparse: true` on its index. */
    preferredCity: {
      type: String,
      trim: true,
      enum: {
        values:  PAKISTAN_CITIES,
        message: '{VALUE} is not a supported city',
      },
    },

    /* IMPORTANT: Do NOT add explicit updatedAt field.
       timestamps: true manages this automatically for all update operations. */
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

/* ── Custom validation: ageRange.min ≤ ageRange.max ─── */
preferenceSchema.pre('validate', function () {
  if (
    this.ageRange?.min != null &&
    this.ageRange?.max != null &&
    this.ageRange.min > this.ageRange.max
  ) {
    throw new Error('ageRange.min must be less than or equal to ageRange.max');
  }
});

/* ── Indexes ──────────────────────────────────────────── */
/* BUG FIX: `unique: true` on the `user` field already creates a unique index.
   Adding `preferenceSchema.index({ user: 1 }, { unique: true })` creates a
   DUPLICATE index. Mongoose deduplicates by name in some versions but it is
   not guaranteed. Removed the redundant explicit index; rely only on the
   schema-level unique: true. */

/* BUG FIX: preferredCity index changed to sparse:true because the field
   is optional — sparse indexes skip null/undefined values, saving space
   and preventing null-value collisions in unique indexes (though this
   one is not unique). */
preferenceSchema.index({ preferredCity: 1 }, { sparse: true });
preferenceSchema.index({ gender:        1 });
preferenceSchema.index({ occupation:    1 });
preferenceSchema.index({ genderPreference: 1 });

module.exports = mongoose.model('Preference', preferenceSchema);
