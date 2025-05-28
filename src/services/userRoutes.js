/**
 * User Management Routes
 * Handles user CRUD operations (Admin only)
 */
const express = require('express');
const router = express.Router();
const { User, ROLES } = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Apply search filters if provided
    const filter = {};
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.active === 'true' || req.query.active === 'false') {
      filter.isActive = req.query.active === 'true';
    }
    
    // Fetch users with pagination
    const users = await User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination metadata
    const totalCount = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or owner)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if the user is admin or requesting their own info
    if (req.user.role !== ROLES.ADMIN && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
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
      role: req.body.role,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    
    // Save user to database
    await newUser.save();
    
    logger.info(`User created by admin: ${newUser._id}`);
    res.status(201).json({
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin or owner)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the user is admin or updating their own info
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = req.user.id === req.params.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Restrict role changes to admin only
    if (req.body.role && !isAdmin) {
      return res.status(403).json({ message: 'Only administrators can change roles' });
    }
    
    // Restrict status changes to admin only
    if (req.body.isActive !== undefined && !isAdmin) {
      return res.status(403).json({ message: 'Only administrators can change account status' });
    }
    
    // Update allowed fields
    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;
    if (req.body.email && isAdmin) user.email = req.body.email;
    if (req.body.role && isAdmin) user.role = req.body.role;
    if (req.body.isActive !== undefined && isAdmin) user.isActive = req.body.isActive;
    
    // Only update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    await user.save();
    
    logger.info(`User updated: ${user._id}`);
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    // Prevent self-deletion for security reasons
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    logger.info(`User deleted: ${req.params.id}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
