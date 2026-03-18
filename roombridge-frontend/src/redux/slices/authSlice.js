import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null },
  reducers: {
    setUser: (state, action) => { state.user = action.payload; },
    logout: (state) => { state.user = null; },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
