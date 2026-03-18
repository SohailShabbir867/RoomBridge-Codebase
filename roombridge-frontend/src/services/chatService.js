import api from './api';

const chatService = {
  sendMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },
};

export default chatService;
