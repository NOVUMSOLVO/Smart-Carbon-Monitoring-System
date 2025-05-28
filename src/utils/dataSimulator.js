/**
 * Data Simulator
 * Generates simulated carbon data for testing and demonstration purposes
 */

const { createCarbonData } = require('../services/dataService');
const { logger } = require('./logger');

// Sample building IDs
const buildings = [
  { id: 'B-101', name: 'City Hall', type: 'government' },
  { id: 'B-102', name: 'Community Center', type: 'public' },
  { id: 'B-103', name: 'Public Library', type: 'public' },
  { id: 'B-104', name: 'Police Station', type: 'government' },
  { id: 'B-105', name: 'Fire Station', type: 'government' },
];

// Sample device IDs
const devices = [
  { id: 'D-001', type: 'hvac' },
  { id: 'D-002', type: 'lighting' },
  { id: 'D-003', type: 'power' },
  { id: 'D-004', type: 'water' },
];

/**
 * Generate a random number between min and max
 * @param {Number} min - Minimum value
 * @param {Number} max - Maximum value
 * @param {Number} decimals - Number of decimal places
 * @returns {Number} Random number
 */
function randomNumber(min, max, decimals = 0) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

/**
 * Generate simulated carbon data for a single reading
 * @returns {Object} Simulated carbon data
 */
function generateSimulatedReading() {
  const building = buildings[Math.floor(Math.random() * buildings.length)];
  const device = devices[Math.floor(Math.random() * devices.length)];
  
  // Generate realistic values based on device type
  let energyConsumption, carbonEmissions, temperature, humidity;
  
  switch(device.type) {
    case 'hvac':
      energyConsumption = randomNumber(10, 50, 2);
      carbonEmissions = energyConsumption * randomNumber(0.2, 0.5, 2);
      temperature = randomNumber(18, 24, 1);
      humidity = randomNumber(40, 60, 1);
      break;
    case 'lighting':
      energyConsumption = randomNumber(2, 15, 2);
      carbonEmissions = energyConsumption * randomNumber(0.1, 0.3, 2);
      temperature = randomNumber(20, 25, 1);
      humidity = randomNumber(35, 55, 1);
      break;
    case 'power':
      energyConsumption = randomNumber(30, 100, 2);
      carbonEmissions = energyConsumption * randomNumber(0.3, 0.6, 2);
      temperature = randomNumber(22, 28, 1);
      humidity = randomNumber(30, 50, 1);
      break;
    case 'water':
      energyConsumption = randomNumber(5, 20, 2);
      carbonEmissions = energyConsumption * randomNumber(0.05, 0.2, 2);
      temperature = randomNumber(15, 22, 1);
      humidity = randomNumber(50, 80, 1);
      break;
  }
  
  return {
    buildingId: building.id,
    deviceId: device.id,
    energyConsumption,
    carbonEmissions,
    temperature,
    humidity,
    metadata: {
      buildingName: building.name,
      buildingType: building.type,
      deviceType: device.type
    }
  };
}

/**
 * Generate multiple readings
 * @param {Number} count - Number of readings to generate
 * @returns {Array} Array of generated readings
 */
function generateBulkData(count = 10) {
  const readings = [];
  for (let i = 0; i < count; i++) {
    readings.push(generateSimulatedReading());
  }
  return readings;
}

/**
 * Start continuous data simulation
 * @param {Number} interval - Interval between readings in milliseconds
 * @param {Number} maxReadings - Maximum number of readings to generate (0 for unlimited)
 * @returns {Object} Control object with stop function
 */
function startSimulation(interval = 5000, maxReadings = 0) {
  let count = 0;
  let running = true;
  
  logger.info('Starting carbon data simulation');
  
  const timer = setInterval(() => {
    if (!running || (maxReadings > 0 && count >= maxReadings)) {
      clearInterval(timer);
      logger.info('Carbon data simulation stopped');
      return;
    }
    
    try {
      const reading = generateSimulatedReading();
      const data = createCarbonData(reading);
      count++;
      
      logger.info(`Generated simulated reading #${count}: Building ${data.buildingId}, Device ${data.deviceId}, CO2: ${data.carbonEmissions.toFixed(2)}`);
    } catch (error) {
      logger.error(`Error generating simulated data: ${error.message}`);
    }
  }, interval);
  
  return {
    stop: () => {
      running = false;
      logger.info('Requesting simulation to stop');
    },
    getCount: () => count
  };
}

module.exports = {
  generateSimulatedReading,
  generateBulkData,
  startSimulation
};
