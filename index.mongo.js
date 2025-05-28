/**
 * Main application entry point
 * Smart Carbon Monitoring System
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./src/database/connection');
const { logger } = require('./src/utils/logger');

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.info('MongoDB connection successful');
  })
  .catch(err => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

// Routes
const dataRoutes = require('./src/services/dataRoutes.mongoose');
app.use('/api/carbon', dataRoutes);

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await require('./src/database/connection').closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await require('./src/database/connection').closeConnection();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes
