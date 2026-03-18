import api from './api';

const listingService = {
  getListings: async () => {
    const response = await api.get('/listings');
    return response.data;
  },
};

export default listingService;
