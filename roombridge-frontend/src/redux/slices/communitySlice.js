import { createSlice } from "@reduxjs/toolkit";

/*
  communitySlice — manages community browse list, the currently open
  community room, its member list, and its message feed.

  Kept deliberately separate from listingSlice/chatSlice rather than
  reusing chatSlice, because:
    - chatSlice models 1:1 DM conversations (conversationId, otherUser)
    - communities are N-member rooms with join/leave + visibility rules
  Mixing the two shapes would force awkward optional fields onto chatSlice.
*/
const initialState = {
  communities: [], // browse list (all types/cities)
  currentCommunity: null, // full detail of the open community
  members: [], // members of currentCommunity
  messages: [], // message feed of currentCommunity
  loading: false,
  error: null,
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  filters: {
    type: "", // "city" | "announcement" | "general" | ""
    city: "",
  },
};

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    /* Browse list */
    setCommunities: (state, action) => {
      state.communities = action.payload.communities ?? action.payload.data ?? [];
      state.totalCount =
        action.payload.pagination?.total ?? state.communities.length;
      state.totalPages = action.payload.pagination?.totalPages ?? 1;
      state.loading = false;
      state.error = null;
    },

    addCommunity: (state, action) => {
      state.communities.unshift(action.payload);
      state.totalCount += 1;
    },

    updateCommunityInList: (state, action) => {
      const updated = action.payload;
      const idx = state.communities.findIndex((c) => c._id === updated._id);
      if (idx !== -1) state.communities[idx] = updated;
      if (state.currentCommunity?._id === updated._id) {
        state.currentCommunity = { ...state.currentCommunity, ...updated };
      }
    },

    removeCommunity: (state, action) => {
      const id = action.payload;
      state.communities = state.communities.filter((c) => c._id !== id);
      state.totalCount = Math.max(0, state.totalCount - 1);
      if (state.currentCommunity?._id === id) state.currentCommunity = null;
    },

    /* Current open community (room view) */
    setCurrentCommunity: (state, action) => {
      state.currentCommunity = action.payload;
      state.loading = false;
      state.error = null;
    },

    setJoined: (state, action) => {
      const { isJoined, memberCount } = action.payload;
      if (state.currentCommunity) {
        state.currentCommunity.isJoined = isJoined;
        if (memberCount !== undefined) {
          state.currentCommunity.memberCount = memberCount;
        }
      }
      const listed = state.communities.find(
        (c) => c._id === state.currentCommunity?._id,
      );
      if (listed) listed.isJoined = isJoined;
    },

    /* Members */
    setMembers: (state, action) => {
      state.members = action.payload;
    },

    /* Messages */
    setMessages: (state, action) => {
      state.messages = action.payload;
    },

    addMessage: (state, action) => {
      const msg = action.payload;
      if (state.messages.some((m) => m._id === msg._id)) return;
      state.messages.push(msg);
    },

    prependMessages: (state, action) => {
      /* Used when loading older messages on scroll-up pagination */
      const existingIds = new Set(state.messages.map((m) => m._id));
      const older = action.payload.filter((m) => !existingIds.has(m._id));
      state.messages = [...older, ...state.messages];
    },

    clearRoom: (state) => {
      state.currentCommunity = null;
      state.members = [];
      state.messages = [];
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },

    setPage: (state, action) => {
      state.currentPage = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setCommunities,
  addCommunity,
  updateCommunityInList,
  removeCommunity,
  setCurrentCommunity,
  setJoined,
  setMembers,
  setMessages,
  addMessage,
  prependMessages,
  clearRoom,
  setFilters,
  setPage,
  setLoading,
  setError,
} = communitySlice.actions;

export default communitySlice.reducer;
