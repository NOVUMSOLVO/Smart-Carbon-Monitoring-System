/**
 * Configuration settings for the Smart Carbon Monitoring System
 */

module.exports = {
  // Application settings
  app: {
    name: 'Smart Carbon Monitoring Platform',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
  },
  
  // Data storage settings
  dataStorage: {
    type: 'memory', // Options: 'memory', 'file', 'database'
    filePath: './data/carbon-data.json',
    database: {
      url: process.env.DB_URL || 'mongodb://localhost:27017/carbon-monitoring',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    }
  },
  
  // Data simulator settings
  simulator: {
    enabled: process.env.ENABLE_SIMULATOR === 'true' || true,
    interval: parseInt(process.env.SIMULATOR_INTERVAL) || 5000, // ms
    buildingCount: parseInt(process.env.SIMULATOR_BUILDINGS) || 5,
    deviceCount: parseInt(process.env.SIMULATOR_DEVICES) || 20
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: './logs'
  },
  
  // Reporting settings
  reporting: {
    dailyReportTime: '23:59', // 24-hour format
    weeklyReportDay: 'monday',
    monthlyReportDay: 1
  },
  
  // Alert thresholds
  alerts: {
    carbonEmission: {
      warning: 50, // kg CO2
      critical: 100 // kg CO2
    },
    energyConsumption: {
      warning: 200, // kWh
      critical: 500 // kWh
    }
  }
};
