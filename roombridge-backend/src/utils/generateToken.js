const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT and set it as an httpOnly cookie on `res`.
 *
 * BUG FIX: The original used `sameSite: 'strict'` unconditionally.
 * With 'strict', the browser NEVER sends the cookie on cross-origin requests
 * — even with CORS credentials: true — because the frontend (localhost:5173)
 * and backend (localhost:5000) are different origins in development.
 *
 * FIX: Use sameSite: 'none' + secure: true for cross-origin (production),
 *      and sameSite: 'lax' + secure: false for same-origin (development).
 *      'lax' allows top-level navigations and most requests but blocks
 *      cross-site POSTs (sufficient protection for dev).
 *
 * @param {string} userId - MongoDB ObjectId as string
 * @param {object} res    - Express response object
 * @returns {string}      - The signed JWT
 */
const generateToken = (userId, res) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const isProd  = process.env.NODE_ENV === 'production';
  const maxAge  = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  res.cookie('jwt', token, {
    httpOnly: true,
    secure:   isProd,          // HTTPS only in production
    sameSite: isProd ? 'none' : 'lax',  // 'none' for cross-origin prod, 'lax' for dev
    maxAge,
    path:     '/',
  });

  return token;
};

/**
 * Generate a refresh JWT (not stored in cookie — caller decides storage).
 * Used for long-lived sessions where access token rotation is needed.
 *
 * @param {string} userId
 * @returns {string} - Signed refresh token (30-day expiry)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Clear the auth cookie on logout.
 * Must use identical options as generateToken() for the browser to accept the clear.
 *
 * @param {object} res - Express response object
 */
const clearToken = (res) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('jwt', '', {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires:  new Date(0),    // Immediately expire
    path:     '/',
  });
};

module.exports = { generateToken, generateRefreshToken, clearToken };
