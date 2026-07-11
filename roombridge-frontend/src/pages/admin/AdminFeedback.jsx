import React, { useCallback, useEffect, useState } from "react";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import feedbackService from "../../services/feedbackService";
import toast from "react-hot-toast";
import {
  RiStarFill,
  RiStarLine,
  RiLoader4Line,
  RiRefreshLine,
  RiSearchLine,
  RiCheckLine,
  RiTimeLine,
  RiDeleteBinLine,
  RiChatSmile3Line,
  RiFilterLine,
  RiEyeLine,
  RiCloseLine,
} from "react-icons/ri";

document.title = "Feedback — RoomBridge Admin";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

const STATUS_COLORS = {
  new:      { bg: "#FEF3C7", text: "#92400E", label: "New"      },
  reviewed: { bg: "#EFF6FF", text: "#1D4ED8", label: "Reviewed" },
  resolved: { bg: "#D1FAE5", text: "#065F46", label: "Resolved" },
};

const CATEGORY_LABELS = {
  general:         "💬 General",
  bug_report:      "🐛 Bug Report",
  feature_request: "✨ Feature Request",
  other:           "📝 Other",
};

const StarRating = ({ rating, size = 16 }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) =>
      s <= rating
        ? <RiStarFill  key={s} size={size} style={{ color: "#FBBF24" }} />
        : <RiStarLine  key={s} size={size} style={{ color: "#d1c4a8" }} />,
    )}
  </span>
);

const formatDate = (d) => !d ? "-" : new Date(d).toLocaleString("en-PK", {
  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
});

/* ── Stat card ───────────────────────────────────────────────── */
const StatCard = ({ label, value, bg, color }) => (
  <div className="rounded-2xl p-5 shadow-sm border" style={{ background: bg, borderColor: color + "30" }}>
    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
    <p className="text-3xl font-extrabold" style={{ color: DK }}>{value ?? 0}</p>
  </div>
);

/* ── Detail modal ────────────────────────────────────────────── */
const DetailModal = ({ item, onClose, onStatusChange }) => {
  const [status,    setStatus]    = useState(item.status);
  const [adminNote, setAdminNote] = useState(item.adminNote || "");
  const [saving,    setSaving]    = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await feedbackService.updateStatus(item._id, { status, adminNote });
      toast.success("Feedback updated.");
      onStatusChange({ ...item, status, adminNote });
      onClose();
    } catch {
      toast.error("Failed to update.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(1,45,29,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#fffdf8", border: `1.5px solid ${ACC}55` }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: DK }}>
          <h3 className="font-extrabold text-lg text-white">Feedback Detail</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <RiCloseLine size={20} color="#fff" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* User + Meta */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-base" style={{ color: DK }}>{item.name}</p>
              <p className="text-xs" style={{ color: "#7a7a7a" }}>{item.email}</p>
            </div>
            <div className="text-right">
              <StarRating rating={item.rating} size={18} />
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: STATUS_COLORS[item.status]?.bg, color: STATUS_COLORS[item.status]?.text }}>
                {STATUS_COLORS[item.status]?.label}
              </span>
            </div>
          </div>

          {/* Category + Date */}
          <div className="flex gap-3 text-xs" style={{ color: "#7a7a7a" }}>
            <span>{CATEGORY_LABELS[item.category] || item.category}</span>
            <span>•</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>

          {/* Message */}
          <div className="rounded-xl p-4" style={{ background: CR, border: "1px solid #e0d8ce" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DK }}>Message</p>
            <p className="text-sm leading-relaxed" style={{ color: "#3d3d3d" }}>{item.message}</p>
          </div>

          {/* Update status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DK }}>
              Update Status
            </label>
            <div className="flex gap-2">
              {Object.entries(STATUS_COLORS).map(([val, { label, bg, text }]) => (
                <button key={val} type="button" onClick={() => setStatus(val)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                  style={{
                    background:  status === val ? DK : bg,
                    color:       status === val ? "#fff" : text,
                    borderColor: status === val ? DK : text + "40",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DK }}>
              Admin Note (optional)
            </label>
            <textarea rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
              maxLength={500}
              placeholder="Add an internal note about this feedback…"
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none transition-all"
              style={{ borderColor: "#e0d8ce", background: "#fff", fontFamily: "inherit" }}
              onFocus={(e) => (e.target.style.borderColor = ACC)}
              onBlur={(e)  => (e.target.style.borderColor = "#e0d8ce")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: "#e0d8ce", color: "#5a5a5a" }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: DK }}>
              {saving ? <RiLoader4Line size={16} className="animate-spin" /> : <><RiCheckLine size={16} /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ───────────────────────────────────────────────── */
const AdminFeedback = () => {
  const [feedbacks,    setFeedbacks]    = useState([]);
  const [stats,        setStats]        = useState(null);
  const [pagination,   setPagination]   = useState({});
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [deleting,     setDeleting]     = useState(null);

  /* filters */
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRating,   setFilterRating]   = useState("");
  const [page,           setPage]           = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterStatus)   params.status   = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterRating)   params.rating   = filterRating;

      const res = await feedbackService.getAll(params);
      setFeedbacks(res.data?.feedbacks || []);
      setStats(res.data?.stats || null);
      setPagination(res.data?.pagination || {});
    } catch {
      toast.error("Failed to load feedback.");
    } finally { setLoading(false); }
  }, [page, filterStatus, filterCategory, filterRating]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback permanently?")) return;
    setDeleting(id);
    try {
      await feedbackService.delete(id);
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
      toast.success("Feedback deleted.");
    } catch {
      toast.error("Failed to delete.");
    } finally { setDeleting(null); }
  };

  const handleStatusChange = (updated) => {
    setFeedbacks((prev) => prev.map((f) => f._id === updated._id ? updated : f));
  };

  const clearFilters = () => {
    setFilterStatus(""); setFilterCategory(""); setFilterRating(""); setPage(1);
  };

  return (
    <RoleDashboardLayout role="admin" activePage="feedback">
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: DK }}>
              <RiChatSmile3Line size={22} color={ACC} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: DK }}>User Feedback</h1>
              <p className="text-sm" style={{ color: "#7a7a7a" }}>
                Review feedback submitted by your users
              </p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50"
            style={{ borderColor: "#e0d8ce", color: DK }}>
            <RiRefreshLine size={16} /> Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard label="Total"     value={stats.total}         bg="#F7F4EF" color={DK} />
            <StatCard label="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) + "★" : "—"} bg="#FFFBEB" color="#92400E" />
            <StatCard label="New"        value={stats.newCount}      bg="#FEF3C7" color="#92400E" />
            <StatCard label="Reviewed"   value={stats.reviewedCount} bg="#EFF6FF" color="#1D4ED8" />
            <StatCard label="Resolved"   value={stats.resolvedCount} bg="#D1FAE5" color="#065F46" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center p-4 rounded-2xl border"
          style={{ background: CR, borderColor: "#e0d8ce" }}>
          <RiFilterLine size={16} style={{ color: DK }} />

          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="text-sm px-3 py-1.5 rounded-xl border outline-none"
            style={{ borderColor: "#e0d8ce", background: "#fff", color: DK }}>
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>

          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="text-sm px-3 py-1.5 rounded-xl border outline-none"
            style={{ borderColor: "#e0d8ce", background: "#fff", color: DK }}>
            <option value="">All Categories</option>
            <option value="general">General Feedback</option>
            <option value="bug_report">Bug Report</option>
            <option value="feature_request">Feature Request</option>
            <option value="other">Other</option>
          </select>

          <select value={filterRating} onChange={(e) => { setFilterRating(e.target.value); setPage(1); }}
            className="text-sm px-3 py-1.5 rounded-xl border outline-none"
            style={{ borderColor: "#e0d8ce", background: "#fff", color: DK }}>
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{"★".repeat(r)} ({r} Star{r > 1 ? "s" : ""})</option>
            ))}
          </select>

          {(filterStatus || filterCategory || filterRating) && (
            <button onClick={clearFilters}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: BTN + "15", color: BTN }}>
              Clear Filters
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RiLoader4Line size={32} className="animate-spin" style={{ color: DK }} />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ borderColor: "#e0d8ce" }}>
            <RiChatSmile3Line size={48} style={{ color: "#d1c4a8", margin: "0 auto 12px" }} />
            <p className="font-semibold text-lg" style={{ color: DK }}>No feedback yet</p>
            <p className="text-sm mt-1" style={{ color: "#9a9a9a" }}>Feedback from users will appear here</p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: "#e0d8ce" }}>
            <table className="w-full text-sm">
              <thead style={{ background: DK }}>
                <tr>
                  {["User", "Rating", "Category", "Message", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: ACC }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f, i) => (
                  <tr key={f._id}
                    className="border-t transition-colors hover:bg-amber-50/30"
                    style={{ borderColor: "#f0ede9", background: i % 2 === 0 ? "#fff" : "#fafaf8" }}>

                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: DK }}>{f.name}</p>
                      <p className="text-xs" style={{ color: "#9a9a9a" }}>{f.email}</p>
                    </td>

                    <td className="px-4 py-3">
                      <StarRating rating={f.rating} />
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs">{CATEGORY_LABELS[f.category] || f.category}</span>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-xs" style={{ color: "#3d3d3d", maxWidth: 180 }}>
                        {f.message}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: STATUS_COLORS[f.status]?.bg,
                          color:      STATUS_COLORS[f.status]?.text,
                        }}>
                        {STATUS_COLORS[f.status]?.label}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#7a7a7a" }}>
                      {formatDate(f.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(f)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-blue-50"
                          title="View & Edit"
                          style={{ color: "#1D4ED8" }}>
                          <RiEyeLine size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(f._id)}
                          disabled={deleting === f._id}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                          style={{ color: "#B91C1C" }}>
                          {deleting === f._id
                            ? <RiLoader4Line size={16} className="animate-spin" />
                            : <RiDeleteBinLine size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: "#e0d8ce", background: CR }}>
                <p className="text-xs" style={{ color: "#7a7a7a" }}>
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} entries
                </p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40 transition-all"
                    style={{ borderColor: "#e0d8ce", color: DK }}>
                    Previous
                  </button>
                  <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40 transition-all"
                    style={{ borderColor: "#e0d8ce", color: DK }}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </RoleDashboardLayout>
  );
};

export default AdminFeedback;
