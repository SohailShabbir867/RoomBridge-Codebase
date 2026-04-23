import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  RiHome4Line,
  RiCalendarCheckLine,
  RiEyeLine,
  RiAddLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiArrowRightLine,
  RiUserLine,
  RiLogoutBoxLine,
  RiDashboardLine,
  RiMessageLine,
  RiSettings3Line,
  RiMenuLine,
  RiFlagLine,
} from "react-icons/ri";
import listingService from "../../services/listingService";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import { logout } from "../../redux/slices/authSlice";
import toast from "react-hot-toast";

document.title = "Owner Dashboard — RoomBridge";

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-card border border-border p-2 sm:p-3 flex items-start gap-2 sm:gap-3 shadow-card hover:shadow-hover transition-shadow">
    <div
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}
    >
      <Icon className="text-white text-sm sm:text-base" />
    </div>
    <div>
      <p className="text-xl sm:text-2xl font-bold text-primary leading-none">{value ?? "—"}</p>
      <p className="text-xs sm:text-sm text-text-secondary mt-1">{label}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  </div>
);

const STATUS_BADGE = {
  pending: "bg-warning/10 text-warning border-warning/20",
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-border text-text-secondary border-border",
  rejected: "bg-error/10 text-error border-error/20",
};

const BOOKING_BADGE = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
  cancelled: "bg-border text-text-secondary",
};

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
        /*
          Backend returns { success, listings, pagination } for
          getMyListings and { success, bookings, pagination } for getOwnerBookings.
          The old code read res.data which is undefined on both.
        */
        setListings(
          Array.isArray(lRes.listings)
            ? lRes.listings
            : Array.isArray(lRes.data)
              ? lRes.data
              : [],
        );
        setBookings(
          Array.isArray(bRes.bookings)
            ? bRes.bookings
            : Array.isArray(bRes.data)
              ? bRes.data
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
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors and clear client state anyway.
    }
    dispatch(logout());
    toast.success("Logged out.");
    navigate("/login");
  };

  const totalViews = listings.reduce((s, l) => s + (l.views || 0), 0);
  const pendingBk = bookings.filter((b) => b.status === "pending").length;
  const activeLst = listings.filter((l) => l.status === "active").length;

  const NAV = [
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
    { to: "/owner/profile", icon: RiSettings3Line, label: "My Profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary flex flex-col shadow-2xl
                         transition-transform duration-300
                         ${sideOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-primary text-sm font-bold">R</span>
            </div>
            <span className="text-white font-bold text-lg">
              Room<span className="text-accent">Bridge</span>
            </span>
          </Link>
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
              <p className="text-white/50 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
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
            <RiLogoutBoxLine className="text-base" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* Main */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ${
          sideOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSideOpen((s) => !s)}
              aria-label="Toggle sidebar"
              className="p-2 rounded-lg text-text-secondary hover:bg-background transition-colors"
            >
              <RiMenuLine className="text-xl" />
            </button>
            <div>
              <h1 className="font-bold text-primary text-base sm:text-lg">
                Owner Dashboard
              </h1>
              <p className="text-text-secondary text-xs">
                Welcome back, {user?.name?.split(" ")[0]}!
              </p>
            </div>
          </div>
          <Link
            to="/owner/listings/create"
            className="flex items-center gap-2 bg-primary text-white text-sm font-semibold
                           px-3 sm:px-4 py-2 rounded-btn hover:bg-secondary transition-colors shadow-card"
          >
            <RiAddLine /> Post Room
          </Link>
        </header>

        <main className="flex-1 p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5 sm:mb-7">
                <StatCard
                  icon={RiHome4Line}
                  label="Total Listings"
                  value={listings.length}
                  color="bg-primary"
                />
                <StatCard
                  icon={RiCheckboxCircleLine}
                  label="Active Listings"
                  value={activeLst}
                  color="bg-success"
                />
                <StatCard
                  icon={RiCalendarCheckLine}
                  label="Pending Requests"
                  value={pendingBk}
                  color="bg-warning"
                />
                <StatCard
                  icon={RiEyeLine}
                  label="Total Views"
                  value={totalViews}
                  color="bg-secondary"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5">
                {/* Recent Listings */}
                <div className="bg-white rounded-card border border-border shadow-card">
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                    <h2 className="font-semibold text-primary text-base sm:text-lg">My Listings</h2>
                    <Link
                      to="/owner/listings"
                      className="text-xs text-secondary hover:text-primary flex items-center gap-1"
                    >
                      View all <RiArrowRightLine />
                    </Link>
                  </div>
                  <div className="divide-y divide-border">
                    {listings.length === 0 ? (
                      <div className="p-6 text-center text-text-secondary text-sm">
                        No listings yet.{" "}
                        <Link
                          to="/owner/listings/create"
                          className="text-secondary font-medium hover:text-primary"
                        >
                          Post your first room →
                        </Link>
                      </div>
                    ) : (
                      listings.slice(0, 5).map((l) => (
                        <div
                          key={l._id}
                          className="flex items-center gap-3 p-4"
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
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize
                                          ${STATUS_BADGE[l.status] || STATUS_BADGE.inactive}`}
                          >
                            {l.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-card border border-border shadow-card">
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                    <h2 className="font-semibold text-primary text-base sm:text-lg">
                      Booking Requests
                    </h2>
                    <Link
                      to="/owner/bookings"
                      className="text-xs text-secondary hover:text-primary flex items-center gap-1"
                    >
                      View all <RiArrowRightLine />
                    </Link>
                  </div>
                  <div className="divide-y divide-border">
                    {bookings.length === 0 ? (
                      <div className="p-6 text-center text-text-secondary text-sm">
                        No booking requests yet.
                      </div>
                    ) : (
                      bookings.slice(0, 5).map((b) => (
                        <div
                          key={b._id}
                          className="flex items-center gap-3 p-4"
                        >
                          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 overflow-hidden">
                            {b.seeker?.profilePhoto?.url ? (
                              <img
                                src={b.seeker.profilePhoto.url}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <RiUserLine className="text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">
                              {b.seeker?.name || "Seeker"}
                            </p>
                            <p className="text-xs text-text-secondary truncate">
                              {b.listing?.title || "Listing"}
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
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
