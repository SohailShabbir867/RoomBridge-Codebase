import { createSlice } from '@reduxjs/toolkit';

/*
  chatSlice — manages conversations, messages, and unread count.
*/
const initialState = {
  conversations:       [],
  activeConversationId: null,   // the conversationId currently being viewed
  messages:            [],      // messages for activeConversationId only
  loading:             false,
  messagesLoading:     false,
  error:               null,
  unreadCount:         0,
  totalMessages:       0,
  hasMoreMessages:     false,   // for load-more / pagination
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload ?? [];
      state.loading       = false;
      state.error         = null;
      /* Recompute total unread from conversations list */
      state.unreadCount = state.conversations.reduce(
        (sum, c) => sum + (c.unreadCount || 0), 0
      );
    },

    /*
      BUG FIX: setCurrentConversation now sets the activeConversationId.
      This is used to validate incoming socket messages before appending.
      Old version just had currentConversation which was a full object —
      we now track only the ID and let messages load separately.
    */
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload?.conversationId ?? action.payload;
      state.messages             = [];  // clear messages for the new conversation
      state.hasMoreMessages      = false;
    },

    setMessages: (state, action) => {
      /*
        Accept either raw array or paginated response.
        For load-more: we prepend (older messages) rather than replace.
      */
      if (Array.isArray(action.payload)) {
        state.messages       = action.payload;
        state.totalMessages  = action.payload.length;
        state.hasMoreMessages = false;
      } else {
        /* Paginated: data.messages comes sorted ascending (oldest first).
           If loading page > 1, PREPEND to existing messages. */
        const incoming = action.payload.messages ?? [];
        const page     = action.payload.page ?? 1;
        if (page > 1) {
          state.messages    = [...incoming, ...state.messages];
        } else {
          state.messages    = incoming;
        }
        state.totalMessages  = action.payload.total     ?? incoming.length;
        state.hasMoreMessages = action.payload.hasNextPage ?? false;
      }
      state.messagesLoading = false;
    },

    /*
      BUG FIX: addMessage now checks that the incoming message belongs to
      the active conversation before appending. If a socket event fires
      while the user is in a different chat, it won't corrupt the message list.
    */
    addMessage: (state, action) => {
      const msg = action.payload;
      if (
        !state.activeConversationId ||
        msg.conversationId === state.activeConversationId
      ) {
        /* Prevent duplicates (socket + REST response both arriving) */
        const alreadyExists = state.messages.some((m) => m._id === msg._id);
        if (!alreadyExists) {
          state.messages.push(msg);
          state.totalMessages += 1;
        }
      }
      /* Always update the relevant conversation's last message */
      const conv = state.conversations.find(
        (c) => c.conversationId === msg.conversationId
      );
      if (conv) {
        conv.lastMessage = msg;
      }
    },

    /*
      BUG FIX: updateConversation was missing entirely.
      Called when a new message arrives for a non-active conversation
      to update the last message and unread count in the list.
    */
    updateConversation: (state, action) => {
      const { conversationId, lastMessage, increment } = action.payload;
      const conv = state.conversations.find(
        (c) => c.conversationId === conversationId
      );
      if (conv) {
        if (lastMessage) conv.lastMessage = lastMessage;
        if (increment)   conv.unreadCount = (conv.unreadCount || 0) + 1;
      } else {
        /* New conversation — will show on next full refresh */
      }
      /* Recompute global unread badge */
      state.unreadCount = state.conversations.reduce(
        (sum, c) => sum + (c.unreadCount || 0), 0
      );
    },

    /* Mark all messages in active conversation as read */
    markConversationRead: (state, action) => {
      const conversationId = action.payload;
      state.messages = state.messages.map((m) =>
        m.conversationId === conversationId ? { ...m, isRead: true } : m
      );
      const conv = state.conversations.find(
        (c) => c.conversationId === conversationId
      );
      if (conv) conv.unreadCount = 0;
      state.unreadCount = state.conversations.reduce(
        (sum, c) => sum + (c.unreadCount || 0), 0
      );
    },

    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },

    incrementUnread: (state) => {
      state.unreadCount += 1;
    },

    resetUnread: (state) => {
      state.unreadCount = 0;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setMessagesLoading: (state, action) => {
      state.messagesLoading = action.payload;
    },

    setError: (state, action) => {
      state.error   = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setConversations, setActiveConversation,
  setMessages, addMessage,
  updateConversation, markConversationRead,
  setUnreadCount, incrementUnread, resetUnread,
  setLoading, setMessagesLoading, setError,
} = chatSlice.actions;

export default chatSlice.reducer;
