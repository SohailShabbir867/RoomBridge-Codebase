/**
 * Extra sanitization layer on top of express-mongo-sanitize and xss-clean.
 *
 * 1. Trims all string values in req.body / req.query / req.params
 * 2. Strips keys containing $ or . (NoSQL injection vectors)
 * 3. Escapes basic HTML entities in string values
 */

const escapeHtml = (str) =>
  str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#x27;");

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const cleaned = {};
  for (const key of Object.keys(obj)) {
    // Remove keys containing $ or . (NoSQL injection)
    if (key.includes("$") || key.includes(".")) continue;

    const value = obj[key];

    if (typeof value === "string") {
      // Trim + escape HTML
      cleaned[key] = escapeHtml(value.trim());
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = sanitizeObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

const sanitize = (req, _res, next) => {
  if (req.body)   req.body   = sanitizeObject(req.body);
  if (req.query)  req.query  = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = { sanitize };
