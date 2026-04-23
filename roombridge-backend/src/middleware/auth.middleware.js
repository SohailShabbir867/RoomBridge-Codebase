const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { errorResponse } = require("../utils/apiResponse");

/**
 * protect — Require a valid JWT.
 *
 * Reads token from:
 *   1. httpOnly cookie named 'jwt'   (preferred — secure)
 *   2. Authorization: Bearer <token> (fallback — for API clients)
 *
 * The original select() string used '-passwordResetToken -passwordResetExpires'
 * but the actual Mongoose field names are 'resetPasswordToken' and 'resetPasswordExpire'
 * (no leading 'password', no trailing 's'). Wrong field names in select() silently do
 * nothing — those fields were being returned in req.user, leaking sensitive data.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Cookie (preferred)
    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    // 2. Authorization header fallback
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, 401, "Not authenticated. Please log in.");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user — exclude sensitive fields using CORRECT field names
    const user = await User.findById(decoded.id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );

    if (!user) {
      return errorResponse(
        res,
        401,
        "User belonging to this token no longer exists.",
      );
    }

    if (user.isBanned) {
      return errorResponse(
        res,
        403,
        `Your account has been suspended. Reason: ${user.bannedReason || "Contact support."}`,
      );
    }

    if (!user.isActive) {
      return errorResponse(
        res,
        403,
        "Your account is inactive. Please contact support.",
      );
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return errorResponse(res, 401, "Session expired. Please log in again.");
    }
    if (err.name === "JsonWebTokenError") {
      return errorResponse(res, 401, "Invalid token. Please log in again.");
    }
    return errorResponse(
      res,
      401,
      "Authentication failed. Please log in again.",
    );
  }
};

/**
 * optionalAuth — Attach req.user if a valid token is present.
 * Does NOT block the request if no token or invalid token.
 * Useful for public routes that enrich data for logged-in users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );

    if (user && !user.isBanned && user.isActive) {
      req.user = user;
    }
  } catch {
    // Silently ignore — optionalAuth never blocks the request
  }

  next();
};

module.exports = { protect, optionalAuth };
