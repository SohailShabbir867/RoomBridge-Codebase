const asyncHandler = require('express-async-handler');
const User = require('../models/User.model');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  res.status(201).json({ message: 'Register User Placeholder' });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Login User Placeholder' });
});

module.exports = { registerUser, loginUser };
