const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerification,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');

const {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  updatePasswordRules,
} = require('../middleware/validation.middleware');

/* ── Rate limiters ────────────────────────────────────────
   BUG FIX 1: standardHeaders: true is deprecated in express-rate-limit v8.
              Use 'draft-7' string to suppress deprecation warnings.

   BUG FIX 2: Register used the same limiter as login with skipSuccessfulRequests:true.
              This allowed unlimited registrations (each success resets the counter).
              Register needs its OWN limiter that counts ALL requests — success or fail.
              An attacker creating 100 accounts in a row should be rate-limited.

   BUG FIX 3: forgotPassword limiter had skipSuccessfulRequests implicitly false,
              which is correct — all reset attempts count toward the window.
              Made this explicit for clarity.
─────────────────────────────────────────────────────────── */

/**
 * Login limiter — counts only FAILED attempts.
 * 5 failed attempts per 15 minutes per IP before lockout.
 * Successful logins reset the counter (skipSuccessfulRequests: true).
 */
const loginLimiter = rateLimit({
  windowMs:               15 * 60 * 1000,
  max:                    5,
  standardHeaders:        'draft-7',
  legacyHeaders:          false,
  skipSuccessfulRequests: true,   // only count failed login attempts
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again in 15 minutes.',
  },
});

/**
 * Register limiter — counts ALL requests (success or fail).
 * 10 registrations per hour per IP.
 * skipSuccessfulRequests MUST be false — we want to limit mass registrations.
 */
const registerLimiter = rateLimit({
  windowMs:               60 * 60 * 1000, // 1 hour
  max:                    10,
  standardHeaders:        'draft-7',
  legacyHeaders:          false,
  skipSuccessfulRequests: false,  // count every registration attempt
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again in 1 hour.',
  },
});

/**
 * Forgot password limiter — counts ALL requests.
 * 5 attempts per hour per IP.
 * skipSuccessfulRequests MUST be false — both valid and invalid email attempts count.
 * Without this, an attacker can enumerate valid emails by sending 100 requests
 * (failures bump the counter, successes don't → keep sending to new valid emails).
 */
const forgotPasswordLimiter = rateLimit({
  windowMs:               60 * 60 * 1000,
  max:                    5,
  standardHeaders:        'draft-7',
  legacyHeaders:          false,
  skipSuccessfulRequests: false,  // all attempts count
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 1 hour.',
  },
});

/* ══════════════════════════════════════════════════════════
   PUBLIC ROUTES
══════════════════════════════════════════════════════════ */

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account and set JWT cookie
 * @access  Public
 */
router.post(
  '/register',
  registerLimiter,    // BUG FIX: separate, stricter limiter that counts all requests
  registerRules,
  validate,
  registerUser
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email + password and set JWT cookie
 * @access  Public
 */
router.post(
  '/login',
  loginLimiter,       // only counts failed attempts
  loginRules,
  validate,
  loginUser
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email (always same response — no enumeration)
 * @access  Public
 */
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  forgotPasswordRules,
  validate,
  forgotPassword
);

/**
 * @route   PUT /api/v1/auth/reset-password/:token
 * @desc    Reset password using the token from the reset email link
 * @access  Public
 *
 * No rate limiter here — the token itself is the rate limiter.
 * Each token is single-use and expires in 15 minutes.
 * The controller clears it immediately on use.
 */
router.put(
  '/reset-password/:token',
  resetPasswordRules,
  validate,
  resetPassword
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear JWT cookie and log the user out
 * @access  Public (intentionally — no protect middleware)
 *
 * BUG FIX: The original had `protect` middleware on logout.
 * If a user's JWT expired, protect() returned 401 and the cookie was
 * NEVER cleared — the user got stuck in a "logged in" state with no way out.
 * Logout only clears the cookie. No sensitive action. Must be public.
 */
router.post('/logout', logoutUser);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify user email with token from verification email
 * @access  Public
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post(
  '/resend-verification',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many resend attempts. Try again in 15 minutes.' },
  }),
  resendVerification
);

/* ══════════════════════════════════════════════════════════
   PROTECTED ROUTES  (require valid JWT)
══════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user profile with preferences + saved listings
 * @access  Protected
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/v1/auth/update-password
 * @desc    Change password (must provide current password to confirm identity)
 * @access  Protected
 */
router.put(
  '/update-password',
  protect,
  updatePasswordRules,
  validate,
  updatePassword
);

module.exports = router;
