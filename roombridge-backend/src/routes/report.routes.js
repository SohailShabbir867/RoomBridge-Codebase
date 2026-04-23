const express = require("express");
const router = express.Router();

const {
  submitReport,
  getMyReports,
} = require("../controllers/report.controller");
const { protect } = require("../middleware/auth.middleware");

/**
 * @route   POST /api/v1/reports
 * @desc    Submit a report against a user or listing
 * @access  Protected
 */
router.post("/", protect, submitReport);

/**
 * @route   GET /api/v1/reports/my-reports
 * @desc    Get current user's submitted reports
 * @access  Protected
 */
router.get("/my-reports", protect, getMyReports);

module.exports = router;
