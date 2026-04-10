/**
 * Standardised API response helpers.
 * Every controller must use these — no raw res.json() calls.
 *
 * Response envelope shapes:
 *
 *  Success:    { success: true,  message, data }
 *  Error:      { success: false, message, errors: [] }
 *  Paginated:  { success: true,  message, data: [...], pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage } }
 */

/**
 * Send a success response.
 *
 * @param {object} res        - Express response
 * @param {number} statusCode - HTTP status (default 200)
 * @param {string} message    - Human-readable message
 * @param {*}      data       - Payload (object, array, etc.)
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response.
 *
 * @param {object} res        - Express response
 * @param {number} statusCode - HTTP status (default 500)
 * @param {string} message    - Human-readable error message
 * @param {Array}  errors     - Validation / field-level errors (optional)
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * Send a paginated list response.
 *
 * BUG FIX: The frontend listingService.js and other consumers access `res.data`
 * (the top-level array) and `res.pagination`. This shape is correct and
 * intentional — callers must use `Array.isArray(res.data)` to get items.
 * This was correctly documented in ListingsPage.jsx after the previous fix.
 *
 * @param {object} res     - Express response
 * @param {string} message - Human-readable message
 * @param {Array}  data    - Array of items for this page
 * @param {number} page    - Current page (1-indexed)
 * @param {number} limit   - Items per page
 * @param {number} total   - Total matching documents across all pages
 */
const paginatedResponse = (res, message, data, page, limit, total) => {
  const totalPages  = limit > 0 ? Math.ceil(total / limit) : 0;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return res.status(200).json({
    success: true,
    message,
    data,           // array of items (top-level — NOT nested under data.data)
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
