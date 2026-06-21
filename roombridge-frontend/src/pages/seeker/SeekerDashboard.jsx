import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  RiHeart3Line,
  RiCalendarCheckLine,
  RiGroupLine,
  RiHome4Line,
  RiArrowRightLine,
  RiLoader4Line,
  RiSearchLine,
} from "react-icons/ri";
import bookingService from "../../services/bookingService";
import listingService from "../../services/listingService";
import authService from "../../services/authService";
import { logout } from "../../redux/slices/authSlice";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";

document.title = "Seeker Dashboard — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";

/* ── Status colours ─────────────────────────────────────────── */
const STATUS_COLOR = {
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  accepted:  { bg: "#D1FAE5", text: "#065F46" },
  rejected:  { bg: "#FEE2E2", text: "#991B1B" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280" },
};

/* ── Stat card ──────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, accent, to }) => (
  <Link
    to={to || "#"}
    className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all group"
    style={{ borderColor: "#E8E2D9" }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${accent}18` }}
    >
      <Icon className="text-xl" style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-extrabold leading-none" style={{ color: DK }}>
        {value ?? "—"}
      </p>
      <p className="text-xs text-gray-400 mt-1 leading-snug group-hover:text-gray-600 transition-colors">
        {label}
      </p>
    </div>
  </Link>
);

const SeekerDashboard = () => {
  const { user }   = useSelector((s) => s.auth);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [saved, setSaved]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      bookingService.getMyBookings({ limit: 5 }),
      listingService.getSavedListings({ limit: 4 }),
    ])
      .then(([bRes, sRes]) => {
        setBookings(
          Array.isArray(bRes.bookings) ? bRes.bookings
          : Array.isArray(bRes.data)   ? bRes.data : [],
        );
        setSaved(
          Array.isArray(sRes.listings) ? sRes.listings
          : Array.isArray(sRes.data)   ? sRes.data : [],
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending  = bookings.filter((b) => b.status === "pending").length;
  const accepted = bookings.filter((b) => b.status === "accepted").length;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <RoleDashboardLayout
      role="seeker"
      title="Dashboard"
      subtitle={`${greeting}, ${user?.name?.split(" ")[0] || "Seeker"} 👋`}
      headerAction={
        <Link
          to="/explore"
          className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl
                     hover:opacity-90 active:scale-95 transition-all shadow-sm"
          style={{ backgroundColor: BTN }}
        >
          <RiSearchLine /> Browse Rooms
        </Link>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={RiCalendarCheckLine} label="Total Requests" value={bookings.length} accent={DK}  to="/seeker/requests" />
            <StatCard icon={RiHome4Line}         label="Pending"        value={pending}          accent="#F59E0B" to="/seeker/requests" />
            <StatCard icon={RiCalendarCheckLine} label="Accepted"       value={accepted}         accent="#16A34A" to="/seeker/requests" />
            <StatCard icon={RiHeart3Line}        label="Saved Rooms"    value={saved.length}     accent={BTN} to="/seeker/saved" />
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Booking Requests */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3EFE9" }}>
                <h2 className="font-bold text-sm" style={{ color: DK }}>My Booking Requests</h2>
                <Link
                  to="/seeker/requests"
                  className="flex items-center gap-1 text-xs font-semibold hover:opacity-75 transition-opacity"
                  style={{ color: BTN }}
                >
                  View all <RiArrowRightLine />
                </Link>
              </div>
              <div className="divide-y" style={{ divideColor: "#F3EFE9" }}>
                {bookings.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No requests yet.{" "}
                    <Link to="/explore" className="font-semibold" style={{ color: BTN }}>
                      Browse rooms →
                    </Link>
                  </div>
                ) : (
                  bookings.slice(0, 5).map((b) => {
                    const sc = STATUS_COLOR[b.status] || STATUS_COLOR.cancelled;
                    return (
                      <div key={b._id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: DK }}>
                            {b.listing?.title || "Listing"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {b.listing?.city} · {new Date(b.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {b.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Saved Rooms */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3EFE9" }}>
                <h2 className="font-bold text-sm" style={{ color: DK }}>Saved Rooms</h2>
                <Link
                  to="/seeker/saved"
                  className="flex items-center gap-1 text-xs font-semibold hover:opacity-75 transition-opacity"
                  style={{ color: BTN }}
                >
                  View all <RiArrowRightLine />
                </Link>
              </div>
              <div className="divide-y" style={{ divideColor: "#F3EFE9" }}>
                {saved.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No saved rooms yet.{" "}
                    <Link to="/explore" className="font-semibold" style={{ color: BTN }}>
                      Find rooms →
                    </Link>
                  </div>
                ) : (
                  saved.slice(0, 4).map((l) => (
                    <Link
                      key={l._id}
                      to={`/explore/${l._id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F4EF] transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                        style={{ backgroundColor: "#F3EFE9" }}
                      >
                        {l.photos?.[0]?.url ? (
                          <img src={l.photos[0].url} alt={l.title} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <RiHome4Line style={{ color: DK }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: DK }}>{l.title}</p>
                        <p className="text-xs text-gray-400">
                          {l.city} · PKR {(l.rent || 0).toLocaleString()}/mo
                        </p>
                      </div>
                      <RiArrowRightLine className="text-gray-300 shrink-0" />
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/explore"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-bold
                         hover:opacity-90 transition-all text-white"
              style={{ backgroundColor: DK, borderColor: DK }}
            >
              <RiSearchLine /> Browse Rooms
            </Link>
            <Link
              to="/seeker/roommate-match"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-bold
                         hover:opacity-90 transition-all text-white"
              style={{ backgroundColor: BTN, borderColor: BTN }}
            >
              <RiGroupLine /> Roommate Match
            </Link>
          </div>

        </div>
      )}
    </RoleDashboardLayout>
  );
};

export default SeekerDashboard;
