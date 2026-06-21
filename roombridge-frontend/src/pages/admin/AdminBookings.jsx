import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import adminService from "../../services/adminService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiCalendarCheckLine,
  RiLoader4Line,
  RiHome4Line,
  RiTimeLine,
  RiRefreshLine,
} from "react-icons/ri";

document.title = "Admin Bookings - RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

const STATUS_COLORS = {
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  accepted:  { bg: "#D1FAE5", text: "#065F46" },
  rejected:  { bg: "#FEE2E2", text: "#991B1B" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280" },
};

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all border"
    style={{
      backgroundColor: active ? DK     : "#FFF",
      color:           active ? "#FFF" : "#6B7280",
      borderColor:     active ? DK     : "#E8E2D9",
    }}
  >
    {label}
  </button>
);

const AdminBookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = searchParams.get("status") || "";
    return ["", "pending", "accepted", "rejected", "cancelled"].includes(status) ? status : "";
  });
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isNaN(p) ? 1 : Math.max(1, p);
  });
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchBookings = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const nextPage   = opts.page   ?? page;
      const nextStatus = opts.status !== undefined ? opts.status : statusFilter;
      const nextParams = new URLSearchParams();
      if (nextStatus) nextParams.set("status", nextStatus);
      if (nextPage > 1) nextParams.set("page", String(nextPage));
      setSearchParams(nextParams);
      const res   = await adminService.getAllBookings({ page: nextPage, limit: LIMIT, status: nextStatus });
      const items = res.data ?? res.bookings ?? [];
      setBookings(Array.isArray(items) ? items : []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
      setPage(nextPage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, setSearchParams]);

  useEffect(() => { fetchBookings(); }, []); // eslint-disable-line

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <RoleDashboardLayout
      role="admin"
      title="Bookings"
      subtitle={`${total} total bookings`}
      headerAction={
        <button
          onClick={() => fetchBookings()}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all"
          style={{ backgroundColor: BTN }}
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["", "pending", "accepted", "rejected", "cancelled"].map((s) => (
            <FilterPill
              key={s} label={s || "All"}
              active={statusFilter === s}
              onClick={() => { setStatusFilter(s); fetchBookings({ page: 1, status: s }); }}
            />
          ))}
        </div>

        {loading && bookings.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#E8E2D9" }}>
            <RiCalendarCheckLine className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="font-bold" style={{ color: DK }}>No bookings found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}>
                    {["Listing", "Seeker", "Owner", "Status", "Dates"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                        style={{ color: `${DK}70` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const sc = STATUS_COLORS[b.status] || STATUS_COLORS.cancelled;
                    return (
                      <tr key={b._id} className="border-b transition-colors hover:bg-[#F7F4EF]" style={{ borderColor: "#F3EFE9" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: CR }}>
                              {b.listing?.photos?.[0]?.url
                                ? <img src={b.listing.photos[0].url} alt={b.listing?.title || "Listing"} className="w-9 h-9 object-cover" />
                                : <RiHome4Line style={{ color: DK }} />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate max-w-48" style={{ color: DK }}>
                                {b.listing?.title || "Listing removed"}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{b.listing?.city || "Unknown city"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-xs" style={{ color: DK }}>{b.seeker?.name || "—"}</p>
                          <p className="text-xs text-gray-400 truncate">{b.seeker?.email || "-"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-xs" style={{ color: DK }}>{b.owner?.name || "—"}</p>
                          <p className="text-xs text-gray-400 truncate">{b.owner?.email || "-"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                            style={{ backgroundColor: sc.bg, color: sc.text }}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <RiTimeLine style={{ color: ACC }} /> {new Date(b.createdAt).toLocaleDateString()}
                          </p>
                          {b.moveInDate && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Move-in: {new Date(b.moveInDate).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#F3EFE9", backgroundColor: CR }}>
                <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} bookings</p>
                <div className="flex gap-2">
                  {[{ label: "← Prev", pg: page - 1, dis: page <= 1 }, { label: "Next →", pg: page + 1, dis: page >= totalPages }]
                    .map(({ label, pg, dis }) => (
                      <button key={label} onClick={() => fetchBookings({ page: pg })} disabled={dis || loading}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border disabled:opacity-40 transition-all"
                        style={{ borderColor: "#E8E2D9", color: DK }}>
                        {label}
                      </button>
                    ))}
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
