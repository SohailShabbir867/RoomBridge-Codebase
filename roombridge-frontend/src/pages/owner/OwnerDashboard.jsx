import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  RiHome4Line,
  RiCalendarCheckLine,
  RiEyeLine,
  RiAddLine,
  RiCheckboxCircleLine,
  RiArrowRightLine,
  RiUserLine,
  RiLogoutBoxLine,
  RiDashboardLine,
  RiMessageLine,
  RiSettings3Line,
  RiMenuLine,
  RiCloseLine,
  RiFlagLine,
  RiTimeLine,
} from "react-icons/ri";
import listingService from "../../services/listingService";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import { logout } from "../../redux/slices/authSlice";
import toast from "react-hot-toast";
import Logo from "../../components/common/Logo";

document.title = "Owner Dashboard — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const ACC = "#FFAB69";
const BTN = "#8E4E14";
const CR  = "#F7F4EF";

/* ── Helpers ─────────────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const STATUS_COLOR = {
  active:   { bg: "#D1FAE5", text: "#065F46" },
  pending:  { bg: "#FEF3C7", text: "#92400E" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
  inactive: { bg: "#F3F4F6", text: "#6B7280" },
};

const BOOKING_COLOR = {
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  accepted:  { bg: "#D1FAE5", text: "#065F46" },
  rejected:  { bg: "#FEE2E2", text: "#991B1B" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280" },
};

/* ── Stat card ────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div
    className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border"
    style={{ borderColor: "#E8E2D9" }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: iconBg }}
    >
      <Icon style={{ color: iconColor }} className="text-lg" />
    </div>
    <div>
      <p className="text-2xl font-extrabold leading-none" style={{ color: DK }}>
        {value ?? "—"}
      </p>
      <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
    </div>
  </div>
);

/* ── Status pill ──────────────────────────────────────────────── */
const Pill = ({ status, map }) => {
  const c = map[status] || map.inactive || map.cancelled || { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
};

/* ── Owner Dashboard ──────────────────────────────────────────── */
const OwnerDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [lRes, bRes] = await Promise.all([
          listingService.getMyListings({ limit: 5 }),
          bookingService.getOwnerBookings({ limit: 5 }),
        ]);
        setListings(
          Array.isArray(lRes.listings) ? lRes.listings
          : Array.isArray(lRes.data)   ? lRes.data
          : [],
        );
        setBookings(
          Array.isArray(bRes.bookings) ? bRes.bookings
          : Array.isArray(bRes.data)   ? bRes.data
          : [],
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    dispatch(logout());
    toast.success("Logged out.");
    navigate("/login");
  };

  const totalViews = listings.reduce((s, l) => s + (l.views || 0), 0);
  const pendingBk  = bookings.filter((b) => b.status === "pending").length;
  const activeLst  = listings.filter((l) => l.status === "active").length;

  const NAV = [
    { to: "/owner/dashboard",        icon: RiDashboardLine,    label: "Dashboard" },
    { to: "/owner/listings",         icon: RiHome4Line,        label: "My Listings", end: true },
    { to: "/owner/listings/create",  icon: RiAddLine,          label: "Post Room" },
    { to: "/owner/bookings",         icon: RiCalendarCheckLine,label: "Booking Requests" },
    { to: "/owner/messages",         icon: RiMessageLine,      label: "Messages" },
    { to: "/owner/reports",          icon: RiFlagLine,         label: "My Reports" },
    { to: "/owner/profile",          icon: RiSettings3Line,    label: "My Profile" },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: CR }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col shadow-xl
                    transition-transform duration-300
                    ${sideOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: DK }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/10">
          <Logo isDarkBg={true} onClick={() => setSideOpen(false)} />
          <button
            onClick={() => setSideOpen(false)}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm"
              style={{ backgroundColor: `${ACC}25`, color: ACC }}
            >
              {user?.profilePhoto?.url ? (
                <img src={user.profilePhoto.url} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">{user?.name}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: `${ACC}90` }}>Property Owner</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => { if (window.innerWidth < 1024) setSideOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: `${ACC}20`, color: ACC }
                  : { color: "rgba(255,255,255,0.55)" }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="text-base shrink-0" style={isActive ? { color: ACC } : {}} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium
                       text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <RiLogoutBoxLine className="text-base" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      {/* Toggle when closed */}
      {!sideOpen && (
        <button
          onClick={() => setSideOpen(true)}
          aria-label="Open sidebar"
          className="fixed top-4 left-3 z-50 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg text-white"
          style={{ backgroundColor: DK }}
        >
          <RiMenuLine className="text-lg" />
        </button>
      )}

      {/* ── Main ────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ${
          sideOpen ? "lg:ml-60" : "lg:ml-0"
        }`}
      >
        {/* Top bar */}
        <header
          className={`sticky top-0 z-20 bg-white border-b border-[#E8E2D9] py-3 flex items-center justify-between gap-3 ${
            sideOpen ? "px-4 sm:px-6" : "pl-14 pr-4 sm:pr-6"
          }`}
        >
          <div>
            <p className="text-[11px] text-gray-400 font-medium">
              {new Date().toLocaleDateString("en-PK", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link
            to="/owner/listings/create"
            className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl
                       hover:opacity-90 active:scale-95 transition-all shadow-sm"
            style={{ backgroundColor: BTN }}
          >
            <RiAddLine className="text-sm" /> Post Room
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: DK, borderTopColor: "transparent" }} />
            </div>
          ) : (
            <div className="max-w-[1200px] mx-auto">

              {/* Greeting */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: DK }}>
                  {getGreeting()}, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Here's what's happening with your listings today.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <StatCard icon={RiHome4Line}         label="Total Listings"   value={listings.length} iconBg="#E8F5E9" iconColor="#2E7D32" />
                <StatCard icon={RiCheckboxCircleLine} label="Active Listings"  value={activeLst}       iconBg={`${ACC}20`} iconColor={BTN} />
                <StatCard icon={RiCalendarCheckLine}  label="Pending Requests" value={pendingBk}       iconBg="#FEF3C7" iconColor="#92400E" />
                <StatCard icon={RiEyeLine}            label="Total Views"      value={totalViews}      iconBg="#EDE9FE" iconColor="#7C3AED" />
              </div>

              {/* Two-column */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">

                {/* My Listings */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E8E2D9" }}>
                    <h2 className="font-bold text-sm" style={{ color: DK }}>My Listings</h2>
                    <Link
                      to="/owner/listings"
                      className="text-[11px] font-bold flex items-center gap-1 hover:opacity-75 transition-opacity"
                      style={{ color: BTN }}
                    >
                      View all <RiArrowRightLine />
                    </Link>
                  </div>

                  {listings.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <RiHome4Line className="text-4xl mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-400">No listings yet.</p>
                      <Link
                        to="/owner/listings/create"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-4 py-2 rounded-xl text-white"
                        style={{ backgroundColor: BTN }}
                      >
                        <RiAddLine /> Post First Room
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "#F3EFE9" }}>
                      {listings.slice(0, 5).map((l) => (
                        <div key={l._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F4EF] transition-colors">
                          {/* Thumbnail */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            {l.photos?.[0]?.url ? (
                              <img src={l.photos[0].url} alt={l.title} className="w-10 h-10 object-cover" />
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center">
                                <RiHome4Line className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: DK }}>{l.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {l.city} · PKR {(l.rent || 0).toLocaleString()}/mo
                            </p>
                          </div>
                          <Pill status={l.status || "inactive"} map={STATUS_COLOR} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Booking Requests */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E8E2D9" }}>
                    <h2 className="font-bold text-sm" style={{ color: DK }}>Booking Requests</h2>
                    <Link
                      to="/owner/bookings"
                      className="text-[11px] font-bold flex items-center gap-1 hover:opacity-75 transition-opacity"
                      style={{ color: BTN }}
                    >
                      View all <RiArrowRightLine />
                    </Link>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <RiCalendarCheckLine className="text-4xl mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-400">No booking requests yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "#F3EFE9" }}>
                      {bookings.slice(0, 5).map((b) => (
                        <div key={b._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F4EF] transition-colors">
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm"
                            style={{ backgroundColor: `${DK}15`, color: DK }}
                          >
                            {b.seeker?.profilePhoto?.url ? (
                              <img src={b.seeker.profilePhoto.url} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              (b.seeker?.name?.[0] || "?").toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: DK }}>
                              {b.seeker?.name || "Seeker"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {b.listing?.title || "Listing"}
                            </p>
                          </div>
                          <Pill status={b.status} map={BOOKING_COLOR} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
