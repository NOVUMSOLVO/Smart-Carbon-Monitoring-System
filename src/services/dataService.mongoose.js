/**
 * Data Service
 * Handles business logic for carbon data operations
 */

const carbonDataRepository = require('../repositories/carbonDataRepository');
const { logger } = require('../utils/logger');

/**
 * Create a new carbon data entry
 * @param {Object} data - The carbon data to store
 * @returns {Promise<Object>} The stored carbon data
 */
const createCarbonData = async (data) => {
  try {
    return await carbonDataRepository.create(data);
  } catch (error) {
    logger.error(`Error in createCarbonData service: ${error.message}`);
    throw error;
  }
};

/**
 * Get all carbon data with optional filtering
 * @param {Object} filter - Optional filter parameters
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Object containing data array and pagination info
 */
const getAllCarbonData = async (filter = {}, options = {}) => {
  try {
    return await carbonDataRepository.findAll(filter, options);
  } catch (error) {
    logger.error(`Error in getAllCarbonData service: ${error.message}`);
    throw error;
  }
};

/**
 * Get carbon data by ID
 * @param {String} id - The ID of the carbon data to retrieve
 * @returns {Promise<Object|null>} The carbon data or null if not found
 */
const getCarbonDataById = async (id) => {
  try {
    return await carbonDataRepository.findById(id);
  } catch (error) {
    logger.error(`Error in getCarbonDataById service: ${error.message}`);
    throw error;
  }
};

/**
 * Update carbon data by ID
 * @param {String} id - The ID of the carbon data to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object|null>} The updated carbon data or null if not found
 */
const updateCarbonData = async (id, updateData) => {
  try {
    return await carbonDataRepository.update(id, updateData);
  } catch (error) {
    logger.error(`Error in updateCarbonData service: ${error.message}`);
    throw error;
  }
};

/**
 * Delete carbon data by ID
 * @param {String} id - The ID of the carbon data to delete
 * @returns {Promise<Boolean>} True if deleted, false if not found
 */
const deleteCarbonData = async (id) => {
  try {
    return await carbonDataRepository.delete(id);
  } catch (error) {
    logger.error(`Error in deleteCarbonData service: ${error.message}`);
    throw error;
  }
};

/**
 * Get statistics for carbon data
 * @param {Object} filter - Filter parameters
 * @returns {Promise<Object>} Aggregated statistics
 */
const getCarbonStatistics = async (filter = {}) => {
  try {
    return await carbonDataRepository.getStatistics(filter);
  } catch (error) {
    logger.error(`Error in getCarbonStatistics service: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createCarbonData,
  getAllCarbonData,
  getCarbonDataById,
  updateCarbonData,
  deleteCarbonData,
  getCarbonStatistics
};
