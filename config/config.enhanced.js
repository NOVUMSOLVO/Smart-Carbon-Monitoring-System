/**
 * Enhanced Configuration Module
 * Supports multiple environments with validation
 */
const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Determine which .env file to use based on environment
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env';

// Try to load environment-specific variables
try {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (error) {
  // Silently fail if the environment file doesn't exist
}

// Environment variable validation schema
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .default('development'),
    PORT: Joi.number().default(3000),
    
    // MongoDB
    MONGODB_URI: Joi.string().required().description('MongoDB connection string'),
    MONGODB_TEST_URI: Joi.string().description('MongoDB test connection string'),
    
    // JWT Authentication
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_EXPIRATION: Joi.string().default('1d').description('JWT expiration time'),
    API_KEY_SECRET: Joi.string().required().description('API key secret'),
    
    // Logging
    LOG_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
      .default('info'),
    LOG_FILE_PATH: Joi.string().default('./logs/app.log'),
    
    // CORS
    CORS_ORIGIN: Joi.string().default('*'),
    
    // API Rate Limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
    
    // Simulator
    ENABLE_SIMULATOR: Joi.boolean().default(true),
    SIMULATOR_INTERVAL: Joi.number().default(5000),
    SIMULATOR_BUILDINGS: Joi.number().default(5),
    SIMULATOR_DEVICES: Joi.number().default(20),
  })
  .unknown();

// Validate environment variables
const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Base configuration
const config = {
  // Application settings
  app: {
    name: 'Smart Carbon Monitoring System',
    version: '1.0.0',
    environment: envVars.NODE_ENV,
    port: envVars.PORT,
    isProduction: envVars.NODE_ENV === 'production',
    isDevelopment: envVars.NODE_ENV === 'development',
    isTest: envVars.NODE_ENV === 'test',
  },
  
  // MongoDB settings
  mongo: {
    uri: envVars.NODE_ENV === 'test' 
      ? envVars.MONGODB_TEST_URI 
      : envVars.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    }
  },
  
  // JWT Authentication
  jwt: {
    secret: envVars.JWT_SECRET,
    expiration: envVars.JWT_EXPIRATION || '1d',
    apiKeySecret: envVars.API_KEY_SECRET
  },
  
  // Logging settings
  logging: {
    level: envVars.LOG_LEVEL,
    filePath: envVars.LOG_FILE_PATH,
    directory: path.dirname(envVars.LOG_FILE_PATH),
    console: true,
    file: envVars.NODE_ENV !== 'test' // Disable file logging in test
  },
  
  // Server security
  security: {
    cors: {
      origin: envVars.CORS_ORIGIN,
      credentials: true
    },
    rateLimit: {
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      max: envVars.RATE_LIMIT_MAX_REQUESTS
    }
  },
  
  // Data simulator settings
  simulator: {
    enabled: envVars.ENABLE_SIMULATOR === 'true',
    interval: parseInt(envVars.SIMULATOR_INTERVAL),
    buildingCount: parseInt(envVars.SIMULATOR_BUILDINGS),
    deviceCount: parseInt(envVars.SIMULATOR_DEVICES)
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

module.exports = config;
