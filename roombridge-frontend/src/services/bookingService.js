import api from './api';

/*
  bookingService — all booking-related API calls.
  Endpoints match booking.routes.js (backend).
*/
const bookingService = {

  /* ── Seeker: Create a booking request ───────────────────────────── */
  // POST /bookings
  // bookingData = { listingId, message, moveInDate? }
  createBooking: async (bookingData) => {
    const res = await api.post('/bookings', bookingData);
    return res.data;
  },

  /* ── Seeker: Get all of my booking requests ─────────────────────── */
  // GET /bookings/my-requests?status=&page=&limit=
  // BUG FIX: Added params support for status filter + pagination
  getMyBookings: async (params = {}) => {
    const res = await api.get('/bookings/my-requests', { params });
    return res.data;
  },

  /* ── Owner: Get all booking requests received ───────────────────── */
  // GET /bookings/owner-requests?status=&listingId=&page=&limit=
  // BUG FIX: Added params support for status filter, listingId filter + pagination
  getOwnerBookings: async (params = {}) => {
    const res = await api.get('/bookings/owner-requests', { params });
    return res.data;
  },

  /* ── Owner: Accept or reject a booking request ──────────────────── */
  // PUT /bookings/:id/status
  // data = { status: 'accepted' | 'rejected', ownerNote?: string }
  updateBookingStatus: async (id, data) => {
    const res = await api.put(`/bookings/${id}/status`, data);
    return res.data;
  },

  /* ── Seeker: Cancel a booking request ───────────────────────────── */
  // DELETE /bookings/:id
  // BUG FIX: was PUT /bookings/:id/cancel — backend uses DELETE
  cancelBooking: async (id) => {
    const res = await api.delete(`/bookings/${id}`);
    return res.data;
  },
};

export default bookingService;
