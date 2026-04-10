import api from './api';

/*
  authService — all auth-related API calls.
  All endpoints match the backend routes in auth.routes.js and user.routes.js.
*/
const authService = {

  /* ── Register ───────────────────────────────────────────────── */
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  /* ── Login ──────────────────────────────────────────────────── */
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  /* ── Logout (clears httpOnly cookie server-side) ────────────── */
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  /* ── Get current user from cookie (called on app load) ──────── */
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data; // { user, preference }
  },

  /* ── Forgot password (triggers reset email) ─────────────────── */
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  /* ── Reset password via token from email link ───────────────── */
  // Backend route: PUT /auth/reset-password/:token
  resetPassword: async (token, password) => {
    const res = await api.put(`/auth/reset-password/${token}`, { password });
    return res.data;
  },

  /* ── Update profile (name, phone, city, bio) ────────────────── */
  // Backend route: PUT /users/profile  (user.routes.js, not auth.routes.js)
  updateProfile: async (formData) => {
    const res = await api.put('/users/profile', formData);
    return res.data;
  },

  /* ── Upload/replace profile photo ──────────────────────────── */
  // Backend route: PUT /users/profile/photo
  // Must send FormData so axios strips Content-Type for multipart
  updateProfilePhoto: async (formData) => {
    const res = await api.put('/users/profile/photo', formData);
    return res.data;
  },

  /* ── Remove profile photo ───────────────────────────────────── */
  // Backend route: DELETE /users/profile/photo
  removeProfilePhoto: async () => {
    const res = await api.delete('/users/profile/photo');
    return res.data;
  },

  /* ── Change password (while logged in) ────────────────────────
     Backend route: PUT /auth/update-password (NOT /auth/change-password) */
  changePassword: async (data) => {
    // data = { currentPassword, newPassword }
    const res = await api.put('/auth/update-password', data);
    return res.data;
  },

  /* ── Get all seekers (owner only — for roommate matching) ─────
     Backend route: GET /users/seekers */
  getAllSeekers: async (params = {}) => {
    const res = await api.get('/users/seekers', { params });
    return res.data;
  },
};

export default authService;
