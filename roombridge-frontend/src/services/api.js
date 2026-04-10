import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/*
  Shared axios instance used by ALL service files.
  - baseURL:         from VITE_API_URL env var (falls back to localhost)
  - withCredentials: true — required for httpOnly JWT cookie to be sent
  - timeout:         15 seconds
*/
const api = axios.create({
  baseURL:         API_BASE_URL,
  withCredentials: true,
  timeout:         15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ── Request Interceptor ────────────────────────────────────────
   When sending FormData (file uploads), the browser must set the
   Content-Type boundary automatically. Deleting the header here
   lets axios/browser set it correctly as multipart/form-data. */
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor ───────────────────────────────────────
   BUG FIX: Original 401 handler fired window.location.href='/login'
   on EVERY 401 — including the initial getMe() check which 401s when
   the user is not logged in. This caused an immediate redirect loop:
     1. App loads → dispatches getMe() → 401 (not logged in)
     2. Interceptor fires → window.location.href='/login'
     3. /login loads → getMe() → 401 → redirect → infinite loop

   Fix:
   - Do NOT redirect on 401 from /auth/me or /auth/login or /auth/register
     routes — these are expected to 401 when user is not authenticated.
   - Only redirect if we're on a non-auth route AND NOT already on /login.
   - Dispatch Redux logout() to clear client state.
   - Use a small timeout before redirect so Redux has time to process. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status    = error.response?.status;
    const message   = error.response?.data?.message || error.message || 'An error occurred';
    const url       = error.config?.url || '';

    /* Routes where 401 is expected and should NOT trigger a redirect */
    const AUTH_ROUTES = ['/auth/me', '/auth/login', '/auth/register', '/auth/logout', '/auth/verify-email', '/auth/resend-verification'];
    const isAuthRoute = AUTH_ROUTES.some(r => url.includes(r));

    if (status === 401 && !isAuthRoute) {
      /* Not on login page already */
      if (!window.location.pathname.includes('/login')) {
        /* Lazy-load store to avoid circular imports */
        import('../redux/store').then(({ store }) => {
          import('../redux/slices/authSlice').then(({ logout }) => {
            store.dispatch(logout());
            /* Small delay so Redux processes before redirect */
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          });
        });
      }
    }

    /*
      BUG FIX: Original threw a plain { status, message, data } object.
      Components using try/catch expected normal Error objects OR the
      original axios error shape (err.response?.data?.message).
      Now we enrich the original error object and re-throw it — preserving
      err.response so components using err.response?.data?.message still work.
    */
    const enrichedError = error;
    if (!enrichedError.message) {
      enrichedError.message = message;
    }

    return Promise.reject(enrichedError);
  }
);

export default api;
