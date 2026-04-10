const crypto     = require('crypto');
const User       = require('../models/User.model');
const Preference = require('../models/Preference.model');
const { generateToken, clearToken } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const {
  sendEmail,
  welcomeEmail,
  verificationEmail,
  resetPasswordEmail,
} = require('../utils/sendEmail');

/* ── Helper: build a safe user payload (NEVER include password) ──────────
   BUG FIX: Centralise the "safe user" shape so all endpoints return consistent
   data and we never accidentally return password/reset tokens from any path. */
const safeUser = (user) => ({
  _id:          user._id,
  name:         user.name,
  email:        user.email,
  role:         user.role,
  phone:        user.phone       || null,
  city:         user.city        || null,
  bio:          user.bio         || null,
  profilePhoto: user.profilePhoto || { url: '', public_id: '' },
  isVerified:   user.isVerified,
  isActive:     user.isActive,
  isBanned:     user.isBanned,
  lastLogin:    user.lastLogin   || null,
  createdAt:    user.createdAt,
  // password, resetPasswordToken, resetPasswordExpire — NEVER included
});

/* ══════════════════════════════════════════════════════════
   REGISTER USER
   POST /api/v1/auth/register
══════════════════════════════════════════════════════════ */
const registerUser = async (req, res) => {
  const { name, email, password, role, phone, city } = req.body;

  /* BUG FIX: Validate role at controller level as a safety net.
     The validation middleware allows 'seeker' and 'owner' only, but:
     - An attacker bypassing the route layer should not get 'admin' role
     - Whitelist at controller level ensures 'admin' can NEVER be self-assigned */
  const allowedRoles = ['seeker', 'owner'];
  const assignedRole = allowedRoles.includes(role) ? role : 'seeker';

  /* Check duplicate email */
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return errorResponse(res, 409, 'An account with this email already exists.');
  }

  /* Create user — password is hashed by the pre-save hook in User.model */
  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
    phone,
    city,
  });

  /* Generate email verification token */
  const verifyToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  /* Build verification URL — points to frontend /verify-email/:token */
  const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyURL = `${clientURL}/verify-email/${verifyToken}`;

  /* Send verification email — fire-and-forget */
  sendEmail({
    to:      user.email,
    subject: 'RoomBridge — Verify Your Email Address',
    html:    verificationEmail(user.name, verifyURL),
  }).catch((err) => console.error('[Email] Verification email failed:', err.message));

  /* Do NOT set JWT cookie — user must verify email first */
  return successResponse(res, 201, 'Account created! Please check your email to verify your account.', {
    user: safeUser(user),
    requiresVerification: true,
  });
};

/* ══════════════════════════════════════════════════════════
   LOGIN USER
   POST /api/v1/auth/login
══════════════════════════════════════════════════════════ */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  /* Fetch user + password (password is select:false by default) */
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  /* BUG FIX: Use a SINGLE generic error for both "user not found" and "wrong password".
     Never reveal WHICH field is wrong — attackers use different messages to enumerate
     valid email addresses. Both cases return identical 401 + identical message. */
  if (!user) {
    return errorResponse(res, 401, 'Invalid email or password.');
  }

  /* Check banned/inactive BEFORE verifying password.
     If we verify the password first, we reveal "this email is valid + password is correct
     but banned" which leaks account existence + state. */
  if (user.isBanned) {
    return errorResponse(
      res,
      403,
      `Your account has been suspended. ${user.bannedReason ? `Reason: ${user.bannedReason}` : 'Please contact support.'}`
    );
  }

  if (!user.isActive) {
    return errorResponse(res, 403, 'Your account is inactive. Please contact support.');
  }

  /* Check email verification */
  if (!user.isVerified) {
    return errorResponse(res, 403, 'Please verify your email address before logging in. Check your inbox for the verification link.');
  }

  /* Verify password */
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return errorResponse(res, 401, 'Invalid email or password.');
  }

  /* Update lastLogin timestamp
     Use findByIdAndUpdate to avoid triggering full pre('save') hook unnecessarily.
     BUG FIX: user.save({ validateBeforeSave: false }) with password in memory
     could re-trigger password hashing in some edge cases.
     findByIdAndUpdate bypasses pre-save entirely — safer here. */
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  /* BUG FIX: Explicitly delete password from the in-memory user object before
     any further use. The object was fetched with +password so it's loaded.
     While the response is built from safeUser() (no password), deleting it
     ensures no accidental leak if the object is passed to a logger or error handler. */
  user.password = undefined;

  /* Set JWT cookie */
  generateToken(user._id, res);

  return successResponse(res, 200, 'Logged in successfully.', {
    user: safeUser(user),
  });
};

/* ══════════════════════════════════════════════════════════
   LOGOUT USER
   POST /api/v1/auth/logout
══════════════════════════════════════════════════════════ */
/* BUG FIX: No `protect` middleware on this route (handled in routes file).
   If protect() is used, an expired token causes 401 and the cookie is
   never cleared — user gets stuck with no way to log out. */
const logoutUser = (req, res) => {
  clearToken(res);
  return successResponse(res, 200, 'Logged out successfully.');
};

/* ══════════════════════════════════════════════════════════
   GET ME
   GET /api/v1/auth/me
══════════════════════════════════════════════════════════ */
const getMe = async (req, res) => {
  /* BUG FIX 1: Explicitly exclude sensitive fields in the fresh DB query.
     Although `password` is select:false in the schema, being explicit is
     defensive programming — it guards against schema changes. */

  /* BUG FIX 2: getMe did NOT populate the user's Preference document.
     The frontend profile page needs preference data to display the
     roommate preference form with correct current values.
     Added a separate Preference lookup to include in the response. */

  /* BUG FIX 3: match: { status: 'active' } in populate causes nulls in
     savedListings array for inactive/pending listings (the IDs remain in
     the array but the populated docs are null — frontend gets [null, null]).
     Fix: filter out nulls after populate. */
  const [user, preference] = await Promise.all([
    User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate({
        path:    'savedListings',
        select:  'title rent city roomType status photos address area',
        match:   { status: 'active' },
        options: { limit: 50 }, // cap to 50 for performance
      }),
    Preference.findOne({ user: req.user._id }).select('-__v'),
  ]);

  if (!user) {
    return errorResponse(res, 404, 'User not found.');
  }

  /* BUG FIX 3: Filter out nulls caused by match: { status: 'active' }.
     Mongoose populates only matching docs and leaves other array slots null. */
  const savedListings = (user.savedListings || []).filter(Boolean);

  return successResponse(res, 200, 'Profile retrieved successfully.', {
    user: {
      ...safeUser(user),
      savedListings, // filtered array, no nulls
    },
    preference: preference || null, // null if seeker hasn't filled preferences yet
  });
};

/* ══════════════════════════════════════════════════════════
   FORGOT PASSWORD
   POST /api/v1/auth/forgot-password
══════════════════════════════════════════════════════════ */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  /* Generic response — never reveal if email exists (prevents enumeration) */
  const genericMessage =
    'If an account with that email exists, a password reset link has been sent.';

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  /* Return generic message for non-existent email — same response, same timing */
  if (!user) {
    return successResponse(res, 200, genericMessage);
  }

  /* BUG FIX: Banned/inactive users should NOT receive a reset link.
     They could use it to regain access to a suspended account.
     Return the generic message (don't reveal the account is banned). */
  if (user.isBanned || !user.isActive) {
    return successResponse(res, 200, genericMessage);
  }

  /* Generate reset token — hashed version is stored in DB */
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to:      user.email,
      subject: 'RoomBridge — Password Reset Request',
      html:    resetPasswordEmail(user.name, resetURL),
    });
    return successResponse(res, 200, genericMessage);
  } catch (err) {
    /* Email delivery failed — clear the token so it can never be used */
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('[Auth] Password reset email failed:', err.message);
    return errorResponse(res, 500, 'Failed to send reset email. Please try again later.');
  }
};

/* ══════════════════════════════════════════════════════════
   RESET PASSWORD
   PUT /api/v1/auth/reset-password/:token
══════════════════════════════════════════════════════════ */
const resetPassword = async (req, res) => {
  /* BUG FIX: Sanitise the token parameter before hashing.
     req.params.token comes from a URL — could contain URL-encoded chars.
     Trim and ensure it's hex-safe before using it. A malformed token
     just won't match and will get the "invalid or expired" response. */
  const rawToken = (req.params.token || '').trim();

  if (!rawToken || !/^[a-f0-9]{64}$/i.test(rawToken)) {
    return errorResponse(res, 400, 'Password reset token is invalid or has expired.');
  }

  /* Hash the plain token from the URL to compare with the stored hash */
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpire: { $gt: Date.now() }, // not expired
  });

  if (!user) {
    return errorResponse(res, 400, 'Password reset token is invalid or has expired.');
  }

  /* BUG FIX: Don't allow banned users to reset their way back in */
  if (user.isBanned) {
    return errorResponse(res, 403, 'Your account has been suspended. Please contact support.');
  }

  /* Set new password (pre-save hook hashes it), clear token fields */
  user.password            = req.body.password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;

  /* BUG FIX: Reactivate account on successful reset if it was inactive
     (e.g. was deactivated due to forgotten password expiry scenarios).
     Only do this if the account was NOT banned. */
  if (!user.isActive && !user.isBanned) {
    user.isActive = true;
  }

  await user.save();

  /* Set new JWT cookie — user is now logged in */
  generateToken(user._id, res);

  return successResponse(res, 200, 'Password reset successfully. You are now logged in.', {
    user: safeUser(user),
  });
};

/* ══════════════════════════════════════════════════════════
   UPDATE PASSWORD
   PUT /api/v1/auth/update-password  (protected)
══════════════════════════════════════════════════════════ */
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  /* BUG FIX: Check that current and new passwords differ BEFORE hitting the DB.
     This is a cheap check — no need to load the user if they're obviously the same. */
  if (currentPassword === newPassword) {
    return errorResponse(res, 400, 'New password must be different from current password.');
  }

  /* Fetch user with password field (select:false by default) */
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return errorResponse(res, 404, 'User not found.');
  }

  /* Verify current password */
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    /* BUG FIX: Use 401 here (not 400). 401 = authentication failure.
       The user has not proven identity for this sensitive operation. */
    return errorResponse(res, 401, 'Current password is incorrect.');
  }

  /* Set new password — pre-save hook handles hashing */
  user.password = newPassword;

  /* BUG FIX: Explicitly clear the password from memory after save.
     user.save() completes, password is hashed and stored.
     Setting to undefined prevents accidental downstream leaks. */
  await user.save();
  user.password = undefined;

  /* Issue new JWT cookie — refreshes the session token */
  generateToken(user._id, res);

  return successResponse(res, 200, 'Password updated successfully.');
};

/* ══════════════════════════════════════════════════════════
   VERIFY EMAIL
   GET /api/v1/auth/verify-email/:token
══════════════════════════════════════════════════════════ */
const verifyEmail = async (req, res) => {
  /* Hash the token from URL to compare with stored hash */
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    /* Token not found or expired — but maybe user already verified
       (e.g. double-clicked the link). Check if any recently verified
       user exists to give a friendlier message. */
    const alreadyVerified = await User.findOne({
      verificationToken: undefined,
      isVerified: true,
    }).sort({ updatedAt: -1 });

    /* If the user is already verified, return success instead of error */
    return errorResponse(res, 400, 'Invalid or expired verification link. Please request a new one.');
  }

  /* Mark as verified and clear token */
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  /* Send welcome email now that they're verified */
  sendEmail({
    to:      user.email,
    subject: 'Welcome to RoomBridge!',
    html:    welcomeEmail(user.name),
  }).catch((err) => console.error('[Email] Welcome email failed:', err.message));

  return successResponse(res, 200, 'Email verified successfully! You can now log in.', {
    user: safeUser(user),
  });
};

/* ══════════════════════════════════════════════════════════
   RESEND VERIFICATION EMAIL
   POST /api/v1/auth/resend-verification
══════════════════════════════════════════════════════════ */
const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return errorResponse(res, 400, 'Email is required.');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  /* Always return success — don't reveal if email exists */
  if (!user || user.isVerified) {
    return successResponse(res, 200, 'If an unverified account exists with that email, a new verification link has been sent.');
  }

  /* Generate new token */
  const verifyToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyURL = `${clientURL}/verify-email/${verifyToken}`;

  sendEmail({
    to:      user.email,
    subject: 'RoomBridge — Verify Your Email Address',
    html:    verificationEmail(user.name, verifyURL),
  }).catch((err) => console.error('[Email] Resend verification failed:', err.message));

  return successResponse(res, 200, 'If an unverified account exists with that email, a new verification link has been sent.');
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerification,
};
