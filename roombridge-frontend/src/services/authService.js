import api from './api';

const authService = {
  login: async (userData) => {
    const response = await api.post('/auth/login', userData);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

export default authService;
