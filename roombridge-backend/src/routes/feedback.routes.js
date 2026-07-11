const express = require("express");
const router  = express.Router();

const {
  submitFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} = require("../controllers/feedback.controller");

const { protect }    = require("../middleware/auth.middleware");
const { authorize }  = require("../middleware/role.middleware");

/**
 * @route   POST /api/v1/feedback
 * @desc    Submit feedback (logged-in users only)
 * @access  Protected (any role)
 */
router.post("/", protect, submitFeedback);

/**
 * @route   GET /api/v1/feedback
 * @desc    Get all feedback with stats (admin only)
 * @access  Admin
 */
router.get("/", protect, authorize("admin"), getAllFeedback);

/**
 * @route   PUT /api/v1/feedback/:id
 * @desc    Update feedback status / add admin note
 * @access  Admin
 */
router.put("/:id", protect, authorize("admin"), updateFeedbackStatus);

/**
 * @route   DELETE /api/v1/feedback/:id
 * @desc    Delete a feedback entry
 * @access  Admin
 */
router.delete("/:id", protect, authorize("admin"), deleteFeedback);

module.exports = router;
