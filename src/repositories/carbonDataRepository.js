/**
 * Carbon Data Repository
 * Handles database operations for Carbon Data
 */
const CarbonDataModel = require('../models/CarbonData.mongoose');
const { logger } = require('../utils/logger');

class CarbonDataRepository {
  /**
   * Create a new carbon data entry
   * @param {Object} data - The carbon data to store
   * @returns {Promise<Object>} The stored carbon data
   */
  async create(data) {
    try {
      const newData = new CarbonDataModel(data);
      await newData.save();
      logger.info(`Created carbon data entry: ${newData._id}`);
      return newData;
    } catch (error) {
      logger.error(`Error creating carbon data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all carbon data with optional filtering
   * @param {Object} filter - Optional filter parameters
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Array>} Array of carbon data entries
   */
  async findAll(filter = {}, options = {}) {
    try {
      const query = this._buildQuery(filter);

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Apply sorting
      const sortBy = options.sortBy || 'timestamp';
      const sortOrder = options.sortOrder || -1; // Default to descending (newest first)
      const sort = { [sortBy]: sortOrder };

      // Execute query with pagination and sorting
      const data = await CarbonDataModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Get total count for pagination metadata
      const totalCount = await CarbonDataModel.countDocuments(query);

      logger.info(`Retrieved ${data.length} carbon data entries (page ${page}, total: ${totalCount})`);
      
      return {
        data,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      logger.error(`Error retrieving carbon data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get carbon data by ID
   * @param {String} id - The ID of the carbon data to retrieve
   * @returns {Promise<Object|null>} The carbon data or null if not found
   */
  async findById(id) {
    try {
      const data = await CarbonDataModel.findById(id);
      if (!data) {
        logger.warn(`Carbon data not found: ${id}`);
        return null;
      }
      logger.info(`Retrieved carbon data: ${id}`);
      return data;
    } catch (error) {
      logger.error(`Error retrieving carbon data by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update carbon data by ID
   * @param {String} id - The ID of the carbon data to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object|null>} The updated carbon data or null if not found
   */
  async update(id, updateData) {
    try {
      const data = await CarbonDataModel.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, // Return the updated document
          runValidators: true // Run model validators
        }
      );
      
      if (!data) {
        logger.warn(`Carbon data not found for update: ${id}`);
        return null;
      }
      
      logger.info(`Updated carbon data: ${id}`);
      return data;
    } catch (error) {
      logger.error(`Error updating carbon data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete carbon data by ID
   * @param {String} id - The ID of the carbon data to delete
   * @returns {Promise<Boolean>} True if deleted, false if not found
   */
  async delete(id) {
    try {
      const result = await CarbonDataModel.findByIdAndDelete(id);
      
      if (!result) {
        logger.warn(`Carbon data not found for deletion: ${id}`);
        return false;
      }
      
      logger.info(`Deleted carbon data: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting carbon data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get aggregate statistics for carbon data
   * @param {Object} filter - Filter parameters for aggregation
   * @returns {Promise<Object>} Aggregated statistics
   */
  async getStatistics(filter = {}) {
    try {
      const query = this._buildQuery(filter);
      
      const stats = await CarbonDataModel.aggregate([
        { $match: query },
        { 
          $group: {
            _id: null,
            totalEmissions: { $sum: "$carbonEmissions" },
            totalEnergy: { $sum: "$energyConsumption" },
            avgEmissions: { $avg: "$carbonEmissions" },
            avgEnergy: { $avg: "$energyConsumption" },
            maxEmissions: { $max: "$carbonEmissions" },
            minEmissions: { $min: "$carbonEmissions" },
            count: { $sum: 1 }
          }
        }
      ]);

      logger.info(`Retrieved carbon statistics for ${stats.length > 0 ? stats[0].count : 0} entries`);
      
      return stats.length > 0 ? stats[0] : {
        totalEmissions: 0,
        totalEnergy: 0,
        avgEmissions: 0,
        avgEnergy: 0,
        maxEmissions: 0,
        minEmissions: 0,
        count: 0
      };
    } catch (error) {
      logger.error(`Error retrieving carbon statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build database query from filter parameters
   * @private
   * @param {Object} filter - Filter parameters
   * @returns {Object} MongoDB query object
   */
  _buildQuery(filter) {
    const query = {};

    if (filter.buildingId) {
      query.buildingId = filter.buildingId;
    }

    if (filter.deviceId) {
      query.deviceId = filter.deviceId;
    }

    if (filter.startDate && filter.endDate) {
      query.timestamp = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate)
      };
    } else if (filter.startDate) {
      query.timestamp = { $gte: new Date(filter.startDate) };
    } else if (filter.endDate) {
      query.timestamp = { $lte: new Date(filter.endDate) };
    }

    // Add minimum energy consumption filter if provided
    if (filter.minEnergy !== undefined) {
      query.energyConsumption = { $gte: filter.minEnergy };
    }

    // Add minimum carbon emissions filter if provided
    if (filter.minEmissions !== undefined) {
      query.carbonEmissions = { $gte: filter.minEmissions };
    }

    return query;
  }
}

module.exports = new CarbonDataRepository();
