import api from "./api";

/** Admin panel API calls (requires admin role) */
const adminService = {
  // Dashboard
  getStats: async () => (await api.get("/admin/stats")).data,

  // Users
  getAllUsers: async (params = {}) =>
    (await api.get("/admin/users", { params })).data,
  updateUserStatus: async (id, data) =>
    (await api.put(`/admin/users/${id}/status`, data)).data,
  deleteUser: async (id) => (await api.delete(`/admin/users/${id}`)).data,

  // Listings
  getAllListings: async (params = {}) =>
    (await api.get("/admin/listings", { params })).data,
  updateListingStatus: async (id, data) =>
    (await api.put(`/admin/listings/${id}/status`, data)).data,
  deleteListing: async (id) => (await api.delete(`/admin/listings/${id}`)).data,

  // Reports
  getReports: async (params = {}) =>
    (await api.get("/admin/reports", { params })).data,
  resolveReport: async (id, data) =>
    (await api.put(`/admin/reports/${id}`, data)).data,
  deleteReport: async (id) => (await api.delete(`/admin/reports/${id}`)).data,

  // Contact messages
  getContactMessages: async (params = {}) =>
    (await api.get("/admin/contact-messages", { params })).data,
  updateContactMessageStatus: async (id, data) =>
    (await api.put(`/admin/contact-messages/${id}`, data)).data,
  deleteContactMessage: async (id) =>
    (await api.delete(`/admin/contact-messages/${id}`)).data,

  // Bookings
  getAllBookings: async (params = {}) =>
    (await api.get("/admin/bookings", { params })).data,
};

export default adminService;
