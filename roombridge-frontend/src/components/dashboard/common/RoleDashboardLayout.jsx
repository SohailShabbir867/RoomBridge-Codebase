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
} from "react-icons/ri";
import authService from "../../../services/authService";
import { logout } from "../../../redux/slices/authSlice";
import toast from "react-hot-toast";

const NAV_BY_ROLE = {
  seeker: [
    { to: "/seeker/dashboard", icon: RiDashboardLine, label: "Dashboard" },
    { to: "/listings", icon: RiSearchLine, label: "Browse Rooms" },
    { to: "/seeker/saved", icon: RiHeart3Line, label: "Saved Rooms" },
    {
      to: "/seeker/requests",
      icon: RiCalendarCheckLine,
      label: "My Requests",
    },
    {
      to: "/seeker/roommate-match",
      icon: RiGroupLine,
      label: "Roommate Match",
    },
    { to: "/seeker/messages", icon: RiMessageLine, label: "Messages" },
    { to: "/seeker/reports", icon: RiFlagLine, label: "My Reports" },
    { to: "/seeker/profile", icon: RiUserLine, label: "My Profile" },
  ],
  owner: [
    { to: "/owner/dashboard", icon: RiDashboardLine, label: "Dashboard" },
    { to: "/owner/listings", icon: RiHome4Line, label: "My Listings" },
    { to: "/owner/listings/create", icon: RiAddLine, label: "Post Room" },
    {
      to: "/owner/bookings",
      icon: RiCalendarCheckLine,
      label: "Booking Requests",
    },
    { to: "/owner/messages", icon: RiMessageLine, label: "Messages" },
    { to: "/owner/reports", icon: RiFlagLine, label: "My Reports" },
  ],
  admin: [
    { to: "/admin/dashboard", icon: RiDashboardLine, label: "Dashboard" },
    { to: "/admin/users", icon: RiGroupLine, label: "Manage Users" },
    { to: "/admin/listings", icon: RiHome4Line, label: "Manage Listings" },
    { to: "/admin/bookings", icon: RiCalendarCheckLine, label: "Bookings" },
    { to: "/admin/messages", icon: RiMessageLine, label: "Messages" },
    {
      to: "/admin/contact-messages",
      icon: RiMailLine,
      label: "Contact Messages",
    },
    { to: "/admin/reports", icon: RiFlagLine, label: "Reports" },
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
    <div className="min-h-screen bg-background flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary flex flex-col shadow-2xl transition-transform duration-300 ${
          sideOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
              <span className="text-primary text-sm font-bold">R</span>
            </div>
            <span className="text-white font-bold text-lg truncate">
              Room<span className="text-accent">Bridge</span>
            </span>
          </Link>
          <button
            onClick={() => setSideOpen(false)}
            aria-label="Close sidebar"
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden shrink-0">
              {user?.profilePhoto?.url ? (
                <img
                  src={user.profilePhoto.url}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-accent font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user?.name}
              </p>
              <p className="text-white/50 text-xs">{ROLE_LABEL[role]}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                if (window.innerWidth < 1024) setSideOpen(false);
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`
              }
            >
              <Icon className="text-base shrink-0" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/70 hover:text-error hover:bg-red-500/10 transition-all duration-150"
          >
            <RiLogoutBoxLine className="text-base" /> Logout
          </button>
        </div>
      </aside>

      {sideOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {!sideOpen && (
        <button
          onClick={() => setSideOpen(true)}
          aria-label="Open sidebar"
          className="fixed top-4 left-3 lg:left-4 z-50 w-10 h-10 rounded-full border border-primary
                     bg-primary text-white flex items-center justify-center shadow-card
                     hover:bg-secondary transition-colors"
        >
          <RiMenuLine className="text-xl" />
        </button>
      )}

      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ${
          sideOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <header
          className={`sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border pr-3 sm:pr-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3 ${
            sideOpen ? "pl-3 sm:pl-6 lg:pl-6" : "pl-14 sm:pl-16 lg:pl-20"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="font-bold text-primary text-base sm:text-lg leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-text-secondary text-xs truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </header>

        <main className={`flex-1 ${mainClassName}`}>{children}</main>
      </div>
    </div>
  );
};

export default RoleDashboardLayout;
