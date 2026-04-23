import api from "./api";

/** Auth & user profile API calls */
const authService = {
  register: async (userData) =>
    (await api.post("/auth/register", userData)).data,
  login: async (credentials) =>
    (await api.post("/auth/login", credentials)).data,
  logout: async () => (await api.post("/auth/logout")).data,
  getMe: async () => (await api.get("/auth/me")).data,
  forgotPassword: async (email) =>
    (await api.post("/auth/forgot-password", { email })).data,
  resetPassword: async (token, password) =>
    (await api.put(`/auth/reset-password/${token}`, { password })).data,
  updateProfile: async (formData) =>
    (await api.put("/users/profile", formData)).data,
  updateProfilePhoto: async (formData) =>
    (await api.put("/users/profile/photo", formData)).data,
  removeProfilePhoto: async () =>
    (await api.delete("/users/profile/photo")).data,
  changePassword: async (data) =>
    (await api.put("/auth/update-password", data)).data,
  getAllSeekers: async (params = {}) =>
    (await api.get("/users/seekers", { params })).data,
};

export default authService;
