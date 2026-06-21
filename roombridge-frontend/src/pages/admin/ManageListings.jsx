import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import adminService from "../../services/adminService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiSearchLine,
  RiLoader4Line,
  RiHome4Line,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiMapPin2Line,
} from "react-icons/ri";

document.title = "Manage Listings — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

const STATUS_COLORS = {
  pending:  { bg: "#FEF3C7", text: "#92400E" },
  active:   { bg: "#D1FAE5", text: "#065F46" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
  inactive: { bg: "#F3F4F6", text: "#6B7280" },
};

const ROOM_TYPE_LABELS = {
  single:    "Single Room",
  shared:    "Shared Room",
  apartment: "Apartment",
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

const ActionBtn = ({ onClick, disabled, color, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60"
    style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color; e.currentTarget.style.color = "#fff"; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${color}15`; e.currentTarget.style.color = color; }}
  >
    {children}
  </button>
);

const ManageListings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState(() => searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = searchParams.get("status") || "";
    return ["", "pending", "active", "rejected", "inactive"].includes(status) ? status : "";
  });
  const [page, setPage]           = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isNaN(p) ? 1 : Math.max(1, p);
  });
  const [total, setTotal]         = useState(0);
  const [updating, setUpdating]   = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const LIMIT = 20;
  const searchTimer = useRef(null);

  const fetchListings = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const nextPage   = opts.page   ?? page;
      const nextStatus = opts.status !== undefined ? opts.status : statusFilter;
      const nextSearch = opts.search !== undefined ? opts.search : search;
      const nextParams = new URLSearchParams();
      if (nextStatus) nextParams.set("status", nextStatus);
      if (nextSearch) nextParams.set("search", nextSearch);
      if (nextPage > 1) nextParams.set("page", String(nextPage));
      setSearchParams(nextParams);
      const res   = await adminService.getAllListings({ page: nextPage, limit: LIMIT, status: nextStatus, search: nextSearch });
      const items = res.data ?? res.listings ?? [];
      setListings(Array.isArray(items) ? items : []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
      setPage(nextPage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, setSearchParams]);

  useEffect(() => { fetchListings(); }, []); // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchListings({ page: 1, search: val, status: statusFilter }), 400);
  };

  const handleApprove = async (l) => {
    try {
      setUpdating(l._id);
      await adminService.updateListingStatus(l._id, { status: "active" });
      setListings((ls) => ls.map((x) => x._id === l._id ? { ...x, status: "active" } : x));
      toast.success(`"${l.title}" approved!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve listing.");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeactivate = async (l) => {
    if (!window.confirm(`Deactivate "${l.title}"?`)) return;
    try {
      setUpdating(l._id);
      await adminService.updateListingStatus(l._id, { status: "inactive" });
      setListings((ls) => ls.map((x) => x._id === l._id ? { ...x, status: "inactive" } : x));
      toast.success(`"${l.title}" deactivated.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deactivate listing.");
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async () => {
    const l = rejectModal;
    if (!l) return;
    try {
      setUpdating(l._id);
      await adminService.updateListingStatus(l._id, { status: "rejected", rejectionReason: rejectReason || undefined });
      setListings((ls) => ls.map((x) => x._id === l._id ? { ...x, status: "rejected", rejectionReason: rejectReason } : x));
      toast.success(`"${l.title}" rejected.`);
      setRejectModal(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject listing.");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (l) => {
    if (!window.confirm(`Permanently delete "${l.title}"?`)) return;
    try {
      setDeleting(l._id);
      await adminService.deleteListing(l._id);
      setListings((ls) => ls.filter((x) => x._id !== l._id));
      setTotal((t) => t - 1);
      toast.success("Listing deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete listing.");
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <RoleDashboardLayout
      role="admin"
      title="Manage Listings"
      subtitle={`${total} total listings`}
      headerAction={
        <button
          onClick={() => fetchListings()}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all"
          style={{ backgroundColor: BTN }}
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, city, address…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["", "pending", "active", "rejected", "inactive"].map((s) => (
              <FilterPill
                key={s} label={s || "All"}
                active={statusFilter === s}
                onClick={() => { setStatusFilter(s); fetchListings({ page: 1, status: s, search }); }}
              />
            ))}
          </div>
        </div>

        {/* Table */}
        {loading && listings.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#E8E2D9" }}>
            <RiHome4Line className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="font-bold" style={{ color: DK }}>No listings found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}>
                    {["Listing", "Owner", "Status", "Rent", "Submitted", "Actions"].map((h, i) => (
                      <th key={h}
                        className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest ${i === 5 ? "text-right" : "text-left"}`}
                        style={{ color: `${DK}70` }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => {
                    const isUpdating = updating === l._id;
                    const isDeleting = deleting === l._id;
                    const sc = STATUS_COLORS[l.status] || STATUS_COLORS.inactive;
                    return (
                      <tr key={l._id} className="border-b transition-colors hover:bg-[#F7F4EF]" style={{ borderColor: "#F3EFE9" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: CR }}>
                              {l.photos?.[0]?.url
                                ? <img src={l.photos[0].url} alt={l.title} className="w-10 h-10 object-cover" />
                                : <RiHome4Line className="m-auto mt-2.5" style={{ color: DK }} />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate max-w-48" style={{ color: DK }}>{l.title}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <RiMapPin2Line style={{ color: ACC }} /> {l.city}
                                {l.roomType && <span>· {ROOM_TYPE_LABELS[l.roomType] || l.roomType}</span>}
                              </p>
                              {l.rejectionReason && (
                                <p className="text-[10px] text-red-400 truncate max-w-48" title={l.rejectionReason}>
                                  ✕ {l.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-xs" style={{ color: DK }}>{l.owner?.name || "—"}</p>
                          <p className="text-xs text-gray-400">{l.owner?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                            style={{ backgroundColor: sc.bg, color: sc.text }}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-xs" style={{ color: DK }}>
                          PKR {(l.rent || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {l.status !== "active" && (
                              <ActionBtn onClick={() => handleApprove(l)} disabled={isUpdating} color="#16A34A" title="Approve listing">
                                {isUpdating ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} Approve
                              </ActionBtn>
                            )}
                            {(l.status === "pending" || l.status === "active") && (
                              <ActionBtn onClick={() => setRejectModal(l)} disabled={isUpdating} color="#D97706" title="Reject listing">
                                <RiCloseLine /> Reject
                              </ActionBtn>
                            )}
                            {l.status === "active" && (
                              <ActionBtn onClick={() => handleDeactivate(l)} disabled={isUpdating} color="#6B7280" title="Deactivate listing">
                                Off
                              </ActionBtn>
                            )}
                            <ActionBtn onClick={() => handleDelete(l)} disabled={isDeleting} color="#DC2626" title="Delete listing permanently">
                              {isDeleting ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#F3EFE9", backgroundColor: CR }}>
                <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} listings</p>
                <div className="flex gap-2">
                  {[{ label: "← Prev", pg: page - 1, dis: page <= 1 }, { label: "Next →", pg: page + 1, dis: page >= totalPages }]
                    .map(({ label, pg, dis }) => (
                      <button key={label} onClick={() => fetchListings({ page: pg })} disabled={dis || loading}
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

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-extrabold text-lg mb-1" style={{ color: DK }}>Reject "{rejectModal.title}"?</h3>
            <p className="text-gray-400 text-sm mb-4">An email will be sent to the owner explaining the reason.</p>
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Rejection Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Does not meet platform guidelines…"
                rows={3}
                className="w-full rounded-xl py-3 px-4 text-sm border outline-none resize-none focus:ring-2"
                style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                style={{ borderColor: "#E8E2D9" }}
              >Cancel</button>
              <button
                onClick={handleReject}
                disabled={updating === rejectModal._id}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ backgroundColor: "#DC2626" }}
              >
                {updating === rejectModal._id ? <RiLoader4Line className="animate-spin inline mr-1" /> : <RiCloseLine className="inline mr-1" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleDashboardLayout>
  );
};

export default ManageListings;
