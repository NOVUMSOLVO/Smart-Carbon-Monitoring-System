/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */
const mongoose = require('mongoose');
const { logger } = require('../utils/logger.enhanced');
const { AppError, ValidationError } = require('../utils/errors');
const config = require('../../config/config.enhanced');

/**
 * Convert various error types to standardized AppError format
 * @param {Error} err - The error to convert
 * @returns {AppError} Converted error
 */
const normalizeError = (err) => {
  // Already an AppError instance
  if (err instanceof AppError) {
    return err;
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError' && err instanceof mongoose.Error.ValidationError) {
    const validationErrors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return new ValidationError(
      'Validation failed',
      validationErrors
    );
  }
  
  // Mongoose cast error (e.g., invalid ObjectId)
  if (err.name === 'CastError' && err instanceof mongoose.Error.CastError) {
    return new ValidationError(
      `Invalid value for ${err.path}`,
      [{
        field: err.path,
        message: `Invalid ${err.kind}`
      }]
    );
  }
  
  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return new ValidationError(
      'Duplicate value not allowed',
      [{
        field,
        message: `${field} already exists`
      }]
    );
  }
  
  // JSON parsing error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return new ValidationError(
      'Invalid JSON format',
      [{
        field: 'body',
        message: 'Invalid JSON syntax'
      }]
    );
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, 'ERR-AUTH-TOKEN');
  }
  
  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401, 'ERR-AUTH-EXPIRED');
  }
  
  // Default: treat as internal server error
  return new AppError(
    err.message || 'Internal server error',
    err.statusCode || 500,
    err.code || 'ERR-SERVER',
    false
  );
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Normalize the error
  const normalizedError = normalizeError(err);
  
  // Log the error with appropriate level
  const logLevel = normalizedError.isOperational ? 'warn' : 'error';
  
  logger.log(logLevel, `${normalizedError.statusCode} - ${normalizedError.message}`, {
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    errorCode: normalizedError.errorCode,
    stackTrace: normalizedError.stack
  });
  
  // Send response
  const errorResponse = {
    status: 'error',
    code: normalizedError.errorCode,
    message: normalizedError.message
  };
  
  // Add validation errors if available
  if (normalizedError instanceof ValidationError && normalizedError.validationErrors) {
    errorResponse.errors = normalizedError.validationErrors;
  }
  
  // Include stack trace in development mode
  if (config.app.isDevelopment && !normalizedError.isOperational) {
    errorResponse.stack = normalizedError.stack;
  }
  
  // Send the response
  res.status(normalizedError.statusCode).json(errorResponse);
};

/**
 * Catch uncaught exceptions (sync)
 */
const setupUncaughtExceptionHandler = () => {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', {
      error: {
        message: err.message,
        stack: err.stack
      }
    });
    
    // In case of an uncaught exception, shut down the server gracefully
    console.log('Uncaught exception, shutting down...');
    process.exit(1);
  });
};

/**
 * Catch unhandled promise rejections (async)
 */
const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED PROMISE REJECTION', {
      error: {
        message: err.message,
        stack: err.stack
      }
    });
    
    // In case of an unhandled rejection, log the error but don't shut down
    console.log('Unhandled promise rejection, continuing execution...');
  });
};

/**
 * Handle SIGTERM signal for graceful shutdown
 */
const setupGracefulShutdown = (server) => {
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received. Closing server gracefully...');
    
    // Close server, but let existing connections complete
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    
    // Force close if it takes too long
    setTimeout(() => {
      logger.error('Forcing server close');
      process.exit(1);
    }, 10000); // 10 seconds
  });
};

// Export middleware and setup functions
module.exports = {
  errorHandler,
  setupUncaughtExceptionHandler,
  setupUnhandledRejectionHandler,
  setupGracefulShutdown
};
