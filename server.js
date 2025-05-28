/**
 * Production-Ready Server
 * Smart Carbon Monitoring System
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { rateLimit } = require('express-rate-limit');

// Import enhanced modules
const config = require('./config/config.enhanced');
const { connectDB } = require('./src/database/connection');
const { logger, requestLogger, errorLogger } = require('./src/utils/logger.enhanced');
const { 
  errorHandler, 
  setupUncaughtExceptionHandler, 
  setupUnhandledRejectionHandler,
  setupGracefulShutdown 
} = require('./src/middleware/errorHandler');

// Set up global error handlers
setupUncaughtExceptionHandler();
setupUnhandledRejectionHandler();

// Initialize express
const app = express();

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors(config.security.cors));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      code: 'ERR-RATELIMIT',
      message: 'Too many requests, please try again later'
    });
  }
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
connectDB(config.mongo.uri, config.mongo.options)
  .then(() => {
    logger.info(`MongoDB connected: ${config.mongo.uri}`);
  })
  .catch(err => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

// API Routes
const authRoutes = require('./src/services/authRoutes');
const userRoutes = require('./src/services/userRoutes');
const dataRoutes = require('./src/services/dataRoutes.mongoose');

// Mount routes with versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/carbon', dataRoutes);

// API documentation route
app.get('/api/v1', (req, res) => {
  res.json({
    name: config.app.name,
    version: config.app.version,
    environment: config.app.environment,
    endpoints: {
      authentication: '/api/v1/auth',
      users: '/api/v1/users',
      carbonData: '/api/v1/carbon'
    }
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'ERR-NOTFOUND',
    message: 'Resource not found'
  });
});

// Error logging and handling
app.use(errorLogger);
app.use(errorHandler);

// Start server
const PORT = config.app.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.app.environment} mode on port ${PORT}`);
  console.log(`Server running in ${config.app.environment} mode on port ${PORT}`);
});

// Set up graceful shutdown
setupGracefulShutdown(server);

// Export for testing
module.exports = app;
