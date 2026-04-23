import { createSlice } from "@reduxjs/toolkit";

/*
  authSlice — manages authentication state.

  Key design decisions:
  1. `authChecked` flag — set to true once the initial getMe() call completes
     (success OR failure). ProtectedRoute reads this to avoid flashing /login
     during the brief moment before getMe() resolves on page refresh.

  2. `isAuthenticated` is derived from `user !== null` in selectors,
     but also stored explicitly for performance. Both are always kept in sync.

  3. No redux-persist: auth state lives only in memory. On refresh, we rely
     on the httpOnly JWT cookie — getMe() is called in App.jsx on mount,
     and authChecked prevents premature redirects.
*/
const initialState = {
  user: null,
  isAuthenticated: false,
  /* authChecked tells ProtectedRoute whether the initial getMe()
     has completed. Starts false, set to true regardless of login outcome. */
  authChecked: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /* Called after successful login or getMe() */
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.authChecked = true; // getMe completed successfully
      state.loading = false;
      state.error = null;
    },

    /* Called when getMe() returns 401 (not logged in) — still "checked" */
    setAuthChecked: (state) => {
      state.authChecked = true;
      state.loading = false;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.authChecked = true; // even on error, auth check is done
    },

    /* Clears auth state — store.js rootReducer also resets ALL other slices */
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true; // still "checked" — user is just logged out
      state.loading = false;
      state.error = null;
    },

    /* updateUser merges at the top level but also handles
       nested profilePhoto correctly without zeroing out subfields. */
    updateUser: (state, action) => {
      if (!state.user) return;
      /* Deep-merge profilePhoto specifically; shallow-merge everything else */
      if (action.payload.profilePhoto) {
        state.user = {
          ...state.user,
          ...action.payload,
          profilePhoto: {
            ...state.user.profilePhoto,
            ...action.payload.profilePhoto,
          },
        };
      } else {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  setCredentials,
  setAuthChecked,
  setLoading,
  setError,
  logout,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;
