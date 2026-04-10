import api from './api';

/*
  chatService — all messaging-related API calls.
  Endpoints match message.routes.js (backend).

  Real-time events are handled via SocketContext (socket.io-client).
  This service handles the REST API calls for initial data loading
  and persistence. Socket.io handles live delivery.
*/
const chatService = {

  /* ── Get all conversations with last message + unread count ─────── */
  // GET /messages/conversations
  getConversations: async () => {
    const res = await api.get('/messages/conversations');
    return res.data;
  },

  /* ── Get paginated messages in a conversation ────────────────────── */
  // GET /messages/:conversationId?page=1&limit=30
  // conversationId format: "userId1_userId2" (sorted alphabetically)
  getMessages: async (conversationId, params = {}) => {
    const res = await api.get(`/messages/${conversationId}`, { params });
    return res.data;
  },

  /* ── Send a new text message ─────────────────────────────────────── */
  // POST /messages
  // messageData = { receiverId, message, listingId? }
  // Note: socket.io also emits the message for real-time delivery.
  //       This call persists the message and returns the saved doc
  //       which is used to update local state.
  sendMessage: async (messageData) => {
    const res = await api.post('/messages', messageData);
    return res.data;
  },

  /* ── Mark all messages in a conversation as read ─────────────────── */
  // PUT /messages/:conversationId/read
  markAsRead: async (conversationId) => {
    const res = await api.put(`/messages/${conversationId}/read`);
    return res.data;
  },
};

export default chatService;
