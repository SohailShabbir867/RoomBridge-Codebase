import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Loader from "../components/common/Loader";
import ProtectedRoute from "../components/common/ProtectedRoute";

// ── Public Pages ──────────────────────────────────────────────────
const HomePage = lazy(() => import("../pages/public/HomePage"));
const ListingsPage = lazy(() => import("../pages/public/ListingsPage"));
const ListingDetailPage = lazy(
  () => import("../pages/public/ListingDetailPage"),
);
const AboutPage    = lazy(() => import("../pages/public/AboutPage"));
const AboutUsPage  = lazy(() => import("../pages/public/AboutUsPage"));
const CommunityPage = lazy(() => import("../pages/public/CommunityPage"));
const CommunityRoomPage = lazy(() => import("../pages/public/CommunityRoomPage"));
const ContactPage  = lazy(() => import("../pages/public/ContactPage"));
const TermsPage = lazy(() => import("../pages/public/TermsPage"));
const PrivacyPage = lazy(() => import("../pages/public/PrivacyPage"));
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage"));

// ── Auth Pages ────────────────────────────────────────────────────
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("../pages/auth/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const CheckEmailPage = lazy(() => import("../pages/auth/CheckEmailPage"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage"));

// ── Owner Pages ───────────────────────────────────────────────────
const OwnerDashboard = lazy(() => import("../pages/owner/OwnerDashboard"));
const MyListings = lazy(() => import("../pages/owner/MyListings"));
const CreateListing = lazy(() => import("../pages/owner/CreateListing"));
const EditListing = lazy(() => import("../pages/owner/EditListing"));
const BookingRequests = lazy(() => import("../pages/owner/BookingRequests"));
const OwnerMessages = lazy(() => import("../pages/owner/OwnerMessages"));
const OwnerMyReports = lazy(() => import("../pages/owner/OwnerMyReports"));
const OwnerProfile = lazy(() => import("../pages/owner/OwnerProfile"));

// ── Seeker Pages ──────────────────────────────────────────────────
const SeekerDashboard = lazy(() => import("../pages/seeker/SeekerDashboard"));
const SavedListings = lazy(() => import("../pages/seeker/SavedListings"));
const MyRequests = lazy(() => import("../pages/seeker/MyRequests"));
const RoommateMatch = lazy(() => import("../pages/seeker/RoommateMatch"));
const SeekerMessages = lazy(() => import("../pages/seeker/SeekerMessages"));
const SeekerProfile = lazy(() => import("../pages/seeker/SeekerProfile"));
const SeekerMyReports = lazy(() => import("../pages/seeker/SeekerMyReports"));

// ── Admin Pages ───────────────────────────────────────────────────
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
const ManageListings = lazy(() => import("../pages/admin/ManageListings"));
const Reports = lazy(() => import("../pages/admin/Reports"));
const AdminMessages = lazy(() => import("../pages/admin/AdminMessages"));
const AdminBookings = lazy(() => import("../pages/admin/AdminBookings"));
const AdminContactMessages = lazy(
  () => import("../pages/admin/AdminContactMessages"),
);
const AdminProfile = lazy(() => import("../pages/admin/AdminProfile"));
const SendNotifications = lazy(() => import("../pages/admin/SendNotifications"));
const ManageCommunities = lazy(() => import("../pages/admin/ManageCommunities"));

/* ── Role → dashboard path mapping ────────────────────────────── */
const DASHBOARD_PATH = {
  owner: "/owner/dashboard",
  seeker: "/seeker/dashboard",
  admin: "/admin/dashboard",
};

/* ── PublicLayout: Navbar + page content + Footer ──────────────── */
const PublicLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="grow animate-fade-in pt-16">
      <Outlet />
    </main>
    <Footer />
  </div>
);

/* ── AuthLayout: Navbar + auth form content (no Footer) ─────────
   Auth pages (login/register/forgot/reset) are now in their
   own layout. If the user is ALREADY authenticated, redirect them
   straight to their dashboard instead of showing the form.
   Prevents a logged-in owner from accidentally seeing the register page. */
const AuthLayout = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated && user) {
    /* BUG FIX: if user.role is undefined/unrecognized, fall back to "/"
       instead of silently sending to a broken path. */
    const dest = DASHBOARD_PATH[user.role];
    if (dest) return <Navigate to={dest} replace />;
    /* Unknown role — go to home rather than loop */
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="grow animate-fade-in pt-16">
        <Outlet />
      </main>
    </div>
  );
};

/* ── DashboardLayout: full-screen, no public Navbar/Footer ─────── */
const DashboardLayout = () => (
  <main className="animate-fade-in">
    <Outlet />
  </main>
);



/* ── AppRoutes ───────────────────────────────────────────────────── */
const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <Routes>
        {/* ── Public Pages (Navbar + Footer) ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ListingsPage />} />
          <Route path="/explore/:id" element={<ListingDetailPage />} />
          <Route path="/how-it-works" element={<AboutPage />} />
          <Route path="/about"        element={<AboutUsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/communities/:id" element={<CommunityRoomPage />} />
          <Route path="/contact"   element={<ContactPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
        </Route>

        {/* ── Auth Pages (Navbar only, redirect if already logged in) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        </Route>

        {/* ── Owner Dashboard (Protected, role=owner) ── */}
        <Route element={<DashboardLayout />}>
          <Route path="/owner" element={<ProtectedRoute role="owner" />}>
            {/* /owner → /owner/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="listings" element={<MyListings />} />
            <Route path="listings/create" element={<CreateListing />} />
            <Route path="listings/:id/edit" element={<EditListing />} />
            <Route path="bookings" element={<BookingRequests />} />
            <Route path="messages" element={<OwnerMessages />} />
            <Route path="reports" element={<OwnerMyReports />} />
            <Route path="profile" element={<OwnerProfile />} />
          </Route>
        </Route>

        {/* ── Seeker Dashboard (Protected, role=seeker) ── */}
        <Route element={<DashboardLayout />}>
          <Route path="/seeker" element={<ProtectedRoute role="seeker" />}>
            {/* /seeker → /seeker/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SeekerDashboard />} />
            <Route path="saved" element={<SavedListings />} />
            <Route path="requests" element={<MyRequests />} />
            <Route path="roommate-match" element={<RoommateMatch />} />
            <Route path="messages" element={<SeekerMessages />} />
            <Route path="profile" element={<SeekerProfile />} />
            <Route path="reports" element={<SeekerMyReports />} />
          </Route>
        </Route>

        {/* ── Admin Dashboard (Protected, role=admin) ── */}
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            {/* /admin → /admin/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="listings" element={<ManageListings />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="contact-messages" element={<AdminContactMessages />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="notifications" element={<SendNotifications />} />
            <Route path="communities" element={<ManageCommunities />} />
          </Route>
        </Route>

        {/* ── 404 Fallback ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
