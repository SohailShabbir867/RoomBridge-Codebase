const asyncHandler = require('express-async-handler');

const createBooking = asyncHandler(async (req, res) => {
  res.status(201).json({ message: 'Create Booking Placeholder' });
});

module.exports = { createBooking };
