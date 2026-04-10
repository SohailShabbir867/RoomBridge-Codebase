const { errorResponse } = require('../utils/apiResponse');

/**
 * authorize(...roles) — Role-based access control middleware.
 *
 * Must be used AFTER `protect` middleware since it depends on req.user.
 *
 * BUG FIX: The original was missing a guard for the case where both `protect`
 * AND `authorize` are stacked, but `protect` calls next(err) instead of
 * returning — if `protect` does errorResponse() and returns, `authorize`
 * never runs. That flow is correct. However, if somehow req.user is undefined
 * (e.g. `authorize` used without `protect`) the error message was misleading.
 *
 * FIX: Guard for !req.user with a clear message pointing to misconfiguration.
 *
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'owner', 'seeker')
 * @returns {Function} Express middleware
 *
 * @example
 *   router.post('/', protect, authorize('owner', 'admin'), createListing);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // This means authorize() was used without protect() — developer error
      return errorResponse(
        res,
        401,
        'Not authenticated. Ensure the protect middleware is applied before authorize.'
      );
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`
      );
    }

    next();
  };
};

module.exports = { authorize };
