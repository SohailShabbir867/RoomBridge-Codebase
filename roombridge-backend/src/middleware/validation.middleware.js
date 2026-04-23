const { validationResult, body } = require("express-validator");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Run after express-validator chains.
 * If there are errors, return 400 with all messages.
 * Otherwise call next().
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array();
    const messages = details.map((e) => e.msg);
    return errorResponse(res, 400, "Validation failed.", messages);
  }
  next();
};

/* ── REGISTER VALIDATION RULES ── */
const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Name must be between 3 and 50 characters"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("role")
    .isIn(["seeker", "owner"])
    .withMessage("Role must be either seeker or owner"),

  body("phone")
    .optional()
    .trim()
    .customSanitizer((val) => (val ? val.replace(/[\s\-()]/g, "") : val))
    .matches(/^(\+92|0)[0-9]{10}$/)
    .withMessage(
      "Please provide a valid Pakistani phone number (e.g. 03001234567 or +923001234567)",
    ),

  body("city").trim().notEmpty().withMessage("City is required"),
];

/* ── LOGIN VALIDATION RULES ── */
const loginRules = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

/* ── UPDATE PASSWORD RULES ── */
const updatePasswordRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number"),
];

/* ── FORGOT PASSWORD RULES ── */
const forgotPasswordRules = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

/* ── RESET PASSWORD RULES ── */
const resetPasswordRules = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
];

/* ── LISTING VALIDATION RULES ── */
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

const listingRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 10, max: 100 })
    .withMessage("Title must be between 10 and 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 50, max: 2000 })
    .withMessage("Description must be between 50 and 2000 characters"),

  body("rent")
    .notEmpty()
    .withMessage("Rent amount is required")
    .isNumeric()
    .withMessage("Rent must be a number")
    .custom((val) => {
      const num = Number(val);
      if (num < 1000 || num > 500000) {
        throw new Error("Rent must be between PKR 1,000 and PKR 500,000");
      }
      return true;
    }),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isIn(PAKISTAN_CITIES)
    .withMessage("Please select a valid Pakistani city"),

  body("address").trim().notEmpty().withMessage("Address is required"),

  body("roomType")
    .notEmpty()
    .withMessage("Room type is required")
    .isIn(["single", "shared", "apartment"])
    .withMessage("Room type must be single, shared, or apartment"),

  body("genderPreference")
    .optional()
    .isIn(["any", "male", "female"])
    .withMessage("Gender preference must be any, male, or female"),

  body("availableFrom")
    .notEmpty()
    .withMessage("Available from date is required")
    .isISO8601()
    .withMessage("Please provide a valid date")
    .custom((val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error("Available from date cannot be in the past");
      }
      return true;
    }),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  updatePasswordRules,
  forgotPasswordRules,
  resetPasswordRules,
  listingRules,
};
