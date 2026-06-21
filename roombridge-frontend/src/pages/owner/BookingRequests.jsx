import React, { useEffect, useState } from "react";
import bookingService from "../../services/bookingService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiUserLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiLoader4Line,
  RiHome4Line,
  RiTimeLine,
  RiDeleteBinLine,
} from "react-icons/ri";

document.title = "Booking Requests — RoomBridge";

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

const BookingRequests = () => {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [updating, setUpdating]   = useState(null);
  const [removing, setRemoving]   = useState(null);

  const loadBookings = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await bookingService.getOwnerBookings();
      setBookings(
        Array.isArray(res.bookings) ? res.bookings
        : Array.isArray(res.data)   ? res.data
        : [],
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
      const hasData = bookings.some((b) => b.status === filter);
      if (!hasData) setFilter("all");
    }
  }, [bookings, filter]);

  useEffect(() => {
    const onFocus = () => loadBookings(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleStatus = async (id, status) => {
    if (!id) { toast.error("Invalid booking — please refresh the page."); return; }
    try {
      setUpdating(id);
      let ownerNote;
      if (status === "rejected") {
        ownerNote = window.prompt("Please enter the rejection reason for the seeker:", "");
        if (!ownerNote || !ownerNote.trim()) {
          toast.error("Rejection reason is required.");
          setUpdating(null);
          return;
        }
      }
      await bookingService.updateBookingStatus(id, { status, ownerNote: ownerNote?.trim() });
      await loadBookings(false);
      toast.success(`Booking ${status}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update booking.");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (id) => {
    if (!id) { toast.error("Invalid booking — please refresh."); return; }
    if (!window.confirm("Remove this request permanently?")) return;
    try {
      setRemoving(id);
      await bookingService.removeOwnerBooking(id);
      await loadBookings(false);
      toast.success("Booking request removed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove booking.");
    } finally {
      setRemoving(null);
    }
  };

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const FILTERS = ["all", "pending", "accepted", "rejected", "cancelled"];

  return (
    <RoleDashboardLayout
      role="owner"
      title="Booking Requests"
      subtitle={`${bookings.length} total requests`}
    >
      <div className="max-w-4xl mx-auto">

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

        {/* Content */}
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
            <p className="font-bold text-base mb-1" style={{ color: DK }}>No booking requests</p>
            <p className="text-gray-400 text-sm">
              {filter === "all"
                ? "Booking requests from seekers will appear here."
                : `No ${filter} requests.`}
            </p>
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
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Avatar */}
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm"
                        style={{ backgroundColor: `${DK}12`, color: DK }}
                      >
                        {b.seeker?.profilePhoto?.url ? (
                          <img src={b.seeker.profilePhoto.url} alt="" className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          (b.seeker?.name?.[0] || "?").toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm" style={{ color: DK }}>
                          {b.seeker?.name || "Seeker"}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <RiHome4Line /> {b.listing?.title || "Unknown listing"}
                          </span>
                          {b.moveInDate && (
                            <span className="flex items-center gap-1">
                              <RiTimeLine /> Move-in: {new Date(b.moveInDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <RiCalendarLine /> {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {b.message && (
                          <p
                            className="mt-2 text-xs text-gray-500 italic rounded-xl px-3 py-2 border"
                            style={{ backgroundColor: "#F7F4EF", borderColor: "#E8E2D9" }}
                          >
                            "{b.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status pill */}
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                    >
                      {b.status}
                    </span>
                  </div>

                  {/* Actions — pending */}
                  {b.status === "pending" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#F3EFE9" }}>
                      <button
                        onClick={() => handleStatus(b._id, "accepted")}
                        disabled={updating === b._id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                                   text-white text-xs font-bold hover:opacity-90 disabled:opacity-60 transition-all"
                        style={{ backgroundColor: "#16A34A" }}
                      >
                        {updating === b._id ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatus(b._id, "rejected")}
                        disabled={updating === b._id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                                   text-red-600 text-xs font-bold border hover:bg-red-50 disabled:opacity-60 transition-all"
                        style={{ borderColor: "#FECACA" }}
                      >
                        <RiCloseLine /> Reject
                      </button>
                      <button
                        onClick={() => handleRemove(b._id)}
                        disabled={removing === b._id || updating === b._id}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl
                                   text-gray-400 text-xs font-semibold border hover:bg-gray-50 disabled:opacity-60 transition-all"
                        style={{ borderColor: "#E8E2D9" }}
                      >
                        {removing === b._id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                      </button>
                    </div>
                  )}

                  {/* Actions — non-pending */}
                  {b.status !== "pending" && (
                    <div className="mt-4 pt-4 border-t flex justify-end" style={{ borderColor: "#F3EFE9" }}>
                      <button
                        onClick={() => handleRemove(b._id)}
                        disabled={removing === b._id}
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border
                                   text-gray-400 text-xs font-semibold hover:bg-gray-50 disabled:opacity-60 transition-all"
                        style={{ borderColor: "#E8E2D9" }}
                      >
                        {removing === b._id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                        Remove
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

export default BookingRequests;
