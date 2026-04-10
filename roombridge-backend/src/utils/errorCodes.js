/**
 * Centralised error code constants.
 * Use these in controllers to keep messages consistent.
 */

const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: "Invalid email or password.",
  USER_NOT_FOUND:      "User not found.",
  UNAUTHORIZED:        "Not authorized. Please log in.",
  FORBIDDEN:           "Access forbidden. Insufficient permissions.",
  BANNED:              "Your account has been suspended.",
  TOKEN_EXPIRED:       "Session expired. Please log in again.",
  TOKEN_INVALID:       "Invalid token.",

  // Listings
  LISTING_NOT_FOUND:   "Listing not found.",
  LISTING_INACTIVE:    "This listing is not currently active.",

  // Bookings
  BOOKING_NOT_FOUND:   "Booking not found.",
  BOOKING_EXISTS:      "You already have a pending or accepted request for this listing.",
  BOOKING_SELF:        "You cannot book your own listing.",

  // Messages
  MESSAGE_SELF:        "You cannot send a message to yourself.",
  CONVERSATION_DENIED: "You are not a participant in this conversation.",

  // Reports
  REPORT_DUPLICATE:    "You have already submitted a pending report for this target.",
  REPORT_SELF:         "You cannot report yourself.",

  // General
  VALIDATION_FAILED:   "Validation failed.",
  SERVER_ERROR:        "Internal server error. Please try again later.",
  NOT_FOUND:           "The requested resource was not found.",
  RATE_LIMITED:        "Too many requests. Please try again later.",
};

module.exports = { ERROR_CODES };
