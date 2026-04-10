const express = require('express');
const router  = express.Router();

const {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getOwnerListings,
  saveListing,
  unsaveListing,
  getSavedListings,
  incrementViews,
} = require('../controllers/listing.controller');

const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { authorize }             = require('../middleware/role.middleware');
const { uploadMultiple }        = require('../middleware/upload.middleware');
const { validate, listingRules } = require('../middleware/validation.middleware');

/* ══════════════════════════════════════════════════════════
   PUBLIC ROUTES
══════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/v1/listings
 * @desc    Browse all active listings with filters, search, sort, pagination
 * @access  Public (optionalAuth so seeker's isSaved can be computed per listing)
 *
 * BUG FIX: was `router.get('/', getAllListings)` — no optionalAuth means
 * req.user is always undefined, so isSaved could never be computed in list view.
 */
router.get('/', optionalAuth, getAllListings);

/**
 * @route   GET /api/v1/listings/seeker/saved
 * @desc    Get seeker's saved listings
 * @access  Protected (Seeker)
 * NOTE: must be defined BEFORE /:id to prevent Express matching 'seeker' as an id param
 */
router.get('/seeker/saved', protect, authorize('seeker'), getSavedListings);

/**
 * @route   GET /api/v1/listings/owner/my-listings
 * @desc    Get owner's listings (all statuses) with booking counts
 * @access  Protected (Owner)
 * NOTE: must be defined BEFORE /:id
 */
router.get('/owner/my-listings', protect, authorize('owner'), getOwnerListings);

/**
 * @route   GET /api/v1/listings/:id
 * @desc    Get single listing with owner info and saved status
 * @access  Public (optionalAuth for isSaved)
 */
router.get('/:id', optionalAuth, getListingById);

/**
 * @route   POST /api/v1/listings/:id/views
 * @desc    Increment listing view count (called explicitly by frontend)
 * @access  Public
 */
router.post('/:id/views', incrementViews);

/* ══════════════════════════════════════════════════════════
   PROTECTED ROUTES — OWNER (create / update / delete)
══════════════════════════════════════════════════════════ */

/**
 * @route   POST /api/v1/listings
 * @desc    Create a new listing with photo uploads
 * @access  Protected (Owner)
 */
router.post(
  '/',
  protect,
  authorize('owner'),
  uploadMultiple('photos', 6),
  listingRules,
  validate,
  createListing
);

/**
 * @route   PUT /api/v1/listings/:id
 * @desc    Update listing (add/remove photos, edit fields)
 * @access  Protected (Owner)
 */
router.put('/:id', protect, authorize('owner'), uploadMultiple('photos', 6), updateListing);

/**
 * @route   DELETE /api/v1/listings/:id
 * @desc    Delete listing and its bookings/photos
 * @access  Protected (Owner or Admin)
 *
 * BUG FIX: was authorize('owner') only — admins couldn't moderate/delete
 * listings flagged as inappropriate.
 */
router.delete('/:id', protect, authorize('owner', 'admin'), deleteListing);

/* ══════════════════════════════════════════════════════════
   PROTECTED ROUTES — SEEKER (save / unsave)
══════════════════════════════════════════════════════════ */

/**
 * @route   POST /api/v1/listings/:id/save
 * @desc    Save a listing to favourites
 * @access  Protected (Seeker)
 */
router.post('/:id/save', protect, authorize('seeker'), saveListing);

/**
 * @route   DELETE /api/v1/listings/:id/save
 * @desc    Remove listing from favourites
 * @access  Protected (Seeker)
 */
router.delete('/:id/save', protect, authorize('seeker'), unsaveListing);

module.exports = router;
