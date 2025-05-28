/**
 * Carbon Data Schema
 * Mongoose schema for carbon emission data
 */
const mongoose = require('mongoose');

// Define the schema for carbon data
const carbonDataSchema = new mongoose.Schema({
  buildingId: {
    type: String,
    required: [true, 'Building ID is required'],
    index: true // Index for faster queries
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    index: true // Index for faster queries
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // Index for time-series queries
  },
  energyConsumption: {
    type: Number,
    required: [true, 'Energy consumption is required'],
    min: [0, 'Energy consumption cannot be negative'],
  },
  carbonEmissions: {
    type: Number,
    required: [true, 'Carbon emissions are required'],
    min: [0, 'Carbon emissions cannot be negative'],
  },
  temperature: {
    type: Number,
  },
  humidity: {
    type: Number,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true, // Automatically create createdAt and updatedAt fields
  versionKey: false // Don't include the __v field
});

// Compound index for queries that filter by both buildingId and date range
carbonDataSchema.index({ buildingId: 1, timestamp: 1 });

// Create a text index for search functionality
carbonDataSchema.index({
  buildingId: 'text',
  deviceId: 'text'
});

// Instance methods
carbonDataSchema.methods = {
  // Any additional methods can be added here
};

// Static methods
carbonDataSchema.statics = {
  /**
   * Find data by date range
   * @param {Date} startDate - Start date for filtering
   * @param {Date} endDate - End date for filtering
   * @returns {Promise<Array>} - Array of carbon data entries
   */
  findByDateRange: function(startDate, endDate) {
    return this.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timestamp: 1 });
  },

  /**
   * Find data for a specific building
   * @param {String} buildingId - The building ID to filter by
   * @returns {Promise<Array>} - Array of carbon data entries for the building
   */
  findByBuilding: function(buildingId) {
    return this.find({ buildingId }).sort({ timestamp: -1 });
  },

  /**
   * Find data for a specific device
   * @param {String} deviceId - The device ID to filter by
   * @returns {Promise<Array>} - Array of carbon data entries for the device
   */
  findByDevice: function(deviceId) {
    return this.find({ deviceId }).sort({ timestamp: -1 });
  }
};

// Pre-save hook for data validation or transformation
carbonDataSchema.pre('save', function(next) {
  // Any pre-save operations can be added here
  next();
});

const CarbonData = mongoose.model('CarbonData', carbonDataSchema);

module.exports = CarbonData;
