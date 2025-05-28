/**
 * Enhanced Logging Module
 * Provides structured logging with rotation and multiple transports
 */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('../config/config.enhanced');
const { createHash } = require('crypto');

// Create logs directory if it doesn't exist
const logsDir = config.logging.directory;
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Generate a unique request ID
const generateRequestId = () => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  return createHash('sha256').update(`${timestamp}-${randomString}`).digest('hex').substring(0, 8);
};

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create file transport with rotation
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: config.logging.level
});

// Create console transport
const consoleTransport = new winston.transports.Console({
  level: config.app.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
      const idStr = requestId ? `[${requestId}] ` : '';
      const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
      return `${timestamp} ${level}: ${idStr}${message}${metaStr}`;
    })
  )
});

// Create transports array based on configuration
const transports = [];

if (config.logging.console) {
  transports.push(consoleTransport);
}

if (config.logging.file) {
  transports.push(fileRotateTransport);
}

// Create error log transport
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error'
});

// Only log error level and above to the error log
if (config.logging.file) {
  transports.push(errorFileRotateTransport);
}

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: config.app.name },
  transports,
  exitOnError: false
});

// Create HTTP request logger middleware
const requestLogger = (req, res, next) => {
  // Generate a unique request ID for tracing
  req.requestId = generateRequestId();
  
  // Record start time
  const startTime = Date.now();
  
  // Log the request
  logger.http(`Incoming request`, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(logLevel, `Request completed`, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });
  });
  
  next();
};

// Create error logger
const errorLogger = (err, req, res, next) => {
  logger.error(`Request error`, {
    requestId: req.requestId || generateRequestId(),
    method: req.method,
    url: req.originalUrl,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      status: err.status || 500
    }
  });
  
  next(err);
};

// Create audit logger for security and important operations
const auditLogger = (action, userId, details = {}) => {
  logger.info(`AUDIT: ${action}`, {
    audit: true,
    userId,
    action,
    timestamp: new Date(),
    ...details
  });
};

// Export the logger and middleware
module.exports = {
  logger,
  requestLogger,
  errorLogger,
  auditLogger
};
