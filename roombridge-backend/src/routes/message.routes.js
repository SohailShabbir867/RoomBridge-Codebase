const express = require('express');
const { sendMessage } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/', protect, sendMessage);

module.exports = router;
