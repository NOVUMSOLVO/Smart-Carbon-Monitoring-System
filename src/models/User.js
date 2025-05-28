/**
 * User Model
 * Mongoose schema for user accounts
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Define user roles
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  API: 'api'
};

// Define the schema for users
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.ANALYST
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true // Allows null values
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true, // Automatically create createdAt and updatedAt fields
});

// Add index for better querying performance
userSchema.index({ email: 1, username: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate auth token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      username: this.username
    }, 
    process.env.JWT_SECRET || 'default_secret_change_in_production', 
    { expiresIn: '1d' }
  );
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate API key
userSchema.methods.generateApiKey = function() {
  const apiKey = jwt.sign(
    { 
      id: this._id,
      role: ROLES.API
    }, 
    process.env.API_KEY_SECRET || 'api_key_secret_change_in_production', 
    { expiresIn: '365d' }
  );
  this.apiKey = apiKey;
  return apiKey;
};

// Full name virtual property
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

// Exclude password and other sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = {
  User,
  ROLES
};
