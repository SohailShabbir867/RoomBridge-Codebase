const asyncHandler = require('express-async-handler');

const getReports = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Get Reports Placeholder' });
});

module.exports = { getReports };
