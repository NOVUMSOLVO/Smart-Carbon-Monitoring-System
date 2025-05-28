/**
 * Authentication Routes
 * Handles user registration, login, and password reset
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many requests, please try again after 15 minutes'
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    user = await User.findOne({ username: req.body.username });
    if (user) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role || ROLES.ANALYST // Default role
    });
    
    // Save user to database
    await newUser.save();
    
    // Generate auth token
    const token = newUser.generateAuthToken();
    
    logger.info(`New user registered: ${newUser._id}`);
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Generate auth token
    const token = user.generateAuthToken();
    
    logger.info(`User logged in: ${user._id}`);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset
 * @access  Public
 */
router.post('/request-password-reset', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if email exists
      return res.json({ message: 'If that email exists, we\'ve sent a password reset link' });
    }
    
    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'default_secret_change_in_production',
      { expiresIn: '1h' }
    );
    
    // Save reset token and expiry to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // In a real application, you would send an email with the reset link
    // For now, just log it and return in the response
    logger.info(`Password reset requested for user: ${user._id}`);
    
    // In production, you would only return a success message
    // But for development, return the token for testing
    res.json({
      message: 'Password reset link sent successfully',
      resetToken: resetToken // Remove this in production
    });
  } catch (error) {
    logger.error(`Password reset request error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_in_production');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Find user by reset token and check expiry
    const user = await User.findOne({
      _id: decoded.id,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Set new password and remove reset fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();
    
    logger.info(`Password reset successful for user: ${user._id}`);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error(`Password reset error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -passwordResetToken -passwordResetExpires');
    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/auth/api-key
 * @desc    Generate API key for user
 * @access  Private (Admin/Manager only)
 */
router.post('/api-key', authenticateToken, authorize([ROLES.ADMIN, ROLES.MANAGER]), async (req, res) => {
  try {
    // Find user by ID (either the requesting user or another user if admin)
    const userId = req.body.userId || req.user.id;
    
    // If requesting for another user, check if admin
    if (userId !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ message: 'Unauthorized to generate API key for other users' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate API key
    const apiKey = user.generateApiKey();
    await user.save();
    
    logger.info(`API key generated for user: ${user._id}`);
    res.json({ apiKey });
  } catch (error) {
    logger.error(`API key generation error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
