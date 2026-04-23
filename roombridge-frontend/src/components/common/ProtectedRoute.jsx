import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "./Loader";

/**
 * ProtectedRoute
 *
 * Props:
 *   role — required role: 'owner' | 'seeker' | 'admin'
 *
 * Behaviour:
 *   1. If auth check hasn't completed yet (authChecked === false), show a
 *      loading spinner. This prevents the redirect-to-login flash that
 *      occurred when the initial getMe() call hadn't resolved yet on refresh.
 *
 *   2. If not authenticated → redirect to /login, preserving the intended
 *      path in location state so we can redirect back after login.
 *
 *   3. If authenticated but wrong role → redirect to the user's own dashboard.
 *
 *   4. If authenticated and correct role → render <Outlet />.
 */
const DASHBOARD = {
  owner: "/owner/dashboard",
  seeker: "/seeker/dashboard",
  admin: "/admin/dashboard",
};

const ProtectedRoute = ({ role }) => {
  const location = useLocation();
  const { user, isAuthenticated, authChecked } = useSelector((s) => s.auth);

  /*
    Original code had no authChecked guard.
    On first page load the Redux store initialises with isAuthenticated: false
    and user: null. If the user has a valid httpOnly cookie, getMe() runs in
    App.jsx and will eventually set credentials — but ProtectedRoute renders
    BEFORE that resolves and immediately dispatches <Navigate to="/login">.
    The user is kicked to /login even though they're actually logged in.

    Fix: authChecked starts as false. It's set to true by:
      - setCredentials (successful getMe / login)
      - setAuthChecked (getMe returned 401 — user is not logged in)
      - setError       (getMe failed for another reason)
    Until authChecked is true, we show a fullscreen loader instead of redirecting.
  */
  if (!authChecked) {
    return <Loader fullScreen text="Checking session…" />;
  }

  /* Not logged in → /login (save current path for post-login redirect) */
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  /* Logged in but wrong role → their own dashboard */
  if (role && user.role !== role) {
    const dest = DASHBOARD[user.role] ?? "/";
    return <Navigate to={dest} replace />;
  }

  /* ✅ Correct role — render child routes */
  return <Outlet />;
};

export default ProtectedRoute;
