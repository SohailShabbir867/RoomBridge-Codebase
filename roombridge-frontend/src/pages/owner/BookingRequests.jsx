import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const BADGE = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-error/10 text-error border-error/20",
  cancelled: "bg-border text-text-secondary border-border",
};

const BookingRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [removing, setRemoving] = useState(null);

  const loadBookings = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await bookingService.getOwnerBookings();
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
    const onFocus = () => loadBookings(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleStatus = async (id, status) => {
    if (!id) {
      toast.error("Invalid booking — please refresh the page.");
      return;
    }
    try {
      setUpdating(id);
      let ownerNote;
      if (status === "rejected") {
        ownerNote = window.prompt(
          "Please enter the rejection reason for the seeker:",
          "",
        );
        if (!ownerNote || !ownerNote.trim()) {
          toast.error("Rejection reason is required.");
          setUpdating(null);
          return;
        }
      }
      /*
        bookingService.updateBookingStatus expects (id, { status })
        — an object as second arg, NOT a raw string.
        Old code: bookingService.updateBookingStatus(id, status)  ← WRONG
        New code: bookingService.updateBookingStatus(id, { status }) ← CORRECT
      */
      await bookingService.updateBookingStatus(id, {
        status,
        ownerNote: ownerNote?.trim(),
      });
      await loadBookings(false);
      toast.success(`Booking ${status}!`);
    } catch (err) {
      /* err.message undefined on axios errors */
      toast.error(err.response?.data?.message || "Failed to update booking.");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (id) => {
    if (!id) {
      toast.error("Invalid booking — please refresh the page.");
      return;
    }
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

  return (
    <RoleDashboardLayout
      role="owner"
      title="Booking Requests"
      subtitle={`${bookings.length} total requests`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Filter tabs */}
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
            <p className="text-primary font-semibold text-lg">
              No booking requests
            </p>
            <p className="text-text-secondary text-sm">
              {filter === "all"
                ? "Booking requests from seekers will appear here."
                : `No ${filter} requests.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b._id}
                className="bg-white rounded-card border border-border shadow-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shrink-0 overflow-hidden">
                      {b.seeker?.profilePhoto?.url ? (
                        <img
                          src={b.seeker.profilePhoto.url}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <RiUserLine className="text-primary text-xl" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-primary">
                        {b.seeker?.name || "Seeker"}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <RiHome4Line className="text-secondary" />
                          {b.listing?.title || "Unknown listing"}
                        </span>
                        {b.moveInDate && (
                          <span className="flex items-center gap-1">
                            <RiTimeLine className="text-secondary" />
                            Move-in:{" "}
                            {new Date(b.moveInDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <RiCalendarLine className="text-secondary" />
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/*
                        old code was literally: "{b.message}"
                        The curly braces inside the string were just characters — not JSX.
                        This rendered as the literal text "{b.message}" instead of the value.
                      */}
                      {b.message && (
                        <p className="mt-2 text-sm text-text-secondary italic bg-background rounded-input p-2 border border-border">
                          "{b.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 capitalize
                                    ${BADGE[b.status] || ""}`}
                  >
                    {b.status}
                  </span>
                </div>

                {b.status === "pending" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <button
                      onClick={() => handleStatus(b._id, "accepted")}
                      disabled={updating === b._id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn
                                       bg-success text-white text-sm font-medium hover:bg-success/90
                                       disabled:opacity-60 transition-colors"
                    >
                      {updating === b._id ? (
                        <RiLoader4Line className="animate-spin" />
                      ) : (
                        <RiCheckLine />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatus(b._id, "rejected")}
                      disabled={updating === b._id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn
                                       border border-error text-error text-sm font-medium hover:bg-error/5
                                       disabled:opacity-60 transition-colors"
                    >
                      <RiCloseLine /> Reject
                    </button>
                    <button
                      onClick={() => handleRemove(b._id)}
                      disabled={removing === b._id || updating === b._id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn
                                       border border-border text-text-secondary text-sm font-medium hover:bg-background
                                       disabled:opacity-60 transition-colors"
                    >
                      {removing === b._id ? (
                        <RiLoader4Line className="animate-spin" />
                      ) : (
                        <RiDeleteBinLine />
                      )}
                      Remove
                    </button>
                  </div>
                )}

                {b.status !== "pending" && (
                  <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={() => handleRemove(b._id)}
                      disabled={removing === b._id}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-btn
                                       border border-border text-text-secondary text-sm font-medium hover:bg-background
                                       disabled:opacity-60 transition-colors"
                    >
                      {removing === b._id ? (
                        <RiLoader4Line className="animate-spin" />
                      ) : (
                        <RiDeleteBinLine />
                      )}
                      Remove
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

export default BookingRequests;
