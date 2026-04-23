const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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

/** Sub-schema for profile photo (no auto _id) */
const profilePhotoSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    public_id: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      default: "seeker",
      enum: {
        values: ["seeker", "owner", "admin"],
        message: "Role must be seeker, owner, or admin",
      },
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^(\+92|0)[0-9]{10}$/,
        "Please provide a valid Pakistani phone number",
      ],
    },
    city: {
      type: String,
      trim: true,
      enum: {
        values: PAKISTAN_CITIES,
        message: "{VALUE} is not a supported city",
      },
    },
    profilePhoto: {
      type: profilePhotoSchema,
      default: () => ({ url: "", public_id: "" }),
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    bannedReason: { type: String, trim: true },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    verificationToken: { type: String, select: false },
    verificationTokenExpire: { type: Date, select: false },

    lastLogin: { type: Date },
    savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Indexes ───────────────────────────────────────────── */
userSchema.index({ role: 1 });
userSchema.index({ city: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, isActive: 1, isBanned: 1 });

/* ── Pre-save: hash password ───────────────────────────── */
userSchema.pre("save", async function () {
  if (this.isModified("name")) this.name = this.name.trim();
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* ── Instance methods ──────────────────────────────────── */

/** Compare plain-text password against stored bcrypt hash */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    throw new Error(
      'Password field not loaded. Use .select("+password") on the query.',
    );
  }
  return bcrypt.compare(enteredPassword, this.password);
};

/** Generate password reset token (stores hash, returns plain token) */
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
  return resetToken;
};

/** Generate email verification token (stores hash, returns plain token) */
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hrs
  return token;
};

module.exports = mongoose.model("User", userSchema);
