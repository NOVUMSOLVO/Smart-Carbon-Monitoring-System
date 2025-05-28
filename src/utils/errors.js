/**
 * Custom Error Classes
 * Provides standardized error types for the application
 */

/**
 * Base API error class for consistent error handling
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || `ERR-${statusCode}`;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Capture stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * For 400 Bad Request errors - invalid input
 */
class BadRequestError extends AppError {
  constructor(message = 'Invalid request data', errorCode = 'ERR-VALIDATION') {
    super(message, 400, errorCode);
  }
}

/**
 * For 401 Unauthorized errors - authentication failure
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', errorCode = 'ERR-AUTH') {
    super(message, 401, errorCode);
  }
}

/**
 * For 403 Forbidden errors - authorization failure
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied', errorCode = 'ERR-PERMISSION') {
    super(message, 403, errorCode);
  }
}

/**
 * For 404 Not Found errors - resource not found
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = 'ERR-NOTFOUND') {
    super(message, 404, errorCode);
  }
}

/**
 * For 409 Conflict errors - resource conflicts
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errorCode = 'ERR-CONFLICT') {
    super(message, 409, errorCode);
  }
}

/**
 * For 422 Unprocessable Entity errors - validation failures
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', validationErrors = [], errorCode = 'ERR-VALIDATION') {
    super(message, 422, errorCode);
    this.validationErrors = validationErrors;
  }
}

/**
 * For 429 Too Many Requests - rate limiting
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later', errorCode = 'ERR-RATELIMIT') {
    super(message, 429, errorCode);
  }
}

/**
 * For 500 Internal Server Error - unexpected server errors
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error', errorCode = 'ERR-SERVER') {
    super(message, 500, errorCode, false);
  }
}

/**
 * For database connection errors
 */
class DatabaseError extends AppError {
  constructor(message = 'Database error', errorCode = 'ERR-DATABASE') {
    super(message, 500, errorCode, false);
  }
}

/**
 * For external service errors (e.g., third-party APIs)
 */
class ExternalServiceError extends AppError {
  constructor(message = 'External service error', errorCode = 'ERR-EXTERNAL') {
    super(message, 503, errorCode, false);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  ExternalServiceError
};
