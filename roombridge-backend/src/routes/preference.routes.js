const express = require('express');
const { updatePreferences } = require('../controllers/preference.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.put('/', protect, updatePreferences);

module.exports = router;
