/**
 * Validation Middleware
 * Validates request data using Joi schemas
 */
const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Create validation middleware using a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, params, query)
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: property === 'query' // Allow unknown params in query, but not in body
    });
    
    if (!error) {
      // Replace the request data with validated data
      req[property] = value;
      return next();
    }
    
    // Format validation errors
    const validationErrors = error.details.map(detail => ({
      field: detail.context.key,
      message: detail.message
    }));
    
    // Throw a validation error that will be caught by the error handler
    next(new ValidationError('Validation failed', validationErrors));
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // User validation schemas
  user: {
    create: Joi.object({
      username: Joi.string().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      firstName: Joi.string().allow(''),
      lastName: Joi.string().allow(''),
      role: Joi.string().valid('admin', 'manager', 'analyst', 'api'),
      isActive: Joi.boolean()
    }),
    
    update: Joi.object({
      email: Joi.string().email(),
      password: Joi.string().min(8),
      firstName: Joi.string().allow(''),
      lastName: Joi.string().allow(''),
      role: Joi.string().valid('admin', 'manager', 'analyst', 'api'),
      isActive: Joi.boolean()
    }).min(1) // At least one field must be specified
  },
  
  // Authentication schemas
  auth: {
    login: Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required()
    }),
    
    register: Joi.object({
      username: Joi.string().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      firstName: Joi.string().allow(''),
      lastName: Joi.string().allow('')
    }),
    
    resetRequest: Joi.object({
      email: Joi.string().email().required()
    }),
    
    resetPassword: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(8).required()
    })
  },
  
  // Carbon data validation schemas
  carbonData: {
    create: Joi.object({
      buildingId: Joi.string().required(),
      deviceId: Joi.string().required(),
      timestamp: Joi.date().default(Date.now),
      energyConsumption: Joi.number().min(0).required(),
      carbonEmissions: Joi.number().min(0).required(),
      temperature: Joi.number(),
      humidity: Joi.number(),
      metadata: Joi.object()
    }),
    
    update: Joi.object({
      buildingId: Joi.string(),
      deviceId: Joi.string(),
      timestamp: Joi.date(),
      energyConsumption: Joi.number().min(0),
      carbonEmissions: Joi.number().min(0),
      temperature: Joi.number(),
      humidity: Joi.number(),
      metadata: Joi.object()
    }).min(1), // At least one field must be specified
    
    filter: Joi.object({
      buildingId: Joi.string(),
      deviceId: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
      minEnergy: Joi.number(),
      minEmissions: Joi.number(),
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100),
      sortBy: Joi.string(),
      sortOrder: Joi.string().valid('asc', 'desc')
    })
  }
};

module.exports = {
  validate,
  schemas
};
