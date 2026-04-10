import { createSlice } from '@reduxjs/toolkit';

/*
  adminSlice — manages admin panel data (users, listings, reports, stats).
*/
const initialState = {
  users:        [],
  listings:     [],
  reports:      [],
  bookings:     [],
  stats:        null,
  loading:      false,
  error:        null,
  /* BUG FIX: pagination state was missing — admin tables had no page info */
  pagination: {
    users:    { total: 0, page: 1, totalPages: 1 },
    listings: { total: 0, page: 1, totalPages: 1 },
    reports:  { total: 0, page: 1, totalPages: 1 },
    bookings: { total: 0, page: 1, totalPages: 1 },
  },
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    /* Users */
    setUsers: (state, action) => {
      /*
        Accept both raw array and paginated response
        { users/data, pagination: { total, page, totalPages } }
      */
      if (Array.isArray(action.payload)) {
        state.users = action.payload;
      } else {
        state.users = action.payload.users ?? action.payload.data ?? [];
        state.pagination.users = {
          total:      action.payload.pagination?.total      ?? state.users.length,
          page:       action.payload.pagination?.page       ?? 1,
          totalPages: action.payload.pagination?.totalPages ?? 1,
        };
      }
      state.loading = false;
      state.error   = null;
    },

    updateUserStatus: (state, action) => {
      const { id, updates } = action.payload;
      const user = state.users.find((u) => u._id === id);
      if (user) Object.assign(user, updates);
    },

    removeUser: (state, action) => {
      const id = action.payload;
      state.users = state.users.filter((u) => u._id !== id);
      /* BUG FIX: also remove listings that belonged to this user */
      state.listings = state.listings.filter((l) => l.owner?._id !== id && l.owner !== id);
      state.pagination.users.total = Math.max(0, state.pagination.users.total - 1);
    },

    /* Listings */
    setAdminListings: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.listings = action.payload;
      } else {
        state.listings = action.payload.listings ?? action.payload.data ?? [];
        state.pagination.listings = {
          total:      action.payload.pagination?.total      ?? state.listings.length,
          page:       action.payload.pagination?.page       ?? 1,
          totalPages: action.payload.pagination?.totalPages ?? 1,
        };
      }
      state.loading = false;
      state.error   = null;
    },

    updateListingStatus: (state, action) => {
      const { id, status, rejectionReason } = action.payload;
      const listing = state.listings.find((l) => l._id === id);
      if (listing) {
        listing.status = status;
        if (rejectionReason !== undefined) listing.rejectionReason = rejectionReason;
      }
    },

    removeListing: (state, action) => {
      state.listings = state.listings.filter((l) => l._id !== action.payload);
      state.pagination.listings.total = Math.max(0, state.pagination.listings.total - 1);
    },

    /* Reports */
    setReports: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.reports = action.payload;
      } else {
        state.reports = action.payload.reports ?? action.payload.data ?? [];
        state.pagination.reports = {
          total:      action.payload.pagination?.total      ?? state.reports.length,
          page:       action.payload.pagination?.page       ?? 1,
          totalPages: action.payload.pagination?.totalPages ?? 1,
        };
      }
      state.loading = false;
      state.error   = null;
    },

    updateReport: (state, action) => {
      const updated = action.payload;
      const idx = state.reports.findIndex((r) => r._id === updated._id);
      if (idx !== -1) state.reports[idx] = updated;
    },

    /* Bookings */
    setAdminBookings: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.bookings = action.payload;
      } else {
        state.bookings = action.payload.bookings ?? action.payload.data ?? [];
        state.pagination.bookings = {
          total:      action.payload.pagination?.total      ?? state.bookings.length,
          page:       action.payload.pagination?.page       ?? 1,
          totalPages: action.payload.pagination?.totalPages ?? 1,
        };
      }
      state.loading = false;
      state.error   = null;
    },

    /* Stats */
    setStats: (state, action) => {
      state.stats   = action.payload;
      state.loading = false;
      state.error   = null;
    },

    /* Set pagination page for a specific resource */
    setAdminPage: (state, action) => {
      const { resource, page } = action.payload;
      if (state.pagination[resource]) {
        state.pagination[resource].page = page;
      }
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error   = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setUsers, updateUserStatus, removeUser,
  setAdminListings, updateListingStatus, removeListing,
  setReports, updateReport,
  setAdminBookings,
  setStats,
  setAdminPage,
  setLoading, setError,
} = adminSlice.actions;

export default adminSlice.reducer;
