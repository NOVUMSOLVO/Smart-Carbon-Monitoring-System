/**
 * Data Service
 * Handles the storage and retrieval of carbon data
 */

// In-memory data store for development
// In production, this would be replaced with a database
let carbonData = [];

/**
 * Create a new carbon data entry
 * @param {Object} data - The carbon data to store
 * @returns {Object} The stored carbon data with ID
 */
const createCarbonData = (data) => {
  const CarbonData = require('../models/CarbonData');
  const newData = new CarbonData(data);

  // Validate the data
  newData.validate();

  // Store the data
  carbonData.push(newData);
  return newData;
};

/**
 * Helper function for testing purposes to access the internal data store
 * @private
 * @returns {Array} The internal carbon data array
 */
const __getInternalDataForTesting = () => {
  return carbonData;
};

/**
 * Get all carbon data
 * @param {Object} filter - Optional filter parameters
 * @returns {Array} Array of carbon data entries
 */
const getAllCarbonData = (filter = {}) => {
  // Apply filters if provided
  let result = [...carbonData];

  if (filter.buildingId) {
    result = result.filter(data => data.buildingId === filter.buildingId);
  }

  if (filter.startDate && filter.endDate) {
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);
    result = result.filter(data => {
      const date = new Date(data.timestamp);
      return date >= start && date <= end;
    });
  }

  return result;
};

/**
 * Get carbon data by ID
 * @param {String} id - The ID of the carbon data to retrieve
 * @returns {Object|null} The carbon data or null if not found
 */
const getCarbonDataById = (id) => {
  return carbonData.find(data => data.id === id) || null;
};

/**
 * Update carbon data by ID
 * @param {String} id - The ID of the carbon data to update
 * @param {Object} updateData - The data to update
 * @returns {Object|null} The updated carbon data or null if not found
 */
const updateCarbonData = (id, updateData) => {
  const index = carbonData.findIndex(data => data.id === id);
  if (index === -1) return null;

  const CarbonData = require('../models/CarbonData');
  const updatedData = new CarbonData({ 
    ...carbonData[index], 
    ...updateData,
    id: carbonData[index].id // Ensure ID doesn't change
  });

  // Validate the data
  updatedData.validate();

  // Update the data
  carbonData[index] = updatedData;
  return updatedData;
};

/**
 * Delete carbon data by ID
 * @param {String} id - The ID of the carbon data to delete
 * @returns {Boolean} True if deleted, false if not found
 */
const deleteCarbonData = (id) => {
  const index = carbonData.findIndex(data => data.id === id);
  if (index === -1) return false;

  carbonData.splice(index, 1);
  return true;
};

module.exports = {
  createCarbonData,
  getAllCarbonData,
  getCarbonDataById,
  updateCarbonData,
  deleteCarbonData,
  __getInternalDataForTesting
};
