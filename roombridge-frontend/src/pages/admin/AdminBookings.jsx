import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import adminService from "../../services/adminService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiCalendarCheckLine,
  RiLoader4Line,
  RiHome4Line,
  RiUserLine,
  RiTimeLine,
  RiRefreshLine,
} from "react-icons/ri";

document.title = "Admin Bookings - RoomBridge";

const STATUS_BADGE = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-error/10 text-error border-error/20",
  cancelled: "bg-border text-text-secondary border-border",
};

const AdminBookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = searchParams.get("status") || "";
    return ["", "pending", "accepted", "rejected", "cancelled"].includes(status)
      ? status
      : "";
  });
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isNaN(p) ? 1 : Math.max(1, p);
  });
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchBookings = useCallback(
    async (opts = {}) => {
      try {
        setLoading(true);
        const nextPage = opts.page ?? page;
        const nextStatus =
          opts.status !== undefined ? opts.status : statusFilter;

        const nextParams = new URLSearchParams();
        if (nextStatus) nextParams.set("status", nextStatus);
        if (nextPage > 1) nextParams.set("page", String(nextPage));
        setSearchParams(nextParams);

        const params = {
          page: nextPage,
          limit: LIMIT,
          status: nextStatus,
        };

        const res = await adminService.getAllBookings(params);
        const items = res.data ?? res.bookings ?? [];
        setBookings(Array.isArray(items) ? items : []);
        setTotal(res.pagination?.total ?? res.total ?? 0);
        setPage(nextPage);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter, setSearchParams],
  );

  useEffect(() => {
    fetchBookings();
  }, []); // eslint-disable-line

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchBookings({ page: 1, status });
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <RoleDashboardLayout
      role="admin"
      title="Bookings"
      subtitle={`${total} total bookings`}
      headerAction={
        <button
          onClick={() => fetchBookings()}
          className="flex items-center gap-2 text-sm text-secondary border border-secondary/30 px-3 py-1.5 rounded-btn hover:bg-secondary hover:text-white transition-colors"
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2 mb-6 flex-wrap">
          {["", "pending", "accepted", "rejected", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                statusFilter === s
                  ? "bg-primary text-white shadow-card"
                  : "bg-white border border-border text-text-secondary hover:text-primary"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {loading && bookings.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiCalendarCheckLine className="text-5xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold">No bookings found</p>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">
                      Listing
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">
                      Seeker
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">
                      Owner
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">
                      Dates
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => (
                    <tr
                      key={b._id}
                      className="hover:bg-background/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-background shrink-0 flex items-center justify-center">
                            {b.listing?.photos?.[0]?.url ? (
                              <img
                                src={b.listing.photos[0].url}
                                alt={b.listing?.title || "Listing"}
                                className="w-9 h-9 object-cover"
                              />
                            ) : (
                              <RiHome4Line className="text-primary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-primary truncate max-w-52">
                              {b.listing?.title || "Listing removed"}
                            </p>
                            <p className="text-xs text-text-secondary truncate">
                              {b.listing?.city || "Unknown city"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-primary truncate">
                            {b.seeker?.name || "Seeker removed"}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {b.seeker?.email || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-primary truncate">
                            {b.owner?.name || "Owner removed"}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {b.owner?.email || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_BADGE[b.status] || ""}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-text-secondary flex items-center gap-1">
                          <RiTimeLine /> Created:{" "}
                          {new Date(b.createdAt).toLocaleDateString()}
                        </p>
                        {b.moveInDate && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            Move-in:{" "}
                            {new Date(b.moveInDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background/50">
                <p className="text-xs text-text-secondary">
                  Page {page} of {totalPages} · {total} bookings
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchBookings({ page: page - 1 })}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => fetchBookings({ page: page + 1 })}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default AdminBookings;
