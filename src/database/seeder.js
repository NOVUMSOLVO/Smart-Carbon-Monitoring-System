/**
 * Database Seeder
 * Seeds the database with initial data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./connection');
const { User, ROLES } = require('../models/User');
const CarbonData = require('../models/CarbonData.mongoose');
const { logger } = require('../utils/logger.enhanced');

// Sample data for seeding
const users = [
  {
    username: 'admin',
    email: 'admin@carbonmonitoring.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: ROLES.ADMIN,
    isActive: true
  },
  {
    username: 'manager',
    email: 'manager@carbonmonitoring.com',
    password: 'Manager123!',
    firstName: 'Manager',
    lastName: 'User',
    role: ROLES.MANAGER,
    isActive: true
  },
  {
    username: 'analyst',
    email: 'analyst@carbonmonitoring.com',
    password: 'Analyst123!',
    firstName: 'Analyst',
    lastName: 'User',
    role: ROLES.ANALYST,
    isActive: true
  },
  {
    username: 'api',
    email: 'api@carbonmonitoring.com',
    password: 'Api123!',
    firstName: 'API',
    lastName: 'User',
    role: ROLES.API,
    isActive: true
  }
];

// Generate sample carbon data
const generateCarbonData = (count = 100) => {
  const data = [];
  
  const buildings = ['Building-A', 'Building-B', 'Building-C', 'Building-D', 'Building-E'];
  const devices = [];
  
  // Create device IDs
  buildings.forEach(building => {
    for (let i = 1; i <= 4; i++) {
      devices.push(`${building}-Device-${i}`);
    }
  });
  
  // Current date
  const now = new Date();
  
  // Generate data for the past 30 days
  for (let i = 0; i < count; i++) {
    const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];
    const buildingDevices = devices.filter(device => device.startsWith(randomBuilding));
    const randomDevice = buildingDevices[Math.floor(Math.random() * buildingDevices.length)];
    
    // Random date in the past 30 days
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(Math.floor(Math.random() * 24));
    
    // Random values with some correlation
    const energyConsumption = Math.random() * 1000 + 200; // 200-1200 kWh
    const emissionFactor = 0.3 + Math.random() * 0.2; // 0.3-0.5 kg CO2/kWh
    
    data.push({
      buildingId: randomBuilding,
      deviceId: randomDevice,
      timestamp: date,
      energyConsumption,
      carbonEmissions: energyConsumption * emissionFactor,
      temperature: Math.random() * 15 + 15, // 15-30 °C
      humidity: Math.random() * 50 + 30, // 30-80%
      metadata: {
        source: 'seeder',
        notes: 'Simulated data'
      }
    });
  }
  
  return data;
};

/**
 * Seed database with initial data
 */
const seedDatabase = async () => {
  try {
    // Connect to the database
    await connectDB();
    logger.info('Connected to database');
    
    // Check if users already exist
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      logger.info('Seeding users...');
      
      // Create users
      await User.insertMany(users);
      logger.info(`${users.length} users created`);
      
      // Generate API key for the API user
      const apiUser = await User.findOne({ role: ROLES.API });
      apiUser.generateApiKey();
      await apiUser.save();
      logger.info(`API key generated for user: ${apiUser.username}`);
      logger.info(`API key: ${apiUser.apiKey}`);
    } else {
      logger.info(`Users already exist. Skipping user seeding.`);
    }
    
    // Check if carbon data already exists
    const carbonDataCount = await CarbonData.countDocuments();
    
    if (carbonDataCount === 0) {
      logger.info('Seeding carbon data...');
      
      // Generate and insert carbon data
      const carbonData = generateCarbonData(200);
      await CarbonData.insertMany(carbonData);
      
      logger.info(`${carbonData.length} carbon data records created`);
    } else {
      logger.info(`Carbon data already exists. Skipping carbon data seeding.`);
    }
    
    logger.info('Seeding completed successfully');
    
    // Disconnect from the database
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
