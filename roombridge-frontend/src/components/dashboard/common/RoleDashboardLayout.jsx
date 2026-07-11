import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  RiDashboardLine,
  RiSearchLine,
  RiHeart3Line,
  RiCalendarCheckLine,
  RiGroupLine,
  RiMessageLine,
  RiUserLine,
  RiHome4Line,
  RiAddLine,
  RiFlagLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiCloseLine,
  RiMailLine,
  RiBroadcastLine,
  RiGlobalLine,
  RiChatSmile3Line,
} from "react-icons/ri";
import authService from "../../../services/authService";
import { logout } from "../../../redux/slices/authSlice";
import Logo from "../../common/Logo";
import toast from "react-hot-toast";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D"; // dark green
const ACC = "#FFAB69"; // orange accent
const CR  = "#F7F4EF"; // cream background

const NAV_BY_ROLE = {
  seeker: [
    { to: "/seeker/dashboard", icon: RiDashboardLine, label: "Dashboard" },
    { to: "/explore", icon: RiSearchLine, label: "Browse Rooms" },
    { to: "/seeker/saved", icon: RiHeart3Line, label: "Saved Rooms" },
    { to: "/seeker/requests", icon: RiCalendarCheckLine, label: "My Requests" },
    { to: "/seeker/roommate-match", icon: RiGroupLine, label: "Roommate Match" },
    { to: "/seeker/messages", icon: RiMessageLine, label: "Messages" },
    { to: "/seeker/reports",         icon: RiFlagLine,          label: "My Reports" },
    { to: "/seeker/profile",         icon: RiUserLine,          label: "My Profile" },
    { to: "/",                       icon: RiGlobalLine,        label: "Home Page" },
  ],
  owner: [
    { to: "/owner/dashboard",        icon: RiDashboardLine,     label: "Dashboard" },
    { to: "/owner/listings",         icon: RiHome4Line,         label: "My Listings",       end: true },
    { to: "/owner/listings/create",  icon: RiAddLine,           label: "Post Room" },
    { to: "/owner/bookings",         icon: RiCalendarCheckLine, label: "Booking Requests" },
    { to: "/owner/messages",         icon: RiMessageLine,       label: "Messages" },
    { to: "/owner/reports",          icon: RiFlagLine,          label: "My Reports" },
    { to: "/",                       icon: RiGlobalLine,        label: "Home Page" },
  ],
  admin: [
    { to: "/admin/dashboard", icon: RiDashboardLine, label: "Dashboard" },
    { to: "/admin/users", icon: RiGroupLine, label: "Manage Users" },
    { to: "/admin/listings", icon: RiHome4Line, label: "Manage Listings" },
    { to: "/admin/bookings", icon: RiCalendarCheckLine, label: "Bookings" },
    { to: "/admin/messages", icon: RiMessageLine, label: "Messages" },
    { to: "/admin/contact-messages", icon: RiMailLine, label: "Contact Messages" },
    { to: "/admin/reports",        icon: RiFlagLine,       label: "Reports" },
    { to: "/admin/notifications",  icon: RiBroadcastLine,  label: "Notifications" },
    { to: "/admin/communities",    icon: RiGroupLine,        label: "Communities" },
    { to: "/admin/feedback",       icon: RiChatSmile3Line,   label: "Feedback" },
    { to: "/admin/profile",        icon: RiUserLine,         label: "My Profile" },
    { to: "/",                     icon: RiGlobalLine,     label: "Home Page" },
  ],
};

const ROLE_LABEL = {
  seeker: "Room Seeker",
  owner: "Property Owner",
  admin: "Administrator",
};

const RoleDashboardLayout = ({
  role,
  title,
  subtitle,
  headerAction,
  mainClassName = "p-6",
  children,
}) => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  const nav = NAV_BY_ROLE[role] || [];

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors and clear client state anyway.
    }
    dispatch(logout());
    toast.success("Logged out.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: CR }}>
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col shadow-2xl
                    transition-transform duration-300
                    ${sideOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: DK }}
      >
        {/* Logo + close */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <Logo isDarkBg={true} onClick={() => setSideOpen(false)} />
          <button
            onClick={() => setSideOpen(false)}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm"
              style={{ backgroundColor: `${ACC}25`, color: ACC }}
            >
              {user?.profilePhoto?.url ? (
                <img
                  src={user.profilePhoto.url}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: `${ACC}99` }}>
                {ROLE_LABEL[role]}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => {
                if (window.innerWidth < 1024) setSideOpen(false);
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "text-white"
                    : "text-white/55 hover:text-white hover:bg-white/8"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: `${ACC}20`, color: ACC }
                  : {}
              }
            >
              <Icon className="text-base shrink-0" /> {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium
                       text-white/55 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <RiLogoutBoxLine className="text-base" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* Toggle button when sidebar is closed */}
      {!sideOpen && (
        <button
          onClick={() => setSideOpen(true)}
          aria-label="Open sidebar"
          className="fixed top-4 left-3 lg:left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg
                     text-white transition-colors"
          style={{ backgroundColor: DK }}
        >
          <RiMenuLine className="text-lg" />
        </button>
      )}

      {/* ── Main area ─────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ${
          sideOpen ? "lg:ml-60" : "lg:ml-0"
        }`}
      >
        {/* Top header */}
        <header
          className={`sticky top-0 z-20 bg-white border-b border-[#E8E2D9] pr-4 sm:pr-6 py-3 flex items-center justify-between gap-3 ${
            sideOpen ? "pl-4 sm:pl-6" : "pl-14 sm:pl-16"
          }`}
        >
          <div className="min-w-0">
            <h1
              className="font-bold text-sm sm:text-base leading-tight truncate"
              style={{ color: DK }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-400 text-xs truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </header>

        <main className={`flex-1 ${mainClassName}`}>{children}</main>
      </div>
    </div>
  );
};

export default RoleDashboardLayout;
