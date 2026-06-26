import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bookingService from "../../services/bookingService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiCalendarLine,
  RiLoader4Line,
  RiTimeLine,
  RiHome4Line,
  RiCloseCircleLine,
  RiMapPin2Line,
} from "react-icons/ri";

document.title = "My Booking Requests — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";

const STATUS_COLOR = {
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  accepted:  { bg: "#D1FAE5", text: "#065F46" },
  rejected:  { bg: "#FEE2E2", text: "#991B1B" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280" },
};
// Hooks 

const MyRequests = () => {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [cancelling, setCancelling] = useState(null);

  const loadBookings = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await bookingService.getMyBookings();
      setBookings(
        Array.isArray(res.bookings) ? res.bookings
        : Array.isArray(res.data)   ? res.data : [],
      );
    } catch (err) {
      console.error(err);
      if (showLoader) toast.error("Failed to load booking requests.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  useEffect(() => {
    if (filter !== "all" && bookings.length > 0) {
      const hasFilterData = bookings.some((b) => b.status === filter);
      if (!hasFilterData) setFilter("all");
    }
  }, [bookings, filter]);

  useEffect(() => {
    const onFocus = () => loadBookings(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleCancel = async (id) => {
    if (!id) { toast.error("Invalid booking — please refresh the page."); return; }
    if (!window.confirm("Cancel and remove this booking request?")) return;
    try {
      setCancelling(id);
      await bookingService.cancelBooking(id);
      await loadBookings(false);
      toast.success("Booking request removed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancelling(null);
    }
  };

  const FILTERS = ["all", "pending", "accepted", "rejected", "cancelled"];
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <RoleDashboardLayout
      role="seeker"
      title="My Booking Requests"
      subtitle={`${bookings.length} total request${bookings.length !== 1 ? "s" : ""}`}
    >
      <div className="max-w-3xl mx-auto">

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all border"
                style={{
                  backgroundColor: isActive ? DK : "#FFFFFF",
                  color:           isActive ? "#FFFFFF" : "#6B7280",
                  borderColor:     isActive ? DK : "#E8E2D9",
                }}
              >
                {f}
                {f !== "all" && (
                  <span className="ml-1 opacity-60">
                    ({bookings.filter((b) => b.status === f).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-20 bg-white rounded-2xl border shadow-sm"
            style={{ borderColor: "#E8E2D9" }}
          >
            <RiCalendarLine className="text-5xl mx-auto mb-4 text-gray-200" />
            <p className="font-bold text-base mb-1" style={{ color: DK }}>No requests found</p>
            <p className="text-gray-400 text-sm mb-6">
              {filter === "all"
                ? "You haven't made any booking requests yet."
                : `No ${filter} requests.`}
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: BTN }}
            >
              <RiHome4Line /> Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const sc = STATUS_COLOR[b.status] || STATUS_COLOR.cancelled;
              return (
                <div
                  key={b._id}
                  className="bg-white rounded-2xl border shadow-sm p-5"
                  style={{ borderColor: "#E8E2D9" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/explore/${b.listing?._id}`}
                        className="font-bold text-sm line-clamp-1 hover:opacity-80 transition-opacity"
                        style={{ color: DK }}
                      >
                        {b.listing?.title || "Listing"}
                      </Link>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                        {b.listing?.city && (
                          <span className="flex items-center gap-1">
                            <RiMapPin2Line style={{ color: ACC }} /> {b.listing.city}
                          </span>
                        )}
                        {b.moveInDate && (
                          <span className="flex items-center gap-1">
                            <RiTimeLine style={{ color: ACC }} />
                            Move-in: {new Date(b.moveInDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <RiCalendarLine style={{ color: ACC }} />
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {b.message && (
                        <p
                          className="mt-2 text-xs text-gray-500 italic rounded-xl px-3 py-2 border line-clamp-2"
                          style={{ backgroundColor: "#F7F4EF", borderColor: "#E8E2D9" }}
                        >
                          "{b.message}"
                        </p>
                      )}

                      {b.ownerNote && (
                        <div
                          className="mt-2 text-xs p-2.5 rounded-xl border font-medium"
                          style={
                            b.status === "accepted"
                              ? { backgroundColor: "#D1FAE5", borderColor: "#A7F3D0", color: "#065F46" }
                              : { backgroundColor: "#FEE2E2", borderColor: "#FECACA", color: "#991B1B" }
                          }
                        >
                          <span className="font-bold">Owner note: </span>
                          {b.ownerNote}
                        </div>
                      )}
                    </div>

                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                    >
                      {b.status}
                    </span>
                  </div>

                  {b.status === "pending" && (
                    <div className="mt-4 pt-4 border-t flex justify-end" style={{ borderColor: "#F3EFE9" }}>
                      <button
                        onClick={() => handleCancel(b._id)}
                        disabled={cancelling === b._id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border
                                   px-3 py-1.5 rounded-xl hover:bg-red-50 disabled:opacity-60 transition-all"
                        style={{ borderColor: "#FECACA" }}
                      >
                        {cancelling === b._id ? (
                          <RiLoader4Line className="animate-spin" />
                        ) : (
                          <RiCloseCircleLine />
                        )}
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default MyRequests;
