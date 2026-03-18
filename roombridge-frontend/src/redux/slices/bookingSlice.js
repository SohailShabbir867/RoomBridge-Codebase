import { createSlice } from '@reduxjs/toolkit';

const bookingSlice = createSlice({
  name: 'booking',
  initialState: { bookings: [], loading: false, error: null },
  reducers: {
    setBookings: (state, action) => { state.bookings = action.payload; },
  },
});

export const { setBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
