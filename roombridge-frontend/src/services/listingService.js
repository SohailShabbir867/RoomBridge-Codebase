import api from "./api";

/** Listing API calls (public, owner, seeker) */
const listingService = {
  getListings: async (params = {}) =>
    (await api.get("/listings", { params })).data,
  getListingById: async (id) => (await api.get(`/listings/${id}`)).data,
  getMyListings: async (params = {}) =>
    (await api.get("/listings/owner/my-listings", { params })).data,
  createListing: async (formData) =>
    (await api.post("/listings", formData)).data,
  updateListing: async (id, formData) =>
    (await api.put(`/listings/${id}`, formData)).data,
  deleteListing: async (id) => (await api.delete(`/listings/${id}`)).data,
  saveListing: async (id) => (await api.post(`/listings/${id}/save`)).data,
  unsaveListing: async (id) => (await api.delete(`/listings/${id}/save`)).data,
  getSavedListings: async (params = {}) =>
    (await api.get("/listings/seeker/saved", { params })).data,
  incrementViews: async (id) => (await api.post(`/listings/${id}/views`)).data,
};

export default listingService;
