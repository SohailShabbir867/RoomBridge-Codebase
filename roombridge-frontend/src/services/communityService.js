import api from "./api";

/**
 * Community API calls.
 *
 * createCommunity / updateCommunity send multipart/form-data when an image
 * file is included (mirrors listingService.createListing). All other calls
 * are plain JSON/query params, same as listingService.
 */
const communityService = {
  /* ── Public browse ──────────────────────────────────── */
  getCommunities: async (params = {}) =>
    (await api.get("/communities", { params })).data,

  getCommunityById: async (id) =>
    (await api.get(`/communities/${id}`)).data,

  /* ── Admin: create / update / delete ───────────────────
     formData must be a FormData instance built by the caller, e.g.:
       const fd = new FormData();
       fd.append("name", name);
       fd.append("type", type);
       fd.append("city", city);
       fd.append("visibility", visibility);
       fd.append("description", description);
       if (imageFile) fd.append("image", imageFile);
  */
  createCommunity: async (formData) =>
    (await api.post("/communities", formData)).data,

  updateCommunity: async (id, formData) =>
    (await api.put(`/communities/${id}`, formData)).data,

  deleteCommunity: async (id) =>
    (await api.delete(`/communities/${id}`)).data,

  /* ── Membership ─────────────────────────────────────── */
  joinCommunity: async (id) =>
    (await api.post(`/communities/${id}/join`)).data,

  leaveCommunity: async (id) =>
    (await api.delete(`/communities/${id}/leave`)).data,

  getMembers: async (id) =>
    (await api.get(`/communities/${id}/members`)).data,

  /* ── Messages ───────────────────────────────────────── */
  getMessages: async (id, params = {}) =>
    (await api.get(`/communities/${id}/messages`, { params })).data,

  /**
   * sendMessage — text and/or image.
   * Always sends as FormData since the backend route expects multipart
   * (uploadSingle("image")), same approach as chatService.sendMessage.
   */
  sendMessage: async (id, { message = "", imageFile = null } = {}) => {
    const fd = new FormData();
    if (message) fd.append("message", message);
    if (imageFile) fd.append("image", imageFile);
    return (await api.post(`/communities/${id}/messages`, fd)).data;
  },
};

export default communityService;
