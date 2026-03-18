const express = require('express');
const { createBooking } = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/', protect, createBooking);

module.exports = router;
