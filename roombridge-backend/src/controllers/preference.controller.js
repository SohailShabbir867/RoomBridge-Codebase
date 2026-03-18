const asyncHandler = require('express-async-handler');

const updatePreferences = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Update Preferences Placeholder' });
});

module.exports = { updatePreferences };
