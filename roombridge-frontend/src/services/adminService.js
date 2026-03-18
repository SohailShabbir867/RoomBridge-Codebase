import api from './api';

const adminService = {
  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },
};

export default adminService;
