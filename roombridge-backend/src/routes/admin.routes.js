const express = require('express');
const { getReports } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const router = express.Router();

router.get('/reports', protect, authorize('admin'), getReports);

module.exports = router;
