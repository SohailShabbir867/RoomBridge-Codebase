import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  RiDashboardLine,
  RiHeart3Line,
  RiCalendarCheckLine,
  RiGroupLine,
  RiMessageLine,
  RiUserLine,
  RiLogoutBoxLine,
  RiHome4Line,
  RiArrowRightLine,
  RiLoader4Line,
  RiSearchLine,
  RiMenuLine,
  RiCloseLine,
  RiFlagLine,
} from "react-icons/ri";
import bookingService from "../../services/bookingService";
import listingService from "../../services/listingService";
import authService from "../../services/authService";
import { logout } from "../../redux/slices/authSlice";
import toast from "react-hot-toast";

document.title = "Seeker Dashboard — RoomBridge";

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link
    to={to || "#"}
    className="bg-white rounded-card border border-border p-2 sm:p-3 flex items-start gap-2 sm:gap-3
                   shadow-card hover:shadow-hover transition-all group"
  >
    <div
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}
    >
      <Icon className="text-white text-sm sm:text-base" />
    </div>
    <div className="min-w-0">
      <p className="text-xl sm:text-2xl font-bold text-primary leading-none">
        {value ?? "—"}
      </p>
      <p className="text-xs sm:text-sm text-text-secondary group-hover:text-primary transition-colors mt-1 leading-snug">
        {label}
      </p>
    </div>
  </Link>
);

const BOOKING_BADGE = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
  cancelled: "bg-border text-text-secondary",
};

const SeekerDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    Promise.all([
      bookingService.getMyBookings({ limit: 5 }),
      listingService.getSavedListings({ limit: 4 }),
    ])
      .then(([bRes, sRes]) => {
        /*
        Backend returns:
        - getMyBookings: { success, bookings, pagination }
        - getSavedListings: { success, listings, pagination }
        Old code: bRes.data and sRes.data → both undefined → empty arrays → zero stats.
      */
        setBookings(
          Array.isArray(bRes.bookings)
            ? bRes.bookings
            : Array.isArray(bRes.data)
              ? bRes.data
              : [],
        );
        setSaved(
          Array.isArray(sRes.listings)
            ? sRes.listings
            : Array.isArray(sRes.data)
              ? sRes.data
              : [],
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const pending = bookings.filter((b) => b.status === "pending").length;
  const accepted = bookings.filter((b) => b.status === "accepted").length;

  const NAV = [
    { to: "/seeker/dashboard", icon: RiDashboardLine, label: "Dashboard" },
    { to: "/listings", icon: RiSearchLine, label: "Browse Rooms" },
    { to: "/seeker/saved", icon: RiHeart3Line, label: "Saved Rooms" },
    { to: "/seeker/requests", icon: RiCalendarCheckLine, label: "My Requests" },
    {
      to: "/seeker/roommate-match",
      icon: RiGroupLine,
      label: "Roommate Match",
    },
    { to: "/seeker/messages", icon: RiMessageLine, label: "Messages" },
    { to: "/seeker/reports", icon: RiFlagLine, label: "My Reports" },
    { to: "/seeker/profile", icon: RiUserLine, label: "My Profile" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary flex flex-col shadow-2xl
                         transition-transform duration-300
                         ${sideOpen ? "translate-x-0" : "-translate-x-full"}`}
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
              <p className="text-white/50 text-xs">Room Seeker</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
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
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium
                             text-white/70 hover:text-error hover:bg-red-500/10 transition-all duration-150"
          >
            <RiLogoutBoxLine /> Logout
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
                Seeker Dashboard
              </h1>
              <p className="text-text-secondary text-xs truncate">
                Hello, {user?.name?.split(" ")[0]} 👋
              </p>
            </div>
          </div>
          <Link
            to="/listings"
            className="flex items-center gap-1.5 sm:gap-2 bg-secondary text-white text-sm font-semibold
                           px-3 sm:px-4 py-2.5 sm:py-2 rounded-btn hover:bg-primary transition-colors shadow-card shrink-0"
          >
            <RiSearchLine className="text-base" />{" "}
            <span className="hidden sm:inline">Browse Rooms</span>
            <span className="sm:hidden">Browse</span>
          </Link>
        </header>

        <main className="flex-1 p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RiLoader4Line className="animate-spin text-4xl text-primary" />
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5 sm:mb-7">
                <StatCard
                  icon={RiCalendarCheckLine}
                  label="Total Requests"
                  value={bookings.length}
                  color="bg-primary"
                  to="/seeker/requests"
                />
                <StatCard
                  icon={RiHome4Line}
                  label="Pending"
                  value={pending}
                  color="bg-warning"
                  to="/seeker/requests"
                />
                <StatCard
                  icon={RiHeart3Line}
                  label="Accepted Bookings"
                  value={accepted}
                  color="bg-success"
                  to="/seeker/requests"
                />
                <StatCard
                  icon={RiGroupLine}
                  label="Saved Rooms"
                  value={saved.length}
                  color="bg-secondary"
                  to="/seeker/saved"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5">
                {/* Booking Requests */}
                <div className="bg-white rounded-card border border-border shadow-card">
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                    <h2 className="font-semibold text-primary text-base sm:text-lg">
                      My Booking Requests
                    </h2>
                    <Link
                      to="/seeker/requests"
                      className="text-xs sm:text-sm text-secondary hover:text-primary flex items-center gap-1 shrink-0"
                    >
                      View all <RiArrowRightLine />
                    </Link>
                  </div>
                  <div className="divide-y divide-border">
                    {bookings.length === 0 ? (
                      <div className="p-5 sm:p-6 text-center text-sm text-text-secondary">
                        No requests yet.{" "}
                        <Link
                          to="/listings"
                          className="text-secondary font-medium"
                        >
                          Browse rooms →
                        </Link>
                      </div>
                    ) : (
                      bookings.slice(0, 5).map((b) => (
                        <div
                          key={b._id}
                          className="flex items-center gap-3 p-3.5 sm:p-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">
                              {b.listing?.title || "Listing"}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {b.listing?.city} ·{" "}
                              {new Date(b.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize
                                          ${BOOKING_BADGE[b.status] || ""}`}
                          >
                            {b.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Saved Rooms */}
                <div className="bg-white rounded-card border border-border shadow-card">
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                    <h2 className="font-semibold text-primary text-base sm:text-lg">
                      Saved Rooms
                    </h2>
                    <Link
                      to="/seeker/saved"
                      className="text-xs sm:text-sm text-secondary hover:text-primary flex items-center gap-1 shrink-0"
                    >
                      View all <RiArrowRightLine />
                    </Link>
                  </div>
                  <div className="divide-y divide-border">
                    {saved.length === 0 ? (
                      <div className="p-5 sm:p-6 text-center text-sm text-text-secondary">
                        No saved rooms yet.{" "}
                        <Link
                          to="/listings"
                          className="text-secondary font-medium"
                        >
                          Find rooms →
                        </Link>
                      </div>
                    ) : (
                      saved.slice(0, 4).map((l) => (
                        <Link
                          key={l._id}
                          to={`/listings/${l._id}`}
                          className="flex items-center gap-3 p-3.5 sm:p-4 hover:bg-background transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0 overflow-hidden">
                            {l.photos?.[0]?.url ? (
                              <img
                                src={l.photos[0].url}
                                alt={l.title}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <RiHome4Line className="text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">
                              {l.title}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {l.city} · PKR {(l.rent || 0).toLocaleString()}/mo
                            </p>
                          </div>
                          <RiArrowRightLine className="text-text-secondary text-sm shrink-0" />
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SeekerDashboard;
