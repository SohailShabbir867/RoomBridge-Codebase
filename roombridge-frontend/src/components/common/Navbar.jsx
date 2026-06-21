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
  RiSearchLine,
  RiMessageLine,
} from "react-icons/ri";
import Logo from "./Logo";
import toast from "react-hot-toast";
import authService from "../../services/authService";
import chatService from "../../services/chatService";
import { useSocket } from "../../context/SocketContext";

/* ─── Figma design tokens ──────────────────────────────────── */
const DARK_GREEN  = "#012D1D";   /* logo, text, CTA button bg    */
const BTN_BROWN   = "#8E4E14";   /* active-link underline accent  */
const NAV_BG      = "#F5F0E6";   /* navbar background (cream)     */

const Navbar = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { isConnected, on, off }  = useSocket();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
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

  /* ── Close mobile menu on resize ───────────────────────────── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Lock body scroll when mobile menu open ─────────────────── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* ── Logout ─────────────────────────────────────────────────── */
  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    setMenuOpen(false);
    try { await authService.logout(); } catch { /* ignore */ }
    dispatch(logout());
    toast.success("Logged out successfully.");
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  /* ── Dashboard / messages paths by role ─────────────────────── */
  const dashboardLink =
    { owner: "/owner/dashboard", seeker: "/seeker/dashboard", admin: "/admin/dashboard" }[user?.role] ?? "/";
  const hasMessaging  = ["owner", "seeker", "admin"].includes(user?.role);
  const messagesLink  =
    user?.role === "owner" ? "/owner/messages"
    : user?.role === "seeker" ? "/seeker/messages"
    : "/admin/messages";
  const effectiveUnreadCount = isAuthenticated && hasMessaging ? unreadCount : 0;

  /* ── Unread badge sync ───────────────────────────────────────── */
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !hasMessaging) { setUnreadCount(0); return; }
    try {
      const res   = await chatService.getConversations();
      const convs =
        res.data?.conversations ||
        res.conversations ||
        (Array.isArray(res.data) ? res.data : []);
      setUnreadCount(convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
    } catch { /* silent */ }
  }, [hasMessaging, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !hasMessaging) return;
    const t = window.setTimeout(() => loadUnreadCount(), 0);
    const onFocus = () => loadUnreadCount();
    window.addEventListener("focus", onFocus);
    on("new_message_notification", loadUnreadCount);
    on("new_message", loadUnreadCount);
    on("messages_read", loadUnreadCount);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("focus", onFocus);
      off("new_message_notification", loadUnreadCount);
      off("new_message", loadUnreadCount);
      off("messages_read", loadUnreadCount);
    };
  }, [isAuthenticated, hasMessaging, loadUnreadCount, on, off, location.pathname]);

  /* ── Nav links ──────────────────────────────────────────────── */
  const NAV_LINKS = [
    { to: "/",           label: "Home",         exact: true  },
    { to: "/explore",    label: "Explore",      exact: false },
    { to: "/how-it-works", label: "How It Works", exact: false },
    isAuthenticated && { to: "/community",  label: "Community",    exact: false },
    isAuthenticated && { to: dashboardLink, label: "Dashboard",    exact: false },
    { to: "/about",      label: "About Us",     exact: false },
    { to: "/contact",    label: "Contact Us",   exact: false },
  ].filter(Boolean);

  /* ── NavLink class helper ───────────────────────────────────── */
  const linkCls = ({ isActive }) =>
    [
      "text-sm font-medium transition-colors duration-200 whitespace-nowrap pb-0.5",
      isActive
        ? "text-gray-900 border-b-2"
        : "text-gray-700 hover:text-gray-900",
    ].join(" ");

  /* Inline style for the active underline colour */
  const linkStyle = ({ isActive }) =>
    isActive ? { borderColor: BTN_BROWN } : {};

  const mobileLinkCls = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-150 ${
      isActive
        ? "text-gray-900 bg-black/5"
        : "text-gray-700 hover:text-gray-900 hover:bg-black/5"
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
      style={{ backgroundColor: NAV_BG }}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-[60px]
                   flex items-center justify-between gap-6 relative"
      >
        {/* ── Logo ─────────────────────────────────────────────── */}
        <Logo onClick={() => setMenuOpen(false)} className="shrink-0" />

        {/* ── Desktop centre nav links ─────────────────────────── */}
        <div className="hidden lg:flex items-center justify-center flex-1 gap-5 xl:gap-7 mx-4">
          {NAV_LINKS.map(({ to, label, exact, key }) => (
            <NavLink
              key={key || to + label}
              to={to}
              end={exact}
              className={linkCls}
              style={linkStyle}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* ── Desktop right actions ─────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {isAuthenticated && user ? (
            <>
              {/* Unread messages badge */}
              {hasMessaging && (
                <Link
                  to={messagesLink}
                  className="relative p-1 transition-colors"
                  style={{ color: `${DARK_GREEN}99` }}
                  aria-label="Messages"
                >
                  <RiMessageLine className="text-[1.1rem]" />
                  {effectiveUnreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 text-white
                                 text-[9px] font-bold rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#ef4444" }}
                    >
                      {effectiveUnreadCount > 9 ? "9+" : effectiveUnreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Avatar + dropdown ─────────────────────────────── */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                  aria-label="User menu"
                >
                  {user.profilePhoto?.url ? (
                    <img
                      src={user.profilePhoto.url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: DARK_GREEN }}
                    >
                      <span className="text-white text-xs font-bold">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                      </span>
                    </div>
                  )}
                  <RiArrowDownSLine
                    className={`text-sm transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                    style={{ color: DARK_GREEN }}
                  />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl
                               shadow-2xl border border-gray-100 overflow-hidden z-50"
                    role="menu"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {user.profilePhoto?.url ? (
                          <img src={user.profilePhoto.url} alt={user.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: DARK_GREEN }}
                          >
                            <span className="text-white text-sm font-bold">
                              {user.name?.[0]?.toUpperCase() ?? "U"}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate"
                             style={{ color: DARK_GREEN }}>{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide
                                     text-white px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: BTN_BROWN }}
                        >
                          {user.role}
                        </span>
                        {isConnected && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            online
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5" role="none">
                      <Link to={dashboardLink} onClick={() => setProfileOpen(false)} role="menuitem"
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm
                                   rounded-xl hover:bg-gray-50 transition-colors"
                        style={{ color: DARK_GREEN }}>
                        <RiDashboardLine style={{ color: BTN_BROWN }} /> Dashboard
                      </Link>

                      {user.role === "seeker" && (
                        <Link to="/seeker/profile" onClick={() => setProfileOpen(false)} role="menuitem"
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm
                                     rounded-xl hover:bg-gray-50 transition-colors"
                          style={{ color: DARK_GREEN }}>
                          <RiUserLine style={{ color: BTN_BROWN }} /> My Profile
                        </Link>
                      )}

                      {hasMessaging && (
                        <Link to={messagesLink} onClick={() => setProfileOpen(false)} role="menuitem"
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm
                                     rounded-xl hover:bg-gray-50 transition-colors"
                          style={{ color: DARK_GREEN }}>
                          <RiMessageLine style={{ color: BTN_BROWN }} />
                          <span>Messages</span>
                          {effectiveUnreadCount > 0 && (
                            <span className="ml-auto text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: "#ef4444" }}>
                              {effectiveUnreadCount > 99 ? "99+" : effectiveUnreadCount}
                            </span>
                          )}
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1" />

                      <button onClick={handleLogout} role="menuitem"
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm
                                   text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                        <RiLogoutBoxLine /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* List Your Hostel CTA — owners only */}
              {user.role === "owner" && (
                <Link
                  to="/owner/listings/create"
                  className="text-sm font-semibold text-white px-5 py-2.5 rounded-full
                             hover:opacity-90 active:scale-95 transition-all duration-200 whitespace-nowrap"
                  style={{ backgroundColor: DARK_GREEN }}
                >
                  List Your Hostel!
                </Link>
              )}
            </>
          ) : (
            /* ── Guest: Login button only ── */
            <>
              {/* Login button — only shown to guests */}
              <Link
                to="/login"
                className="text-sm font-semibold text-white px-5 py-2.5 rounded-full
                           hover:opacity-90 active:scale-95
                           transition-all duration-200 whitespace-nowrap"
                style={{ backgroundColor: BTN_BROWN }}
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ──────────────────────────────────── */}
        <button
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: DARK_GREEN }}
          onClick={() => setMenuOpen((m) => !m)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen
            ? <RiCloseLine className="text-2xl" />
            : <RiMenuLine  className="text-2xl" />
          }
        </button>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t"
          style={{ backgroundColor: NAV_BG, borderColor: `${DARK_GREEN}15` }}
        >
          <div className="px-4 py-3 flex flex-col gap-0.5 max-h-[calc(100vh-4rem)] overflow-y-auto">

            {NAV_LINKS.map(({ to, label, exact, key }) => (
              <NavLink
                key={key || to + label}
                to={to}
                end={exact}
                onClick={() => setMenuOpen(false)}
                className={mobileLinkCls}
              >
                {label}
              </NavLink>
            ))}

            <div
              className="border-t mt-3 pt-3 flex flex-col gap-2"
              style={{ borderColor: `${DARK_GREEN}15` }}
            >
              {isAuthenticated && user ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    {user.profilePhoto?.url ? (
                      <img src={user.profilePhoto.url} alt={user.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: DARK_GREEN }}
                      >
                        <span className="text-white text-sm font-bold">
                          {user.name?.[0]?.toUpperCase() ?? "U"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: DARK_GREEN }}>{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>

                  <Link to={dashboardLink} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl
                               transition-colors hover:bg-black/5"
                    style={{ color: DARK_GREEN }}>
                    <RiDashboardLine /> Dashboard
                  </Link>

                  {hasMessaging && (
                    <Link to={messagesLink} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl
                                 transition-colors hover:bg-black/5"
                      style={{ color: DARK_GREEN }}>
                      <RiMessageLine />
                      <span>Messages</span>
                      {effectiveUnreadCount > 0 && (
                        <span className="ml-auto text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: "#ef4444" }}>
                          {effectiveUnreadCount > 99 ? "99+" : effectiveUnreadCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {user.role === "seeker" && (
                    <Link to="/seeker/profile" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl
                                 transition-colors hover:bg-black/5"
                      style={{ color: DARK_GREEN }}>
                      <RiUserLine /> My Profile
                    </Link>
                  )}

                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl
                               transition-colors hover:bg-red-50 text-red-500 text-left">
                    <RiLogoutBoxLine /> Sign Out
                  </button>

                  {/* List Your Hostel CTA — owners only */}
                  {user.role === "owner" && (
                    <Link to="/owner/listings/create" onClick={() => setMenuOpen(false)}
                      className="block text-center py-3 text-sm font-semibold text-white
                                 rounded-full transition-all duration-200"
                      style={{ backgroundColor: DARK_GREEN }}>
                      List Your Hostel!
                    </Link>
                  )}
                </>
              ) : (
                /* ── Mobile guest: Login button only ── */
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center py-3 text-sm font-semibold text-white
                             rounded-xl transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: BTN_BROWN }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
