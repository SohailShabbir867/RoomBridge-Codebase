const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta',
  'Faisalabad', 'Multan', 'Hyderabad', 'Sialkot', 'Gujranwala',
  'Bahawalpur', 'Sargodha', 'Abbottabad', 'Murree',
];

/* ──────────────────────────────────────────────────────────
   BUG FIX: profilePhoto was defined as a plain object with `_id: false`
   inside it. In Mongoose, `_id: false` inside a plain nested object does NOT
   prevent Mongoose from adding _id — it only works when declared as a proper
   Schema with { _id: false } in schema options, or as a type-embedded object.
   Fix: use a nested schema with explicit `_id: false` in options.
────────────────────────────────────────────────────────── */
const profilePhotoSchema = new mongoose.Schema(
  {
    url:       { type: String, default: '' },
    public_id: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [3,  'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8,  'Password must be at least 8 characters'],
      select:    false,     // ← NEVER returned in queries by default
    },

    role: {
      type:    String,
      enum:    {
        values:  ['seeker', 'owner', 'admin'],
        message: 'Role must be seeker, owner, or admin',
      },
      default: 'seeker',
    },

    phone: {
      type:  String,
      trim:  true,
      match: [
        /^(\+92|0)[0-9]{10}$/,
        'Please provide a valid Pakistani phone number (e.g. 03001234567 or +923001234567)',
      ],
    },

    city: {
      type: String,
      trim: true,
      enum: { values: PAKISTAN_CITIES, message: '{VALUE} is not a supported city' },
    },

    /* BUG FIX: Use a proper sub-schema so _id is never generated.
       Plain object with `_id: false` inside does NOT suppress _id in Mongoose. */
    profilePhoto: {
      type:    profilePhotoSchema,
      default: () => ({ url: '', public_id: '' }),
    },

    // bio field — referenced in user.controller.js allowedFields and getAllSeekers select
    bio: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },

    isVerified:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true  },
    isBanned:     { type: Boolean, default: false },
    bannedReason: { type: String,  trim: true },

    /* BUG FIX: Field names MUST be resetPasswordToken / resetPasswordExpire
       (not passwordResetToken / passwordResetExpires).
       The auth.controller.js, auth.middleware.js, and getResetPasswordToken()
       all use these exact names. Wrong names would silently leave the fields
       undefined and tokens would never be found when resetting. */
    resetPasswordToken:      { type: String, select: false },
    resetPasswordExpire:     { type: Date,   select: false },
    verificationToken:       { type: String, select: false },
    verificationTokenExpire: { type: Date,   select: false },

    lastLogin: { type: Date },

    savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

/* ── Indexes ──────────────────────────────────────────────
   BUG FIX: Do NOT add `userSchema.index({ email: 1 }, { unique: true })`.
   The schema-level `unique: true` on email already creates this index.
   Adding it again creates a duplicate index — MongoDB logs warnings and
   wastes memory maintaining two identical indexes.
─────────────────────────────────────────────────────────── */
userSchema.index({ role:                      1  });
userSchema.index({ city:                      1  });
userSchema.index({ createdAt:                -1  });
userSchema.index({ role: 1, isActive: 1, isBanned: 1 });

/* ── Pre-save: hash password ────────────────────────────── */
userSchema.pre('save', async function () {
  // Trim name on every save that modifies it
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }

  // Only hash if password has changed — prevents re-hashing an already-hashed value
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

/* ── Instance methods ────────────────────────────────────── */

/**
 * Compare a plain-text password against the stored bcrypt hash.
 * This method is ONLY callable when the user was fetched with .select('+password').
 *
 * @param {string} enteredPassword - Plain text from login request
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    throw new Error('Password field not loaded. Use .select("+password") on the query.');
  }
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate a cryptographically secure password reset token.
 * Stores the SHA-256 hash in DB; returns the PLAIN token for the email link.
 *
 * BUG FIX: Token expiry was 10 minutes but the email template said "15 minutes".
 * Unified to 15 minutes to match the email (the auth controller checks $gt: Date.now()).
 *
 * @returns {string} - The plain (unhashed) token to embed in the reset URL
 */
userSchema.methods.getResetPasswordToken = function () {
  // Generate 32-byte random token → hex string (64 chars)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store only the HASH in DB — the plain token never touches the database
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // BUG FIX: was 10 * 60 * 1000 (10 min) but email says "15 minutes"
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken; // Return plain token — caller puts it in the email link
};

/**
 * Generate an email verification token.
 * Works exactly like password reset token — stores hash, returns plain.
 * Token expires in 24 hours.
 *
 * @returns {string} - Plain token for the verification link
 */
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return token;
};

module.exports = mongoose.model('User', userSchema);
