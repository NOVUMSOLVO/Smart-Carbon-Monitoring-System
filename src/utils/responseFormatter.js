/**
 * Response Utility
 * Standardizes API responses
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Object|Array} data - Response data
 * @param {String} message - Success message
 */
const successResponse = (res, statusCode = 200, data = {}, message = 'Success') => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {String} errorCode - Error code
 * @param {Array} errors - Validation errors
 */
const errorResponse = (res, statusCode = 500, message = 'Error', errorCode = 'ERR-GENERIC', errors = null) => {
  const response = {
    status: 'error',
    code: errorCode,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination information
 * @param {String} message - Success message
 */
const paginatedResponse = (res, data = [], pagination = {}, message = 'Success') => {
  return res.status(200).json({
    status: 'success',
    message,
    pagination: {
      total: pagination.total || data.length,
      page: pagination.page || 1,
      limit: pagination.limit || data.length,
      pages: pagination.pages || 1
    },
    data
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};
