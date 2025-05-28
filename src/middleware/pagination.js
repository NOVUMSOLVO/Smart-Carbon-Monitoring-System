/**
 * Pagination Middleware
 * Handles pagination parameters for API endpoints
 */

/**
 * Extract and validate pagination parameters from request query
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const paginationMiddleware = (req, res, next) => {
  // Default pagination parameters
  const defaultPage = 1;
  const defaultLimit = 20;
  const maxLimit = 100;  // Prevent excessive page sizes
  
  // Extract and validate page number
  let page = parseInt(req.query.page);
  if (isNaN(page) || page < 1) {
    page = defaultPage;
  }
  
  // Extract and validate page size (limit)
  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  }
  
  // Cap the limit to prevent excessive requests
  if (limit > maxLimit) {
    limit = maxLimit;
  }
  
  // Calculate skip value for database query
  const skip = (page - 1) * limit;
  
  // Extract and validate sort parameters
  let sortBy = req.query.sortBy || 'createdAt';
  let sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  
  // Add pagination parameters to request object
  req.pagination = {
    page,
    limit,
    skip,
    sortBy,
    sortOrder
  };
  
  next();
};

module.exports = paginationMiddleware;
