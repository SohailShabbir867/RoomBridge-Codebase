import { createSlice } from '@reduxjs/toolkit';

const listingSlice = createSlice({
  name: 'listing',
  initialState: { listings: [], loading: false, error: null },
  reducers: {
    setListings: (state, action) => { state.listings = action.payload; },
  },
});

export const { setListings } = listingSlice.actions;
export default listingSlice.reducer;
