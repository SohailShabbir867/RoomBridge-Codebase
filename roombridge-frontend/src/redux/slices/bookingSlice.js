import { createSlice } from "@reduxjs/toolkit";

/*
  bookingSlice — manages booking request state for both seekers and owners.
*/
const initialState = {
  bookings: [], // seeker's sent requests OR owner's received requests
  currentBooking: null,
  loading: false,
  error: null,
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    /* Set the full bookings list (from API response) */
    setBookings: (state, action) => {
      /*
        Accept either:
          - A raw array (legacy)
          - A paginated response { bookings, pagination }
      */
      if (Array.isArray(action.payload)) {
        state.bookings = action.payload;
        state.totalCount = action.payload.length;
        state.totalPages = 1;
      } else {
        state.bookings = action.payload.bookings ?? [];
        state.totalCount = action.payload.pagination?.total ?? 0;
        state.totalPages = action.payload.pagination?.totalPages ?? 1;
        state.currentPage = action.payload.pagination?.page ?? 1;
      }
      state.loading = false;
      state.error = null;
    },

    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },

    /* Add a newly created booking to the front of the list */
    addBooking: (state, action) => {
      state.bookings.unshift(action.payload);
      state.totalCount += 1;
    },

    /*
      was only updating { id, status } — the booking controller
      returns the full populated booking doc. Now accepts the full booking
      object and replaces the stale entry in state.
    */
    updateBookingInState: (state, action) => {
      const updated = action.payload; // full booking object from API
      const idx = state.bookings.findIndex((b) => b._id === updated._id);
      if (idx !== -1) {
        state.bookings[idx] = updated;
      }
      if (state.currentBooking?._id === updated._id) {
        state.currentBooking = updated;
      }
    },

    /*
      removeBooking was hard-deleting from state — but the backend
      now soft-cancels (status = 'cancelled'). Use updateBookingInState for
      cancellations. removeBooking is kept for admin hard-delete use cases.
    */
    removeBooking: (state, action) => {
      state.bookings = state.bookings.filter((b) => b._id !== action.payload);
      state.totalCount = Math.max(0, state.totalCount - 1);
    },

    setPage: (state, action) => {
      state.currentPage = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setBookings,
  setCurrentBooking,
  addBooking,
  updateBookingInState,
  removeBooking,
  setPage,
  setLoading,
  setError,
} = bookingSlice.actions;

export default bookingSlice.reducer;
