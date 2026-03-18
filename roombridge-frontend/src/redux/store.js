import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import listingReducer from './slices/listingSlice';
import bookingReducer from './slices/bookingSlice';
import chatReducer from './slices/chatSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    listing: listingReducer,
    booking: bookingReducer,
    chat: chatReducer,
    admin: adminReducer,
  },
});
