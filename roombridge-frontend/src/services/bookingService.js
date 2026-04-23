import api from "./api";

/** Booking API calls (seeker + owner) */
const bookingService = {
  createBooking: async (data) => (await api.post("/bookings", data)).data,
  getMyBookings: async (params = {}) =>
    (await api.get("/bookings/my-requests", { params })).data,
  getOwnerBookings: async (params = {}) =>
    (await api.get("/bookings/owner-requests", { params })).data,
  updateBookingStatus: async (id, data) => {
    if (!id) throw new Error("Booking ID is required to update status.");
    return (await api.put(`/bookings/${id}/status`, data)).data;
  },
  cancelBooking: async (id) => {
    if (!id) throw new Error("Booking ID is required to cancel.");
    return (await api.delete(`/bookings/${id}`)).data;
  },
  removeOwnerBooking: async (id) => {
    if (!id) throw new Error("Booking ID is required to remove.");
    return (await api.delete(`/bookings/${id}/owner-remove`)).data;
  },
};

export default bookingService;
