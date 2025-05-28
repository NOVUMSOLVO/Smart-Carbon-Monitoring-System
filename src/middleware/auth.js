/**
 * Auth Middleware
 * Handles authentication and authorization
 */
const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');
const { logger } = require('../utils/logger');

/**
 * Authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_in_production');
    
    // Check if user exists and is active
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'Access denied. User is inactive or does not exist' });
    }
    
    // Add user to request object
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Authenticate API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ message: 'Access denied. No API key provided' });
    }
    
    // Find user with matching API key
    const user = await User.findOne({ apiKey, isActive: true });
    
    if (!user) {
      return res.status(403).json({ message: 'Invalid or inactive API key' });
    }
    
    // Add user to request object with limited scope
    req.user = {
      id: user._id,
      role: ROLES.API,
      apiAccess: true
    };
    
    next();
  } catch (error) {
    logger.error(`API key authentication error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} roles - Allowed roles for the route
 * @returns {Function} Express middleware
 */
const authorize = (roles) => {
  // Convert single role to array
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}. Required roles: ${roles.join(', ')}`);
      return res.status(403).json({ message: 'Access denied. Insufficient permissions' });
    }
    
    next();
  };
};

// Export middleware
module.exports = {
  authenticateToken,
  authenticateApiKey,
  authorize,
  ROLES
};
