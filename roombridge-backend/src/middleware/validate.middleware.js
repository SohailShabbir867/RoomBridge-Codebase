const { validationResult } = require("express-validator");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Generic validation handler factory.
 * Takes an array of express-validator chains, returns middleware
 * that runs them all and returns 400 if any fail.
 *
 * Usage:
 *   const { body } = require("express-validator");
 *   router.post("/login", validate([
 *     body("email").isEmail().withMessage("Invalid email"),
 *     body("password").isLength({ min: 8 }),
 *   ]), loginController);
 */
const validate = (rules) => {
  return async (req, res, next) => {
    // Run all validation rules in parallel
    await Promise.all(rules.map((rule) => rule.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((e) => e.msg);
      return errorResponse(res, 400, "Validation failed.", messages);
    }
    next();
  };
};

module.exports = { validate };
