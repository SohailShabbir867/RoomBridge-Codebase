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
  RiMessageLine,
  RiHome4Line,
  RiCompassLine,
  RiQuestionLine,
  RiGroupLine,
  RiInformationLine,
  RiMailLine,
  RiAddCircleLine,
} from "react-icons/ri";
import Logo from "./Logo";
import toast from "react-hot-toast";
import authService from "../../services/authService";
import chatService from "../../services/chatService";
import { useSocket } from "../../context/SocketContext";

const DARK_GREEN = "#012D1D";
const BTN_BROWN  = "#8E4E14";
const NAV_BG     = "#F5F0E6";

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

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* Close mobile menu on resize */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* Logout */
  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    setMenuOpen(false);
    try { await authService.logout(); } catch { /* ignore */ }
    dispatch(logout());
    toast.success("Logged out successfully.");
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  /* Dashboard / messages paths by role */
  const dashboardLink =
    { owner: "/owner/dashboard", seeker: "/seeker/dashboard", admin: "/admin/dashboard" }[user?.role] ?? "/";
  const hasMessaging  = ["owner", "seeker", "admin"].includes(user?.role);
  const messagesLink  =
    user?.role === "owner"  ? "/owner/messages"
    : user?.role === "seeker" ? "/seeker/messages"
    : "/admin/messages";
  const effectiveUnreadCount = isAuthenticated && hasMessaging ? unreadCount : 0;

  /* Unread badge sync */
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

  /* Nav links with icons */
  const NAV_LINKS = [
    { to: "/",             label: "Home",         exact: true,  icon: RiHome4Line },
    { to: "/explore",      label: "Explore",      exact: false, icon: RiCompassLine },
    { to: "/how-it-works", label: "How It Works", exact: false, icon: RiQuestionLine },
    isAuthenticated && { to: "/community",  label: "Community",  exact: false, icon: RiGroupLine },
    isAuthenticated && { to: dashboardLink, label: "Dashboard",  exact: false, icon: RiDashboardLine },
    { to: "/about",        label: "About Us",     exact: false, icon: RiInformationLine },
    { to: "/contact",      label: "Contact Us",   exact: false, icon: RiMailLine },
  ].filter(Boolean);

  /* Desktop NavLink helper */
  const linkCls = ({ isActive }) =>
    [
      "text-sm font-medium transition-colors duration-200 whitespace-nowrap pb-0.5",
      isActive ? "text-gray-900 border-b-2" : "text-gray-700 hover:text-gray-900",
    ].join(" ");
  const linkStyle = ({ isActive }) => (isActive ? { borderColor: BTN_BROWN } : {});

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
        {/* Logo */}
        <Logo onClick={() => setMenuOpen(false)} className="shrink-0" />

        {/* Desktop centre nav links */}
        <div className="hidden lg:flex items-center justify-center flex-1 gap-5 xl:gap-7 mx-4">
          {NAV_LINKS.map(({ to, label, exact }) => (
            <NavLink
              key={to + label}
              to={to}
              end={exact}
              className={linkCls}
              style={linkStyle}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Desktop right actions */}
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

              {/* Avatar + dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                  aria-label="User menu"
                >
                  {user.profilePhoto?.url ? (
                    <img src={user.profilePhoto.url} alt={user.name}
                      className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: DARK_GREEN }}>
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
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {user.profilePhoto?.url ? (
                          <img src={user.profilePhoto.url} alt={user.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: DARK_GREEN }}>
                            <span className="text-white text-sm font-bold">
                              {user.name?.[0]?.toUpperCase() ?? "U"}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: DARK_GREEN }}>
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: BTN_BROWN }}>
                          {user.role}
                        </span>
                        {isConnected && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> online
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5" role="none">
                      <Link to={dashboardLink} onClick={() => setProfileOpen(false)} role="menuitem"
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-xl hover:bg-gray-50 transition-colors"
                        style={{ color: DARK_GREEN }}>
                        <RiDashboardLine style={{ color: BTN_BROWN }} /> Dashboard
                      </Link>

                      {user.role === "seeker" && (
                        <Link to="/seeker/profile" onClick={() => setProfileOpen(false)} role="menuitem"
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-xl hover:bg-gray-50 transition-colors"
                          style={{ color: DARK_GREEN }}>
                          <RiUserLine style={{ color: BTN_BROWN }} /> My Profile
                        </Link>
                      )}

                      {hasMessaging && (
                        <Link to={messagesLink} onClick={() => setProfileOpen(false)} role="menuitem"
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-xl hover:bg-gray-50 transition-colors"
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
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                        <RiLogoutBoxLine /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {user.role === "owner" && (
                <Link to="/owner/listings/create"
                  className="text-sm font-semibold text-white px-5 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 whitespace-nowrap"
                  style={{ backgroundColor: DARK_GREEN }}>
                  List Your Hostel!
                </Link>
              )}
            </>
          ) : (
            <Link to="/login"
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 whitespace-nowrap"
              style={{ backgroundColor: BTN_BROWN }}>
              Login
            </Link>
          )}
        </div>

        {/* Mobile right: unread badge + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          {isAuthenticated && hasMessaging && effectiveUnreadCount > 0 && (
            <Link to={messagesLink}
              className="relative p-1.5"
              style={{ color: DARK_GREEN }}
              aria-label="Messages"
            >
              <RiMessageLine className="text-xl" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#ef4444" }}>
                {effectiveUnreadCount > 9 ? "9+" : effectiveUnreadCount}
              </span>
            </Link>
          )}
          <button
            className="p-2 rounded-xl transition-colors active:scale-95"
            style={{ color: DARK_GREEN }}
            onClick={() => setMenuOpen((m) => !m)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen
              ? <RiCloseLine  className="text-2xl" />
              : <RiMenuLine   className="text-2xl" />
            }
          </button>
        </div>
      </nav>

      {/* ── Mobile full-screen slide-over ─────────────────────────────────── */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden fixed inset-0 top-[56px] sm:top-[60px] z-50 flex flex-col"
          style={{ animation: "slideDown 0.25s ease" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative flex flex-col overflow-y-auto"
            style={{ backgroundColor: NAV_BG, maxHeight: "calc(100dvh - 56px)" }}
          >
            {/* Authenticated user profile strip */}
            {isAuthenticated && user && (
              <div
                className="px-5 py-4 border-b flex items-center gap-4"
                style={{ backgroundColor: DARK_GREEN, borderColor: "rgba(255,255,255,0.1)" }}
              >
                {user.profilePhoto?.url ? (
                  <img src={user.profilePhoto.url} alt={user.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center border-2 border-white/20"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                    <span className="text-white text-lg font-bold">
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{user.name}</p>
                  <p className="text-white/50 text-xs truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-white px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: BTN_BROWN }}>
                      {user.role}
                    </span>
                    {isConnected && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> online
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="px-3 pt-3 pb-2">
              {NAV_LINKS.map(({ to, label, exact, icon: Icon }) => (
                <NavLink
                  key={to + label}
                  to={to}
                  end={exact}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold mb-1 transition-all active:scale-[0.98] ${
                      isActive ? "text-white" : "hover:bg-black/5"
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? DARK_GREEN : undefined,
                    color: isActive ? "#FFF" : DARK_GREEN,
                  })}
                >
                  {Icon && <Icon className="text-lg shrink-0" />}
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Authenticated quick-actions */}
            {isAuthenticated && user && (
              <div className="px-3 pb-4 border-t pt-2" style={{ borderColor: `${DARK_GREEN}15` }}>
                {hasMessaging && (
                  <Link to={messagesLink} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold mb-1 transition-all hover:bg-black/5 active:scale-[0.98]"
                    style={{ color: DARK_GREEN }}>
                    <RiMessageLine className="text-lg" />
                    Messages
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
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold mb-1 transition-all hover:bg-black/5 active:scale-[0.98]"
                    style={{ color: DARK_GREEN }}>
                    <RiUserLine className="text-lg" /> My Profile
                  </Link>
                )}

                {user.role === "owner" && (
                  <Link to="/owner/listings/create" onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold text-white mb-2 mt-2 transition-all active:scale-[0.98]"
                    style={{ backgroundColor: DARK_GREEN }}>
                    <RiAddCircleLine className="text-lg" /> List Your Hostel
                  </Link>
                )}

                <button onClick={handleLogout}
                  className="flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-semibold text-red-500 rounded-2xl hover:bg-red-50 transition-all active:scale-[0.98]">
                  <RiLogoutBoxLine className="text-lg" /> Sign Out
                </button>
              </div>
            )}

            {/* Guest CTAs */}
            {!isAuthenticated && (
              <div className="px-5 pb-8 pt-3">
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center py-4 rounded-2xl text-sm font-bold text-white w-full transition-all active:scale-[0.98]"
                  style={{ backgroundColor: BTN_BROWN }}>
                  Login to RoomBridge
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center py-4 rounded-2xl text-sm font-bold w-full mt-2 border-2 transition-all active:scale-[0.98]"
                  style={{ borderColor: DARK_GREEN, color: DARK_GREEN }}>
                  Create an Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
