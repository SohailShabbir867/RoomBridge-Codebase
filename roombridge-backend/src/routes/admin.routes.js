const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllListingsAdmin,
  updateListingStatus,
  deleteListingAdmin,
  getAllReports,
  resolveReport,
  deleteReport,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  getAllBookings,
  getRecipientCount,
  sendNotification,
  sendMaintenanceNotification,
  sendErrorAlert,
} = require("../controllers/admin.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

/* ── Apply auth + admin role to ALL routes in this router ──
   router.use() applies middleware to every route defined after it.
   Was already correct — both protect AND authorize('admin')
   applied via router.use(). This means no individual route can ever
   be accessed without being an authenticated admin. */
router.use(protect, authorize("admin"));

/* ── Dashboard ──────────────────────────────────────────── */

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Admin dashboard statistics (counts, growth charts)
 * @access  Admin
 */
router.get("/stats", getDashboardStats);

/* ── Users ──────────────────────────────────────────────── */

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all users with search, filter, sort, pagination
 * @access  Admin
 */
router.get("/users", getAllUsers);

/**
 * @route   PUT /api/v1/admin/users/:id/status
 * @desc    Ban or unban a user (cannot modify other admins)
 * @access  Admin
 */
router.put("/users/:id/status", updateUserStatus);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Hard-delete a user and cascade all related data
 * @access  Admin
 */
router.delete("/users/:id", deleteUser);

/* ── Listings ───────────────────────────────────────────── */

/**
 * @route   GET /api/v1/admin/listings
 * @desc    List all listings (any status) with filters and pagination
 * @access  Admin
 */
router.get("/listings", getAllListingsAdmin);

/**
 * @route   PUT /api/v1/admin/listings/:id/status
 * @desc    Approve (active), reject, or deactivate a listing
 * @access  Admin
 */
router.put("/listings/:id/status", updateListingStatus);

/**
 * @route   DELETE /api/v1/admin/listings/:id
 * @desc    Hard-delete a listing, its photos, and cancel its bookings
 * @access  Admin
 */
router.delete("/listings/:id", deleteListingAdmin);

/* ── Reports ────────────────────────────────────────────── */

/**
 * @route   GET /api/v1/admin/reports
 * @desc    List all flagged reports with filters
 * @access  Admin
 */
router.get("/reports", getAllReports);

/**
 * @route   PUT /api/v1/admin/reports/:id
 * @desc    Resolve or dismiss a report
 * @access  Admin
 */
router.put("/reports/:id", resolveReport);

/**
 * @route   DELETE /api/v1/admin/reports/:id
 * @desc    Permanently delete a report
 * @access  Admin
 */
router.delete("/reports/:id", deleteReport);

/* ── Contact Messages ───────────────────────────────────── */

/**
 * @route   GET /api/v1/admin/contact-messages
 * @desc    List submitted contact/support messages
 * @access  Admin
 */
router.get("/contact-messages", getContactMessages);

/**
 * @route   PUT /api/v1/admin/contact-messages/:id
 * @desc    Update contact message status / admin note
 * @access  Admin
 */
router.put("/contact-messages/:id", updateContactMessageStatus);

/**
 * @route   DELETE /api/v1/admin/contact-messages/:id
 * @desc    Permanently delete a contact/support message
 * @access  Admin
 */
router.delete("/contact-messages/:id", deleteContactMessage);

/* ── Bookings ───────────────────────────────────────────── */

/**
 * @route   GET /api/v1/admin/bookings
 * @desc    List all bookings across the platform
 * @access  Admin
 */
router.get("/bookings", getAllBookings);

/* ── Notifications ──────────────────────────────────── */

/**
 * @route   GET /api/v1/admin/notifications/recipient-count
 * @desc    Returns the count of users for a given recipientType
 * @access  Admin
 */
router.get("/notifications/recipient-count", getRecipientCount);

/**
 * @route   POST /api/v1/admin/notifications/send
 * @desc    Send a general email notification to selected recipients
 * @access  Admin
 */
router.post("/notifications/send", sendNotification);

/**
 * @route   POST /api/v1/admin/notifications/maintenance
 * @desc    Send a scheduled maintenance notice to all active users
 * @access  Admin
 */
router.post("/notifications/maintenance", sendMaintenanceNotification);

/**
 * @route   POST /api/v1/admin/notifications/error-alert
 * @desc    Send a system error alert to all admin users
 * @access  Admin
 */
router.post("/notifications/error-alert", sendErrorAlert);

module.exports = router;
