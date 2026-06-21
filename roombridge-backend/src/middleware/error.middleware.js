const { errorResponse } = require("../utils/apiResponse");

/**
 * Global error handler — must be the LAST middleware in app.js.
 * All errors passed via next(err) land here.
 *
 * The original had no `next` parameter usage but Express requires
 * exactly 4 parameters (err, req, res, next) to recognise it as an error handler.
 * If the function signature has < 4 params, Express treats it as a regular middleware.
 * This was already correct in the original, but we ensure it explicitly.
 *
 * BUG FIX 2: `err.statusCode` check was placed AFTER the dev-only full-response block,
 * meaning operational errors with explicit status codes were getting the full stack trace
 * response in development instead of their clean message. Reordered for correct priority.
 */
const errorHandler = (err, req, res, _next) => {
  const timestamp = new Date().toISOString();
  const isDev = process.env.NODE_ENV !== "production";

  console.error(
    `[${timestamp}] ❌ ${req.method} ${req.originalUrl} — ${err.message}`,
  );
  if (isDev) console.error(err.stack);

  // ── Mongoose: invalid ObjectId ──────────────────────
  if (err.name === "CastError") {
    return errorResponse(res, 400, `Invalid ID format: "${err.value}".`);
  }

  // ── MongoDB: duplicate key ───────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const cap = field.charAt(0).toUpperCase() + field.slice(1);
    return errorResponse(
      res,
      409,
      `${cap} already exists. Please use a different value.`,
    );
  }

  // ── Mongoose: schema validation ──────────────────────
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 422, "Validation failed.", errors);
  }

  // ── JWT: expired ────────────────────────────────────
  if (err.name === "TokenExpiredError") {
    return errorResponse(res, 401, "Session expired. Please log in again.");
  }

  // ── JWT: invalid ────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, 401, "Invalid token. Please log in again.");
  }

  // ── Multer: file too large ───────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    return errorResponse(
      res,
      413,
      "File too large. Maximum allowed size is 5 MB.",
    );
  }

  // ── Multer: unsupported file type ────────────────────
  if (err.code === "INVALID_FILE_TYPE") {
    return errorResponse(res, 415, err.message || "Unsupported file type.");
  }

  // ── CORS error ──────────────────────────────────────
  if (err.message && err.message.startsWith("CORS:")) {
    return errorResponse(res, 403, err.message);
  }

  // ── Operational error with explicit statusCode ───────
  // must check this BEFORE the dev-expose block so that
  // operational errors get their correct status, not 500
  if (err.statusCode && err.isOperational) {
    return errorResponse(res, err.statusCode, err.message);
  }

  // ── Development: expose full message + stack ─────────
  if (isDev) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }

  // ── Production fallback ──────────────────────────────
  return errorResponse(
    res,
    500,
    "Something went wrong on our end. Please try again later.",
  );
};

/**
 * 404 handler — mount AFTER all routes, BEFORE errorHandler.
 * Silently returns 404 for known bot scanner paths to avoid log noise.
 */
const BOT_PATTERNS = ['.git', '.env', 'wp-admin', 'wp-login', 'phpunit', 'eval-stdin', '.php', 'cgi-bin'];
const notFound = (req, res, next) => {
  if (BOT_PATTERNS.some(p => req.originalUrl.includes(p))) {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  err.isOperational = true;
  next(err);
};

module.exports = { errorHandler, notFound };
