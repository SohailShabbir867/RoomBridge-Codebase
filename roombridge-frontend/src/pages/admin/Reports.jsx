import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import adminService from "../../services/adminService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiFlagLine,
  RiLoader4Line,
  RiUserLine,
  RiHome4Line,
  RiCheckLine,
  RiRefreshLine,
  RiTimeLine,
  RiEyeLine,
  RiExternalLinkLine,
  RiDeleteBinLine,
} from "react-icons/ri";

document.title = "Reports — RoomBridge Admin";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

/* ── Status colours ─────────────────────────────────────────── */
const STATUS_COLORS = {
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  reviewed:  { bg: "#EFF6FF", text: "#1D4ED8" },
  resolved:  { bg: "#D1FAE5", text: "#065F46" },
  dismissed: { bg: "#F3F4F6", text: "#6B7280" },
};

const REASON_LABELS = {
  spam: "Spam", fake: "Fake", inappropriate: "Inappropriate",
  scam: "Scam", harassment: "Harassment", other: "Other",
};

/* ── Avatar ─────────────────────────────────────────────────── */
const Avatar = ({ user }) => {
  if (!user) return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: CR }}>
      <RiUserLine style={{ color: DK }} className="text-sm" />
    </div>
  );
  return user.profilePhoto?.url ? (
    <img src={user.profilePhoto.url} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-white"
      style={{ backgroundColor: DK }}>
      {(user.name || "?")[0].toUpperCase()}
    </div>
  );
};

/* ── Pill filter ─────────────────────────────────────────────── */
const FilterPill = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className="px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all border flex items-center gap-1.5"
    style={{
      backgroundColor: active ? DK     : "#FFF",
      color:           active ? "#FFF" : "#6B7280",
      borderColor:     active ? DK     : "#E8E2D9",
    }}
  >
    {label}
    {badge > 0 && (
      <span className="text-[10px] font-black px-1.5 rounded-full leading-none py-0.5"
        style={{ backgroundColor: "#DC2626", color: "#fff" }}>
        {badge}
      </span>
    )}
  </button>
);

/* ── Action btn ──────────────────────────────────────────────── */
const ActionBtn = ({ onClick, disabled, color, bg, children, title }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60"
    style={{ backgroundColor: bg || `${color}15`, color, borderColor: `${color}30` }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color; e.currentTarget.style.color = "#fff"; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bg || `${color}15`; e.currentTarget.style.color = color; }}>
    {children}
  </button>
);

/* ── Action modal ────────────────────────────────────────────── */
const ActionModal = ({ report, onClose, onSubmit, updating }) => {
  const [status, setStatus]     = useState("resolved");
  const [adminNote, setAdminNote] = useState(report.adminNote || "");

  const STATUS_OPTS = [
    { val: "reviewed",  bg: "#EFF6FF", color: "#1D4ED8" },
    { val: "resolved",  bg: "#D1FAE5", color: "#065F46" },
    { val: "dismissed", bg: "#F3F4F6", color: "#6B7280" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 className="font-extrabold text-lg mb-1" style={{ color: DK }}>Update Report</h3>
        <p className="text-gray-400 text-sm mb-5">
          Reporter: <strong>{report.reporter?.name}</strong> · Reason:{" "}
          <strong>{REASON_LABELS[report.reason] || report.reason}</strong>
        </p>

        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Action *</label>
          <div className="flex gap-2">
            {STATUS_OPTS.map(({ val, bg, color }) => (
              <button key={val} type="button" onClick={() => setStatus(val)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border"
                style={{
                  backgroundColor: status === val ? color : "#FFF",
                  color:           status === val ? "#fff" : "#6B7280",
                  borderColor:     status === val ? color : "#E8E2D9",
                }}>
                {val}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Admin Note (optional)</label>
          <textarea
            value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
            rows={3} placeholder="Internal note or action taken…" maxLength={500}
            className="w-full rounded-xl py-3 px-4 text-sm border outline-none resize-none focus:ring-2"
            style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}
          />
          <p className="text-xs text-gray-400 text-right mt-0.5">{adminNote.length}/500</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E8E2D9" }}>Cancel</button>
          <button onClick={() => onSubmit({ status, adminNote })} disabled={updating}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all"
            style={{ backgroundColor: DK }}>
            {updating ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   REPORTS PAGE
════════════════════════════════════════════════════════════ */
const Reports = () => {
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [updating, setUpdating]       = useState(false);
  const [deletingId, setDeletingId]   = useState("");
  const [expandedId, setExpandedId]   = useState(null);
  const LIMIT = 20;

  const fetchReports = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const params = {
        page: opts.page ?? page, limit: LIMIT,
        status: opts.status !== undefined ? opts.status : statusFilter,
      };
      const res   = await adminService.getReports(params);
      const items = res.data ?? res.reports ?? [];
      setReports(Array.isArray(items) ? items : []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
      setPage(opts.page ?? page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchReports(); }, []); // eslint-disable-line

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchReports({ page: 1, status });
  };

  const handleAction = async ({ status, adminNote }) => {
    if (!selectedReport) return;
    try {
      setUpdating(true);
      await adminService.resolveReport(selectedReport._id, { status, adminNote });
      setReports((rs) => rs.map((r) => r._id === selectedReport._id
        ? { ...r, status, adminNote, resolvedAt: new Date().toISOString() } : r));
      toast.success(`Report ${status}.`);
      setSelectedReport(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update report.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Delete this report permanently?")) return;
    try {
      setDeletingId(reportId);
      await adminService.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      setTotal((prev) => Math.max(0, prev - 1));
      if (expandedId === reportId) setExpandedId(null);
      if (selectedReport?._id === reportId) setSelectedReport(null);
      toast.success("Report deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete report.");
    } finally {
      setDeletingId("");
    }
  };

  const totalPages   = Math.ceil(total / LIMIT);
  const pendingCount = reports.filter((r) => r.status === "pending").length;

  const getTargetLink = (report) => {
    if (report?.reportedUser) return `/admin/users?search=${encodeURIComponent(report.reportedUser.email || report.reportedUser.name || "")}`;
    if (report?.reportedListing) return `/admin/listings?search=${encodeURIComponent(report.reportedListing.title || "")}`;
    return null;
  };

  return (
    <RoleDashboardLayout
      role="admin"
      title="User Reports"
      subtitle={`${total} total · ${pendingCount} pending action`}
      headerAction={
        <button onClick={() => fetchReports()}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all"
          style={{ backgroundColor: BTN }}>
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-6xl mx-auto">
        {/* Filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["", "pending", "reviewed", "resolved", "dismissed"].map((s) => (
            <FilterPill key={s} label={s || "All"}
              active={statusFilter === s}
              onClick={() => handleStatusFilter(s)}
              badge={s === "pending" ? pendingCount : 0}
            />
          ))}
        </div>

        {loading && reports.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#E8E2D9" }}>
            <RiFlagLine className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-lg" style={{ color: DK }}>No reports found</p>
            <p className="text-gray-400 text-sm mt-1">
              {statusFilter ? `No ${statusFilter} reports.` : "No reports have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
            {/* Table header */}
            <div
              className="grid gap-0 border-b px-4 py-3"
              style={{
                gridTemplateColumns: "1fr 1fr 110px 100px 160px",
                backgroundColor: CR, borderColor: "#E8E2D9",
              }}
            >
              {["Reporter", "Reported", "Reason", "Status", "Actions"].map((h, i) => (
                <div key={h} className={`text-[10px] font-black uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}
                  style={{ color: `${DK}70` }}>
                  {h}
                </div>
              ))}
            </div>

            <div className="divide-y" style={{ borderColor: "#F3EFE9" }}>
              {reports.map((r) => {
                const isExpanded = expandedId === r._id;
                const canAct     = r.status !== "resolved" && r.status !== "dismissed";
                const targetLink = getTargetLink(r);
                const sc         = STATUS_COLORS[r.status] || STATUS_COLORS.dismissed;
                return (
                  <div key={r._id} className="transition-colors hover:bg-[#F7F4EF]">
                    {/* Main row */}
                    <div className="grid items-center px-4 py-4 gap-0"
                      style={{ gridTemplateColumns: "1fr 1fr 110px 100px 160px" }}>

                      {/* Reporter */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar user={r.reporter} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: DK }}>{r.reporter?.name || "Unknown"}</p>
                          <p className="text-[10px] text-gray-400 truncate">{r.reporter?.email}</p>
                        </div>
                      </div>

                      {/* Reported target */}
                      <div className="flex items-center gap-2 min-w-0">
                        {r.reportedUser ? (
                          <>
                            <Avatar user={r.reportedUser} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: DK }}>{r.reportedUser.name}</p>
                              <p className="text-[10px] text-gray-400">User</p>
                            </div>
                          </>
                        ) : r.reportedListing ? (
                          <>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: CR }}>
                              <RiHome4Line className="text-sm" style={{ color: DK }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: DK }}>{r.reportedListing.title}</p>
                              <p className="text-[10px] text-gray-400">{r.reportedListing.city}</p>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-300 text-sm italic">—</span>
                        )}
                      </div>

                      {/* Reason */}
                      <div className="text-xs font-semibold" style={{ color: DK }}>
                        {REASON_LABELS[r.reason] || r.reason || "—"}
                      </div>

                      {/* Status */}
                      <div>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: sc.bg, color: sc.text }}>
                          {r.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1.5">
                        {targetLink && (
                          <Link to={targetLink} title="Open target"
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-all"
                            style={{ borderColor: "#E8E2D9", color: DK }}>
                            <RiExternalLinkLine className="text-sm" /> Target
                          </Link>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : r._id)}
                          title="View details"
                          className="p-1.5 rounded-xl border transition-colors hover:opacity-80"
                          style={{ borderColor: "#E8E2D9", color: DK }}
                        >
                          <RiEyeLine className="text-sm" />
                        </button>
                        {canAct && (
                          <ActionBtn onClick={() => setSelectedReport(r)} color={DK} title="Take action">
                            Act
                          </ActionBtn>
                        )}
                        <ActionBtn
                          onClick={() => handleDeleteReport(r._id)}
                          disabled={deletingId === r._id}
                          color="#DC2626" title="Delete report"
                        >
                          {deletingId === r._id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                          Del
                        </ActionBtn>
                        {!canAct && (
                          <span className="text-[10px] text-gray-400 italic capitalize">{r.status}</span>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t" style={{ backgroundColor: `${CR}70`, borderColor: "#F3EFE9" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Report Description</p>
                            <p className="text-sm bg-white rounded-xl border p-3" style={{ color: DK, borderColor: "#E8E2D9" }}>
                              {r.description || <span className="italic text-gray-400">No description provided.</span>}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Timeline</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <RiTimeLine style={{ color: ACC }} /> Reported: {new Date(r.createdAt).toLocaleString()}
                              </p>
                              {r.resolvedAt && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <RiCheckLine className="text-green-500" />
                                  Resolved: {new Date(r.resolvedAt).toLocaleString()}
                                  {r.resolvedBy && ` by ${r.resolvedBy.name}`}
                                </p>
                              )}
                            </div>
                            {r.adminNote && (
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Admin Note</p>
                                <p className="text-sm bg-white rounded-xl border p-3" style={{ color: DK, borderColor: "#E8E2D9" }}>
                                  {r.adminNote}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#F3EFE9", backgroundColor: CR }}>
                <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} reports</p>
                <div className="flex gap-2">
                  {[{ label: "← Prev", pg: page - 1, dis: page <= 1 }, { label: "Next →", pg: page + 1, dis: page >= totalPages }]
                    .map(({ label, pg, dis }) => (
                      <button key={label} onClick={() => fetchReports({ page: pg })} disabled={dis || loading}
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

      {/* Action modal */}
      {selectedReport && (
        <ActionModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onSubmit={handleAction}
          updating={updating}
        />
      )}
    </RoleDashboardLayout>
  );
};

export default Reports;
