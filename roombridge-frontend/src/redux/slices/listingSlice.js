import { createSlice } from "@reduxjs/toolkit";

/*
  listingSlice — manages listing browse, owner listings, and filter state.

  Filter field names match backend query params:
    city, roomType (NOT 'type'), minRent (NOT 'minPrice'), maxRent (NOT 'maxPrice')
*/
const initialState = {
  listings: [],
  myListings: [], // owner's own listings
  savedListings: [], // seeker's saved listings
  currentListing: null,
  loading: false,
  error: null,
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  filters: {
    city: "",
    /*
      was 'type' — backend filter param is 'roomType'.
      Changed to 'roomType' to match Listing.model.js and listing.controller.js.
    */
    roomType: "",
    /*
      was 'minPrice'/'maxPrice' — backend uses 'minRent'/'maxRent'.
      Changed to match listing.controller.js getAllListings filter logic.
    */
    minRent: "",
    maxRent: "",
    amenities: [],
    gender: "",
    search: "",
    sortBy: "newest",
  },
};

const listingSlice = createSlice({
  name: "listing",
  initialState,
  reducers: {
    /* Public listing list */
    setListings: (state, action) => {
      state.listings = action.payload.listings ?? [];
      /*
        backend returns { listings, pagination: { total, totalPages } }
        not { listings, total }. Original code used action.payload.total (undefined).
      */
      state.totalCount =
        action.payload.pagination?.total ??
        action.payload.total ??
        action.payload.listings?.length ??
        0;
      state.totalPages =
        action.payload.pagination?.totalPages ??
        Math.ceil(state.totalCount / 12) ??
        1;
      state.loading = false;
      state.error = null;
    },

    /* Owner's own listings */
    setMyListings: (state, action) => {
      state.myListings = action.payload.listings ?? action.payload ?? [];
      state.loading = false;
    },

    /* Seeker's saved listings */
    setSavedListings: (state, action) => {
      state.savedListings = action.payload.listings ?? action.payload ?? [];
      state.loading = false;
    },

    setCurrentListing: (state, action) => {
      state.currentListing = action.payload;
      state.loading = false;
      state.error = null;
    },

    addListing: (state, action) => {
      state.listings.unshift(action.payload);
      state.myListings.unshift(action.payload);
      state.totalCount += 1;
    },

    updateListing: (state, action) => {
      const updated = action.payload;
      const updateIn = (arr) => {
        const idx = arr.findIndex((l) => l._id === updated._id);
        if (idx !== -1) arr[idx] = updated;
      };
      updateIn(state.listings);
      updateIn(state.myListings);
      if (state.currentListing?._id === updated._id) {
        state.currentListing = updated;
      }
    },

    removeListing: (state, action) => {
      const id = action.payload;
      state.listings = state.listings.filter((l) => l._id !== id);
      state.myListings = state.myListings.filter((l) => l._id !== id);
      state.totalCount = Math.max(0, state.totalCount - 1);
    },

    /* Toggle isSaved flag on a listing in local state */
    toggleSavedListing: (state, action) => {
      const { id, isSaved } = action.payload;
      const listing = state.listings.find((l) => l._id === id);
      if (listing) listing.isSaved = isSaved;
      const current = state.currentListing;
      if (current?._id === id) current.isSaved = isSaved;
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // reset to first page when filter changes
    },

    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
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
  setListings,
  setMyListings,
  setSavedListings,
  setCurrentListing,
  addListing,
  updateListing,
  removeListing,
  toggleSavedListing,
  setFilters,
  resetFilters,
  setPage,
  setLoading,
  setError,
} = listingSlice.actions;

export default listingSlice.reducer;
