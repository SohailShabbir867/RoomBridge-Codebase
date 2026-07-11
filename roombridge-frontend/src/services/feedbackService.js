import api from "./api";

const feedbackService = {
  /** Submit feedback (any logged-in user) */
  submit: async (data) => (await api.post("/feedback", data)).data,

  /** Get all feedback with stats — admin only */
  getAll: async (params = {}) => (await api.get("/feedback", { params })).data,

  /** Update feedback status / admin note — admin only */
  updateStatus: async (id, data) => (await api.put(`/feedback/${id}`, data)).data,

  /** Delete a feedback entry — admin only */
  delete: async (id) => (await api.delete(`/feedback/${id}`)).data,
};

export default feedbackService;
