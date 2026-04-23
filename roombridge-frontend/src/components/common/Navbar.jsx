import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import {
  RiMenuLine,
  RiCloseLine,
  RiUserLine,
  RiDashboardLine,
  RiLogoutBoxLine,
  RiArrowDownSLine,
  RiHome4Line,
  RiInformationLine,
  RiAddCircleLine,
  RiMessageLine,
} from "react-icons/ri";
import toast from "react-hot-toast";
import authService from "../../services/authService";
import chatService from "../../services/chatService";
import { useSocket } from "../../context/SocketContext";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { isConnected, on, off } = useSocket();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);

  /* ── Scroll shadow ─────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close profile dropdown on outside click ────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Close mobile menu on resize to desktop ─────────────────── */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Lock body scroll when mobile menu is open ──────────────── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* ── Logout ─────────────────────────────────────────────────── */
  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    setMenuOpen(false);
    try {
      await authService.logout();
    } catch {
      /* Even if the server call fails, clear local state */
    }
    /*
      store.js rootReducer intercepts logout action and resets
      ALL slices (booking, chat, listing, admin) — not just auth.
      So this one dispatch clears all stale user data.
    */
    dispatch(logout());
    toast.success("Logged out successfully.");
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  /* ── Dashboard path by role ─────────────────────────────────── */
  const dashboardLink =
    {
      owner: "/owner/dashboard",
      seeker: "/seeker/dashboard",
      admin: "/admin/dashboard",
    }[user?.role] ?? "/";

  /* ── Messages link by role ──────────────────────────────────── */
  const hasMessaging =
    user?.role === "owner" || user?.role === "seeker" || user?.role === "admin";
  const messagesLink =
    user?.role === "owner"
      ? "/owner/messages"
      : user?.role === "seeker"
        ? "/seeker/messages"
        : "/admin/messages";
  const effectiveUnreadCount =
    isAuthenticated && hasMessaging ? unreadCount : 0;

  /* ── Unread badge sync ───────────────────────────────────── */
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !hasMessaging) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await chatService.getConversations();
      const convs =
        res.data?.conversations ||
        res.conversations ||
        (Array.isArray(res.data) ? res.data : []);

      const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch {
      // Silent fallback; badge can refresh on next successful event.
    }
  }, [hasMessaging, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !hasMessaging) return;

    const initialLoadTimer = window.setTimeout(() => {
      loadUnreadCount();
    }, 0);

    const onFocus = () => loadUnreadCount();
    window.addEventListener("focus", onFocus);

    const handleIncoming = () => loadUnreadCount();
    const handleRead = () => loadUnreadCount();

    on("new_message_notification", handleIncoming);
    on("new_message", handleIncoming);
    on("messages_read", handleRead);

    return () => {
      window.clearTimeout(initialLoadTimer);
      window.removeEventListener("focus", onFocus);
      off("new_message_notification", handleIncoming);
      off("new_message", handleIncoming);
      off("messages_read", handleRead);
    };
  }, [
    isAuthenticated,
    hasMessaging,
    loadUnreadCount,
    on,
    off,
    location.pathname,
  ]);

  /*
    Nav links are defined inside the component so the "Post a Room"
    link reacts to auth/role state. Guests go to /register, owners go to
    create listing, seekers get a tooltip ("become an owner first").
    Using useMemo-equivalent pattern with stable references.
  */
  const NAV_LINKS = [
    { to: "/listings", label: "Browse Rooms", icon: RiHome4Line },
    { to: "/about", label: "How it Works", icon: RiInformationLine },
    ...(isAuthenticated && user?.role === "owner"
      ? [
          {
            to: "/owner/listings/create",
            label: "Post a Room",
            icon: RiAddCircleLine,
          },
        ]
      : []), // guests and seekers don't see "Post a Room"
  ];

  /* ── NavLink active class helper ────────────────────────────── */
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "text-primary border-b-2 border-primary pb-0.5"
        : "text-text-secondary hover:text-primary"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-3 min-h-11 rounded-lg text-sm font-medium
     transition-colors duration-150 ${
       isActive
         ? "bg-primary text-white"
         : "text-text-secondary hover:text-primary hover:bg-background"
     }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-card" : "shadow-none border-b border-border"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center
                          group-hover:bg-secondary transition-colors duration-200"
          >
            <span className="text-white text-xs sm:text-sm font-bold">R</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-primary tracking-tight">
            Room<span className="text-secondary">Bridge</span>
          </span>
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* ── Desktop right actions ─────────────────────────────── */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Messages bell with unread badge */}
              {hasMessaging && (
                <Link
                  to={messagesLink}
                  className="relative p-2 rounded-lg text-text-secondary
                           hover:text-primary hover:bg-background transition-colors"
                  aria-label="Messages"
                >
                  <RiMessageLine className="text-xl" />
                  {effectiveUnreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4
                                   bg-error text-white text-[9px] font-bold
                                   rounded-full flex items-center justify-center"
                    >
                      {effectiveUnreadCount > 9 ? "9+" : effectiveUnreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Avatar + profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-2 border border-border rounded-lg
                             px-3 py-1.5 hover:border-primary hover:shadow-card
                             transition-all duration-200"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                  aria-label="User menu"
                >
                  {user.profilePhoto?.url ? (
                    <img
                      src={user.profilePhoto.url}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-primary max-w-24 truncate">
                    {user.name}
                  </span>
                  <RiArrowDownSLine
                    className={`text-text-secondary transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-card
                                  shadow-hover border border-border animate-scale-in z-50"
                    role="menu"
                  >
                    {/* User info header */}
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        {user.profilePhoto?.url ? (
                          <img
                            src={user.profilePhoto.url}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full bg-primary shrink-0
                                          flex items-center justify-center"
                          >
                            <span className="text-white text-sm font-bold">
                              {user.name?.[0]?.toUpperCase() ?? "U"}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className="inline-block mt-2 text-[10px] font-semibold uppercase
                                       tracking-wider text-white bg-secondary px-2 py-0.5 rounded-full"
                      >
                        {user.role}
                      </span>
                      {/* Socket connection indicator */}
                      {isConnected && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                          online
                        </span>
                      )}
                    </div>

                    <div className="p-1" role="none">
                      <Link
                        to={dashboardLink}
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm
                                   text-primary rounded-lg hover:bg-background transition-colors"
                      >
                        <RiDashboardLine className="text-base text-secondary" />{" "}
                        Dashboard
                      </Link>

                      {user.role === "seeker" && (
                        <Link
                          to="/seeker/profile"
                          onClick={() => setProfileOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm
                                     text-primary rounded-lg hover:bg-background transition-colors"
                        >
                          <RiUserLine className="text-base text-secondary" /> My
                          Profile
                        </Link>
                      )}

                      {hasMessaging && (
                        <Link
                          to={messagesLink}
                          onClick={() => setProfileOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm
                                   text-primary rounded-lg hover:bg-background transition-colors"
                        >
                          <RiMessageLine className="text-base text-secondary" />
                          <span>Messages</span>
                          {effectiveUnreadCount > 0 && (
                            <span
                              className="ml-auto bg-error text-white text-[10px]
                                           font-bold px-1.5 py-0.5 rounded-full"
                            >
                              {effectiveUnreadCount > 99
                                ? "99+"
                                : effectiveUnreadCount}
                            </span>
                          )}
                        </Link>
                      )}

                      <div className="border-t border-border my-1" />

                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm
                                   text-error rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <RiLogoutBoxLine className="text-base" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Guest buttons */
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-primary border border-primary
                           px-4 py-2 rounded-btn hover:bg-primary hover:text-white
                           transition-all duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-primary
                           px-4 py-2 rounded-btn hover:bg-secondary
                           transition-all duration-200 shadow-card hover:shadow-hover"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ─────────────────────────────────── */}
        <button
          className="md:hidden p-2.5 rounded-lg text-primary hover:bg-background transition-colors"
          onClick={() => setMenuOpen((m) => !m)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? (
            <RiCloseLine className="text-[1.7rem]" />
          ) : (
            <RiMenuLine className="text-[1.7rem]" />
          )}
        </button>
      </nav>

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      {/*
        was using conditional rendering with {menuOpen && <div>}.
        Changed to CSS visibility/opacity for smooth animation, but keeping
        the conditional render approach for simplicity since animate-slide-up
        handles the open animation. Added id for aria-controls reference.
      */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white border-t border-border shadow-card animate-slide-up"
        >
          <div className="px-3 py-2.5 flex flex-col gap-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {/* Nav links */}
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                {label}
              </NavLink>
            ))}

            <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
              {isAuthenticated && user ? (
                <>
                  {/* User info strip */}
                  <div className="flex items-center gap-2 px-3 py-2 mb-1">
                    {user.profilePhoto?.url ? (
                      <img
                        src={user.profilePhoto.url}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full bg-primary shrink-0
                                      flex items-center justify-center"
                      >
                        <span className="text-white text-xs font-bold">
                          {user.name?.[0]?.toUpperCase() ?? "U"}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-text-secondary capitalize">
                        {user.role}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={dashboardLink}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-3 min-h-11 text-sm font-medium
                               text-primary hover:bg-background rounded-lg transition-colors"
                  >
                    <RiDashboardLine /> Dashboard
                  </Link>

                  {hasMessaging && (
                    <Link
                      to={messagesLink}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 min-h-11 text-sm font-medium
                               text-primary hover:bg-background rounded-lg transition-colors"
                    >
                      <RiMessageLine />
                      <span>Messages</span>
                      {effectiveUnreadCount > 0 && (
                        <span
                          className="ml-auto bg-error text-white text-[10px]
                                       font-bold px-1.5 py-0.5 rounded-full"
                        >
                          {effectiveUnreadCount > 99
                            ? "99+"
                            : effectiveUnreadCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {user.role === "seeker" && (
                    <Link
                      to="/seeker/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 min-h-11 text-sm font-medium
                                 text-primary hover:bg-background rounded-lg transition-colors"
                    >
                      <RiUserLine /> My Profile
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-3 min-h-11 text-sm font-medium
                               text-error hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <RiLogoutBoxLine /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center py-3 min-h-11 text-sm font-semibold text-primary
                               border border-primary rounded-btn hover:bg-primary hover:text-white
                               transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center py-3 min-h-11 text-sm font-semibold text-white
                               bg-primary rounded-btn hover:bg-secondary transition-all duration-200"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
