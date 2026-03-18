const asyncHandler = require('express-async-handler');

const getUserProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Get User Profile Placeholder' });
});

module.exports = { getUserProfile };
