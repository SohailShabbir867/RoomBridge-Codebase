import api from './api';

/*
  listingService — all listing-related API calls.
  Endpoints match listing.routes.js (backend).
*/
const listingService = {

  /* ── Public: Get all active listings (with filters + pagination) ── */
  // GET /listings?city=X&minRent=Y&maxRent=Z&roomType=...&page=1&limit=12
  getListings: async (params = {}) => {
    const res = await api.get('/listings', { params });
    return res.data;
  },

  /* ── Public: Get a single listing by ID ────────────────────────── */
  // GET /listings/:id
  getListingById: async (id) => {
    const res = await api.get(`/listings/${id}`);
    return res.data;
  },

  /* ── Owner: Get all listings belonging to current owner ─────────── */
  // GET /listings/owner/my-listings?status=&page=&limit=
  getMyListings: async (params = {}) => {
    const res = await api.get('/listings/owner/my-listings', { params });
    return res.data;
  },

  /* ── Owner: Create a new listing (with photo uploads) ───────────── */
  // POST /listings — must use FormData for file uploads
  // The api.js request interceptor removes Content-Type so browser sets
  // the correct multipart/form-data boundary automatically.
  createListing: async (formData) => {
    const res = await api.post('/listings', formData);
    return res.data;
  },

  /* ── Owner: Update an existing listing ──────────────────────────── */
  // PUT /listings/:id — can include FormData for new photos + removePhotos JSON
  updateListing: async (id, formData) => {
    const res = await api.put(`/listings/${id}`, formData);
    return res.data;
  },

  /* ── Owner/Admin: Delete a listing ──────────────────────────────── */
  // DELETE /listings/:id
  deleteListing: async (id) => {
    const res = await api.delete(`/listings/${id}`);
    return res.data;
  },

  /* ── Seeker: Save a listing to favourites ───────────────────────── */
  // POST /listings/:id/save
  saveListing: async (id) => {
    const res = await api.post(`/listings/${id}/save`);
    return res.data;
  },

  /* ── Seeker: Remove listing from favourites ─────────────────────── */
  // DELETE /listings/:id/save
  unsaveListing: async (id) => {
    const res = await api.delete(`/listings/${id}/save`);
    return res.data;
  },

  /* ── Seeker: Get all saved/favourited listings ──────────────────── */
  // GET /listings/seeker/saved?page=&limit=
  getSavedListings: async (params = {}) => {
    const res = await api.get('/listings/seeker/saved', { params });
    return res.data;
  },

  /* ── Public: Record a listing view (called on detail page load) ─── */
  // POST /listings/:id/views
  // BUG FIX: getListingById no longer auto-increments — frontend must call this.
  incrementViews: async (id) => {
    const res = await api.post(`/listings/${id}/views`);
    return res.data;
  },
};

export default listingService;
