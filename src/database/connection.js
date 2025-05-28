/**
 * Database Connection Module
 * Handles connection to MongoDB using Mongoose
 */
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * Connect to MongoDB with retry mechanism
 * @param {string} url - MongoDB connection string
 * @param {Object} options - Connection options
 * @returns {Promise} Mongoose connection
 */
const connectDB = async (url = process.env.MONGODB_URI, options = {}) => {
  const defaultOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    maxPoolSize: 10, // Maintain up to 10 socket connections
  };
  
  const connectionOptions = { ...defaultOptions, ...options };
  
  try {
    const conn = await mongoose.connect(url, connectionOptions);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add event listeners
    mongoose.connection.on('error', err => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected, attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    // Implement retry logic
    logger.info('Retrying connection in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectDB(url, options);
  }
};

/**
 * Close MongoDB connection gracefully
 * @returns {Promise} Promise that resolves when connection is closed
 */
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  closeConnection
};
