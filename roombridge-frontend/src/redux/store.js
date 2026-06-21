import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout } from "./slices/authSlice";
import listingReducer from "./slices/listingSlice";
import bookingReducer from "./slices/bookingSlice";
import chatReducer from "./slices/chatSlice";
import adminReducer from "./slices/adminSlice";
import communityReducer from "./slices/communitySlice";

/*
  Root reducer factory.
  When a user logs out, only the auth slice was being reset.
  All other slices (booking, chat, listing, admin) retained stale data
  from the previous user session. If a different user logs in on the
  same browser tab, they would see the previous user's cached bookings,
  messages, and listings.

  Fix: we pass a rootReducer wrapper that intercepts the 'auth/logout'
  action and resets ALL slices to their initial states.
*/
/*
  Root reducer that resets entire state tree on logout.
  When 'auth/logout' is dispatched, all slices reset to undefined,
  which causes each reducer to return its own initialState.
*/
const rootReducer = (state, action) => {
  if (action.type === logout.type) {
    /* Pass undefined so every sub-reducer falls back to its initialState */
    state = undefined;
  }

  return {
    auth: authReducer(state?.auth, action),
    listing: listingReducer(state?.listing, action),
    booking: bookingReducer(state?.booking, action),
    chat: chatReducer(state?.chat, action),
    admin: adminReducer(state?.admin, action),
    community: communityReducer(state?.community, action),
  };
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        /*
          Ignore serialization warnings for these action types.
          FormData and File objects appear in certain thunk payloads
          and are inherently non-serializable; this prevents console spam.
        */
        ignoredActions: ["listing/setCurrentListing", "listing/setListings"],
        ignoredPaths: ["listing.currentListing.photos"],
      },
    }),
  devTools: import.meta.env.DEV,
});
