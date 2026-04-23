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
} from "react-icons/ri";

document.title = "My Booking Requests — RoomBridge";

const BADGE = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-error/10 text-error border-error/20",
  cancelled: "bg-border text-text-secondary border-border",
};

const MyRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancelling, setCancelling] = useState(null);

  const loadBookings = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await bookingService.getMyBookings();
      setBookings(
        Array.isArray(res.bookings)
          ? res.bookings
          : Array.isArray(res.data)
            ? res.data
            : [],
      );
    } catch (err) {
      console.error(err);
      if (showLoader) {
        toast.error("Failed to load booking requests.");
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (filter !== "all" && bookings.length > 0) {
      const hasFilterData = bookings.some((b) => b.status === filter);
      if (!hasFilterData) setFilter("all");
    }
  }, [bookings, filter]);

  useEffect(() => {
    // Keep data fresh when returning to this tab/page.
    const onFocus = () => loadBookings(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleCancel = async (id) => {
    if (!id) {
      toast.error("Invalid booking — please refresh the page.");
      return;
    }
    if (!window.confirm("Cancel and remove this booking request?")) return;
    try {
      setCancelling(id);
      await bookingService.cancelBooking(id);
      await loadBookings(false);
      toast.success("Booking request removed.");
    } catch (err) {
      /* err.message undefined on axios errors */
      toast.error(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancelling(null);
    }
  };

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <RoleDashboardLayout
      role="seeker"
      title="My Booking Requests"
      subtitle={`${bookings.length} total request${bookings.length !== 1 ? "s" : ""}`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "pending", "accepted", "rejected", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                                ${
                                  filter === f
                                    ? "bg-primary text-white shadow-card"
                                    : "bg-white border border-border text-text-secondary hover:text-primary"
                                }`}
            >
              {f}
              {f !== "all" && (
                <span className="ml-1 text-xs opacity-70">
                  ({bookings.filter((b) => b.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiCalendarLine className="text-5xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold text-lg mb-1">
              No requests found
            </p>
            <p className="text-text-secondary text-sm mb-5">
              {filter === "all"
                ? "You haven't made any booking requests yet."
                : `No ${filter} requests.`}
            </p>
            <Link
              to="/listings"
              className="btn-primary inline-flex items-center gap-2"
            >
              <RiHome4Line /> Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b._id}
                className="bg-white rounded-card border border-border shadow-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/listings/${b.listing?._id}`}
                      className="font-semibold text-primary hover:text-secondary transition-colors line-clamp-1"
                    >
                      {b.listing?.title || "Listing"}
                    </Link>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-text-secondary">
                      {b.listing?.city && (
                        <span className="flex items-center gap-1">
                          <RiHome4Line className="text-secondary" />
                          {b.listing.city}
                        </span>
                      )}
                      {b.moveInDate && (
                        <span className="flex items-center gap-1">
                          <RiTimeLine className="text-secondary" />
                          Move-in: {new Date(b.moveInDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <RiCalendarLine className="text-secondary" />
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {/*
                      Was literally: "{b.message}" — curly braces inside
                      the string were rendered as text. Now properly wrapped in JSX.
                    */}
                    {b.message && (
                      <p
                        className="mt-2 text-sm text-text-secondary italic bg-background
                                    rounded-input p-2 border border-border line-clamp-2"
                      >
                        "{b.message}"
                      </p>
                    )}
                    {b.ownerNote && (
                      <div
                        className={`mt-2 text-sm p-2 rounded-input border
                                       ${
                                         b.status === "accepted"
                                           ? "bg-success/5 border-success/20 text-success"
                                           : "bg-error/5 border-error/20 text-error"
                                       }`}
                      >
                        <span className="font-medium">Owner note:</span>{" "}
                        {b.ownerNote}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 capitalize
                                    ${BADGE[b.status] || ""}`}
                  >
                    {b.status}
                  </span>
                </div>

                {b.status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={() => handleCancel(b._id)}
                      disabled={cancelling === b._id}
                      className="flex items-center gap-1.5 text-sm text-error border border-error/30
                                       px-3 py-1.5 rounded-btn hover:bg-error/5 disabled:opacity-60 transition-colors"
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
            ))}
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default MyRequests;
