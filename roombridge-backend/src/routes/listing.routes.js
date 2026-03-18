const express = require('express');
const { getListings, createListing } = require('../controllers/listing.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const router = express.Router();

router.get('/', getListings);
router.post('/', protect, authorize('owner'), createListing);

module.exports = router;
