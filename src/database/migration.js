/**
 * Data Migration Script
 * Migrates in-memory data to MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../database/connection');
const CarbonDataModel = require('../models/CarbonData.mongoose');
const { getAllCarbonData } = require('../services/dataService');
const { logger } = require('../utils/logger');

/**
 * Migrates existing in-memory data to MongoDB
 */
const migrateData = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Get all in-memory data
    const inMemoryData = getAllCarbonData();
    
    if (Array.isArray(inMemoryData) && inMemoryData.length > 0) {
      logger.info(`Found ${inMemoryData.length} records to migrate`);

      // Prepare data for bulk insert
      const dataToInsert = inMemoryData.map(item => {
        const { id, ...data } = item; // Remove the old id as MongoDB will create _id
        return data;
      });

      // Bulk insert
      const result = await CarbonDataModel.insertMany(dataToInsert);
      logger.info(`Successfully migrated ${result.length} records to MongoDB`);
    } else {
      logger.info('No data to migrate');
    }

    // Disconnect from the database
    await mongoose.connection.close();
    logger.info('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the migration
migrateData();
