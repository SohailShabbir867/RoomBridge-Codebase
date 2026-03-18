const asyncHandler = require('express-async-handler');

const sendMessage = asyncHandler(async (req, res) => {
  res.status(201).json({ message: 'Send Message Placeholder' });
});

module.exports = { sendMessage };
