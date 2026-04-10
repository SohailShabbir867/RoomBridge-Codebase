const express = require('express');
const router  = express.Router();

const {
  sendBookingRequest,
  getSeekerBookings,
  getOwnerBookings,
  updateBookingStatus,
  cancelBooking,
} = require('../controllers/booking.controller');

const { protect }  = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

/* ══════════════════════════════════════════════════════════
   SEEKER ROUTES
══════════════════════════════════════════════════════════ */

/**
 * @route   POST /api/v1/bookings
 * @desc    Send a booking request for a listing
 * @access  Protected (Seeker only)
 */
router.post('/', protect, authorize('seeker'), sendBookingRequest);

/**
 * @route   GET /api/v1/bookings/my-requests
 * @desc    Get all booking requests made by the logged-in seeker
 * @access  Protected (Seeker)
 * NOTE: Must be above /:id to prevent 'my-requests' being matched as an id param
 */
router.get('/my-requests', protect, authorize('seeker'), getSeekerBookings);

/**
 * @route   DELETE /api/v1/bookings/:id
 * @desc    Cancel a pending booking request (sets status to 'cancelled')
 * @access  Protected (Seeker)
 */
router.delete('/:id', protect, authorize('seeker'), cancelBooking);

/* ══════════════════════════════════════════════════════════
   OWNER ROUTES
══════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/v1/bookings/owner-requests
 * @desc    Get all booking requests received by the logged-in owner
 * @access  Protected (Owner)
 * NOTE: Must be above /:id/status to prevent segment collision
 */
router.get('/owner-requests', protect, authorize('owner'), getOwnerBookings);

/**
 * @route   PUT /api/v1/bookings/:id/status
 * @desc    Accept or reject a booking request
 * @access  Protected (Owner)
 */
router.put('/:id/status', protect, authorize('owner'), updateBookingStatus);

module.exports = router;
