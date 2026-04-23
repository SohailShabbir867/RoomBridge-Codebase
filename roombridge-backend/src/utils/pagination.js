/**
 * Pagination utility helpers.
 *
 * Usage:
 *   const { page, limit, skip } = getPaginationParams(req.query);
 *   const meta = getPaginationMeta(totalDocs, page, limit);
 */

/**
 * Extract and clamp pagination params from query string.
 * @param {Object} query - req.query
 * @param {Object} [defaults] - { defaultPage, defaultLimit, maxLimit }
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPaginationParams = (query = {}, defaults = {}) => {
  const { defaultPage = 1, defaultLimit = 12, maxLimit = 50 } = defaults;

  const page = Math.max(1, parseInt(query.page) || defaultPage);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(query.limit) || defaultLimit),
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build pagination metadata for API response.
 * @param {number} total - Total documents matching the filter
 * @param {number} page  - Current page number
 * @param {number} limit - Items per page
 * @returns {{ total, page, limit, totalPages, hasNextPage, hasPrevPage }}
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { getPaginationParams, getPaginationMeta };
