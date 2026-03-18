import { createSlice } from '@reduxjs/toolkit';

const adminSlice = createSlice({
  name: 'admin',
  initialState: { reports: [], loading: false, error: null },
  reducers: {
    setReports: (state, action) => { state.reports = action.payload; },
  },
});

export const { setReports } = adminSlice.actions;
export default adminSlice.reducer;
