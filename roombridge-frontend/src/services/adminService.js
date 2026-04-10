import api from './api';

/*
  adminService — admin panel API calls.
  All routes require admin role (enforced by backend router.use(protect, authorize('admin'))).
  Endpoints match admin.routes.js (backend).
*/
const adminService = {

  /* ── Dashboard Statistics ────────────────────────────────────────── */
  // GET /admin/stats
  // Returns: { users, listings, bookings, messages, reports, recent, growth }
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  /* ── Users ───────────────────────────────────────────────────────── */

  // GET /admin/users?search=&role=&city=&isActive=&isBanned=&sortBy=&page=&limit=
  getAllUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  // PUT /admin/users/:id/status
  // data = { isBanned: bool, bannedReason?: string, isActive?: bool }
  // BUG FIX: backend expects { isBanned, bannedReason } not { status }
  updateUserStatus: async (id, data) => {
    const res = await api.put(`/admin/users/${id}/status`, data);
    return res.data;
  },

  // DELETE /admin/users/:id
  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  /* ── Listings ────────────────────────────────────────────────────── */

  // GET /admin/listings?status=&city=&owner=&search=&page=&limit=
  getAllListings: async (params = {}) => {
    const res = await api.get('/admin/listings', { params });
    return res.data;
  },

  // PUT /admin/listings/:id/status
  // data = { status: 'active'|'rejected'|'inactive', rejectionReason?: string }
  updateListingStatus: async (id, data) => {
    const res = await api.put(`/admin/listings/${id}/status`, data);
    return res.data;
  },

  // DELETE /admin/listings/:id
  deleteListing: async (id) => {
    const res = await api.delete(`/admin/listings/${id}`);
    return res.data;
  },

  /* ── Reports ─────────────────────────────────────────────────────── */

  // GET /admin/reports?status=pending|reviewed|resolved|dismissed&page=&limit=
  getReports: async (params = {}) => {
    const res = await api.get('/admin/reports', { params });
    return res.data;
  },

  // PUT /admin/reports/:id
  // data = { status: 'reviewed'|'resolved'|'dismissed', adminNote?: string }
  resolveReport: async (id, data) => {
    const res = await api.put(`/admin/reports/${id}`, data);
    return res.data;
  },

  /* ── Bookings ────────────────────────────────────────────────────── */

  // GET /admin/bookings?status=&page=&limit=
  // BUG FIX: Added params support — was fetching all bookings with no filter
  getAllBookings: async (params = {}) => {
    const res = await api.get('/admin/bookings', { params });
    return res.data;
  },
};

export default adminService;
