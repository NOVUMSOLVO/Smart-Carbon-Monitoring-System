/**
 * Carbon Data Model
 * Represents the schema for carbon emission data
 */
class CarbonData {
  constructor(data) {
    this.id = data.id || generateId();
    this.timestamp = data.timestamp || new Date();
    this.buildingId = data.buildingId;
    this.deviceId = data.deviceId;
    this.energyConsumption = data.energyConsumption || 0;
    this.carbonEmissions = data.carbonEmissions || 0;
    this.temperature = data.temperature;
    this.humidity = data.humidity;
    this.metadata = data.metadata || {};
  }

  // Validate the data
  validate() {
    // Basic validation
    if (!this.buildingId) {
      throw new Error('Building ID is required');
    }

    if (this.energyConsumption < 0) {
      throw new Error('Energy consumption cannot be negative');
    }

    if (this.carbonEmissions < 0) {
      throw new Error('Carbon emissions cannot be negative');
    }

    return true;
  }
}

// Helper function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = CarbonData;
