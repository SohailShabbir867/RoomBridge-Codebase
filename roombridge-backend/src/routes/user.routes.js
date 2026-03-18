const express = require('express');
const { getUserProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/profile', protect, getUserProfile);

module.exports = router;
