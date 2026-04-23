const express = require("express");
const router = express.Router();

const {
  getMyPreferences,
  createOrUpdatePreferences,
  getRoommateMatches,
} = require("../controllers/preference.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

/**
 * @route   GET /api/v1/preferences/me
 * @desc    Get current user's roommate preferences
 * @access  Protected (any role)
 * NOTE: Must be defined BEFORE GET /matches to prevent 'me' matching /:id
 */
router.get("/me", protect, getMyPreferences);

/**
 * @route   GET /api/v1/preferences/matches
 * @desc    Get compatible roommate matches sorted by score
 * @access  Protected (Seeker only)
 * NOTE: Must be defined BEFORE any /:id param route
 */
router.get("/matches", protect, authorize("seeker"), getRoommateMatches);

/**
 * @route   POST /api/v1/preferences
 * @desc    Create or update roommate preferences (upsert)
 * @access  Protected (Seeker only)
 */
router.post("/", protect, authorize("seeker"), createOrUpdatePreferences);

module.exports = router;
