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
import api from "../../services/api";

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
  const [hasPreferences, setHasPreferences] = useState(true);

  useEffect(() => {
    // Check roommate match preferences
    api.get("/preferences/me")
      .then((res) => {
        const payload = res.data;
        let p = null;
        if (payload) {
          if (payload.preference !== undefined) p = payload.preference;
          else if (payload.data?.preference !== undefined) p = payload.data.preference;
          else if (payload.data && !Array.isArray(payload.data)) p = payload.data;
        }

        if (!p) {
          setHasPreferences(false);
          toast("Create roommate matches to find out the best roommates!", {
            icon: "🤝",
            duration: 6000,
            id: "roommate-match-toast",
          });
        }
      })
      .catch(() => {
        setHasPreferences(false);
        toast("Create roommate matches to find out the best roommates!", {
          icon: "🤝",
          duration: 6000,
          id: "roommate-match-toast",
        });
      });

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

          {/* Roommate Match Promo Banner */}
          {!hasPreferences && (
            <div 
              className="relative overflow-hidden rounded-2xl border p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in transition-all duration-300 hover:shadow-md"
              style={{ 
                borderColor: "#FFD8A8", 
                background: "linear-gradient(135deg, #FFF9DB 0%, #FFF3BF 100%)" 
              }}
            >
              {/* Blur accent */}
              <div 
                className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-20 filter blur-xl" 
                style={{ backgroundColor: ACC }} 
              />
              
              <div className="flex items-start gap-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(142, 78, 20, 0.1)" }}
                >
                  <RiGroupLine className="text-xl" style={{ color: BTN }} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm" style={{ color: DK }}>
                    Find Your Perfect Roommate! 🤝
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 max-w-xl leading-relaxed">
                    Create your roommate match profile to discover and connect with other seekers sharing similar lifestyles, budgets, and habits!
                  </p>
                </div>
              </div>
              
              <Link
                to="/seeker/roommate-match"
                className="w-full md:w-auto text-center text-xs font-bold px-5 py-2.5 rounded-xl text-white shadow-sm transition-all hover:opacity-95 active:scale-95 shrink-0"
                style={{ backgroundColor: BTN }}
              >
                Set Up Match Profile
              </Link>
            </div>
          )}

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
