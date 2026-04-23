import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

/** Shared axios instance — sends httpOnly JWT cookie with every request */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/* ── Request interceptor: handle FormData uploads ──────── */
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) delete config.headers["Content-Type"];
    return config;
  },
  (error) => Promise.reject(error),
);

/* ── Response interceptor: handle 401 auto-redirect ────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    const url = error.config?.url || "";

    // Routes where 401 is expected (don't redirect)
    const AUTH_ROUTES = [
      "/auth/me",
      "/auth/login",
      "/auth/register",
      "/auth/logout",
      "/auth/verify-email",
      "/auth/resend-verification",
    ];
    const isAuthRoute = AUTH_ROUTES.some((r) => url.includes(r));

    if (
      status === 401 &&
      !isAuthRoute &&
      !window.location.pathname.includes("/login")
    ) {
      import("../redux/store").then(({ store }) => {
        import("../redux/slices/authSlice").then(({ logout }) => {
          store.dispatch(logout());
          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        });
      });
    }

    if (!error.message) error.message = message;
    return Promise.reject(error);
  },
);

export default api;
