const express = require('express');
const router  = express.Router();

const {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  removeProfilePhoto,
  getAllSeekers,
} = require('../controllers/user.controller');

const { protect }      = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

/* ══════════════════════════════════════════════════════════
   PROFILE ROUTES  (any authenticated user)
══════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile with preferences and saved listings
 * @access  Protected
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update profile fields (name, phone, city, bio only)
 * @access  Protected
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   PUT /api/v1/users/profile/photo
 * @desc    Upload or replace profile photo (deletes old Cloudinary image first)
 * @access  Protected
 * NOTE: Must be defined BEFORE DELETE /profile/photo to avoid route ambiguity
 */
router.put('/profile/photo', protect, uploadSingle('photo'), updateProfilePhoto);

/**
 * @route   DELETE /api/v1/users/profile/photo
 * @desc    Remove profile photo from Cloudinary and clear from user doc
 * @access  Protected
 */
router.delete('/profile/photo', protect, removeProfilePhoto);

/* ══════════════════════════════════════════════════════════
   SEEKER BROWSING  (owner only — for roommate matching)
══════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/v1/users/seekers
 * @desc    Browse all active seekers with compatibility scores
 * @access  Protected (Owner)
 */
router.get('/seekers', protect, authorize('owner'), getAllSeekers);

module.exports = router;
