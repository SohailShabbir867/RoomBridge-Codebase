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
  RiCloseLine,
  RiRefreshLine,
  RiTimeLine,
  RiEyeLine,
  RiExternalLinkLine,
  RiDeleteBinLine,
} from "react-icons/ri";

document.title = "Reports — RoomBridge Admin";

/* ── Status badge styles ─────────────────────────────────── */
const STATUS_BADGE = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewed: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  dismissed: "bg-border text-text-secondary border-border",
};

/* ── Reason label map (matches Report.model.js enum) ─────── */
const REASON_LABELS = {
  spam: "Spam",
  fake: "Fake",
  inappropriate: "Inappropriate",
  scam: "Scam",
  harassment: "Harassment",
  other: "Other",
};

/* ── Avatar helper ───────────────────────────────────────── */
const Avatar = ({ user, size = "sm" }) => {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (!user)
    return (
      <div
        className={`${sz} rounded-full bg-border flex items-center justify-center shrink-0`}
      >
        <RiUserLine className="text-text-secondary text-sm" />
      </div>
    );
  return user.profilePhoto?.url ? (
    <img
      src={user.profilePhoto.url}
      alt={user.name}
      className={`${sz} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div
      className={`${sz} rounded-full bg-primary flex items-center justify-center shrink-0`}
    >
      <span className="text-white font-bold">
        {(user.name || "?")[0].toUpperCase()}
      </span>
    </div>
  );
};

/* ── Action modal ────────────────────────────────────────── */
const ActionModal = ({ report, onClose, onSubmit, updating }) => {
  const [status, setStatus] = useState("resolved");
  const [adminNote, setAdminNote] = useState(report.adminNote || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-hover w-full max-w-lg p-6">
        <h3 className="font-bold text-primary text-lg mb-1">Update Report</h3>
        <p className="text-text-secondary text-sm mb-5">
          Reporter: <strong>{report.reporter?.name}</strong> · Reason:{" "}
          <strong>{REASON_LABELS[report.reason] || report.reason}</strong>
        </p>

        <div className="mb-4">
          <label className="label">Action *</label>
          <div className="flex gap-2">
            {["reviewed", "resolved", "dismissed"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-btn text-sm font-medium capitalize border transition-all
                                  ${
                                    status === s
                                      ? s === "resolved"
                                        ? "bg-success text-white border-success"
                                        : s === "reviewed"
                                          ? "bg-primary text-white border-primary"
                                          : "bg-border text-text-secondary border-border"
                                      : "bg-white border-border text-text-secondary hover:text-primary"
                                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="label">Admin Note (optional)</label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
            placeholder="Internal note or action taken…"
            className="input resize-none"
            maxLength={500}
          />
          <p className="text-xs text-text-secondary text-right mt-0.5">
            {adminNote.length}/500
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ status, adminNote })}
            disabled={updating}
            className="btn-primary flex-1 justify-center gap-2"
          >
            {updating ? (
              <RiLoader4Line className="animate-spin" />
            ) : (
              <RiCheckLine />
            )}
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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [expandedId, setExpandedId] = useState(null); // expanded report row
  const LIMIT = 20;

  const fetchReports = useCallback(
    async (opts = {}) => {
      try {
        setLoading(true);
        const params = {
          page: opts.page ?? page,
          limit: LIMIT,
          status: opts.status !== undefined ? opts.status : statusFilter,
        };
        const res = await adminService.getReports(params);
        /*
        Backend paginatedResponse:
        { success, message, data: [...reports], pagination: { currentPage, totalPages, total } }
      */
        const items = res.data ?? res.reports ?? [];
        setReports(Array.isArray(items) ? items : []);
        setTotal(res.pagination?.total ?? res.total ?? 0);
        setPage(opts.page ?? page);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter],
  );

  useEffect(() => {
    fetchReports();
  }, []); // eslint-disable-line

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchReports({ page: 1, status });
  };

  /* Resolve / Dismiss / Review */
  const handleAction = async ({ status, adminNote }) => {
    if (!selectedReport) return;
    try {
      setUpdating(true);
      await adminService.resolveReport(selectedReport._id, {
        status,
        adminNote,
      });
      setReports((rs) =>
        rs.map((r) =>
          r._id === selectedReport._id
            ? { ...r, status, adminNote, resolvedAt: new Date().toISOString() }
            : r,
        ),
      );
      toast.success(`Report ${status}.`);
      setSelectedReport(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update report.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    const ok = window.confirm(
      "Delete this report permanently? This action cannot be undone.",
    );
    if (!ok) return;

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

  const totalPages = Math.ceil(total / LIMIT);

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  const getTargetLink = (report) => {
    if (report?.reportedUser) {
      const q = report.reportedUser.email || report.reportedUser.name || "";
      return `/admin/users?search=${encodeURIComponent(q)}`;
    }
    if (report?.reportedListing) {
      const q = report.reportedListing.title || "";
      return `/admin/listings?search=${encodeURIComponent(q)}`;
    }
    return null;
  };

  return (
    <RoleDashboardLayout
      role="admin"
      title="User Reports"
      subtitle={`${total} total · ${pendingCount} pending action`}
      headerAction={
        <button
          onClick={() => fetchReports()}
          className="flex items-center gap-2 text-sm text-secondary border border-secondary/30 px-3 py-1.5 rounded-btn hover:bg-secondary hover:text-white transition-colors"
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-6xl mx-auto">
        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["", "pending", "reviewed", "resolved", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                                ${
                                  statusFilter === s
                                    ? "bg-primary text-white shadow-card"
                                    : "bg-white border border-border text-text-secondary hover:text-primary"
                                }`}
            >
              {s || "All"}
              {s === "pending" && pendingCount > 0 && (
                <span className="ml-1 bg-error text-white text-[10px] px-1.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && reports.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiFlagLine className="text-5xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold text-lg">
              No reports found
            </p>
            <p className="text-text-secondary text-sm">
              {statusFilter
                ? `No ${statusFilter} reports.`
                : "No reports have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_120px_100px_120px] gap-0 border-b border-border bg-background px-4 py-3">
              <div className="text-xs font-semibold text-text-secondary uppercase">
                Reporter
              </div>
              <div className="text-xs font-semibold text-text-secondary uppercase">
                Reported
              </div>
              <div className="text-xs font-semibold text-text-secondary uppercase">
                Reason
              </div>
              <div className="text-xs font-semibold text-text-secondary uppercase">
                Status
              </div>
              <div className="text-xs font-semibold text-text-secondary uppercase text-right">
                Actions
              </div>
            </div>

            <div className="divide-y divide-border">
              {reports.map((r) => {
                const isExpanded = expandedId === r._id;
                const canAct =
                  r.status !== "resolved" && r.status !== "dismissed";
                const targetLink = getTargetLink(r);
                return (
                  <div
                    key={r._id}
                    className="hover:bg-background/30 transition-colors"
                  >
                    {/* Main row */}
                    <div className="grid grid-cols-[1fr_1fr_120px_100px_120px] gap-0 items-center px-4 py-4">
                      {/* Reporter */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar user={r.reporter} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {r.reporter?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {r.reporter?.email}
                          </p>
                        </div>
                      </div>

                      {/* Reported User or Listing */}
                      <div className="flex items-center gap-2 min-w-0">
                        {r.reportedUser ? (
                          <>
                            <Avatar user={r.reportedUser} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-primary truncate">
                                {r.reportedUser.name}
                              </p>
                              <p className="text-xs text-text-secondary">
                                User
                              </p>
                            </div>
                          </>
                        ) : r.reportedListing ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center shrink-0">
                              <RiHome4Line className="text-primary text-sm" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-primary truncate">
                                {r.reportedListing.title}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {r.reportedListing.city} · PKR{" "}
                                {(r.reportedListing.rent || 0).toLocaleString()}
                              </p>
                              {r.reportedListing.owner?.name && (
                                <p className="text-xs text-text-secondary truncate">
                                  Owner: {r.reportedListing.owner.name}
                                  {r.reportedListing.owner?.email
                                    ? ` (${r.reportedListing.owner.email})`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-text-secondary text-sm italic">
                            —
                          </span>
                        )}
                      </div>

                      {/* Reason */}
                      <div className="text-sm text-primary">
                        {REASON_LABELS[r.reason] || r.reason || "—"}
                      </div>

                      {/* Status */}
                      <div>
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize
                                          ${STATUS_BADGE[r.status] || ""}`}
                        >
                          {r.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1.5">
                        {targetLink && (
                          <Link
                            to={targetLink}
                            title="Open target profile"
                            className="flex items-center gap-1 px-2 py-1.5 rounded-btn text-xs
                                       border border-border text-text-secondary hover:text-primary hover:bg-background
                                       transition-colors"
                          >
                            <RiExternalLinkLine className="text-sm" /> Target
                          </Link>
                        )}
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : r._id)
                          }
                          title="View details"
                          className="p-1.5 rounded text-text-secondary hover:text-primary hover:bg-background
                                     border border-border transition-colors"
                        >
                          <RiEyeLine className="text-sm" />
                        </button>
                        {canAct && (
                          <button
                            onClick={() => setSelectedReport(r)}
                            title="Take action"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn text-xs
                                       bg-primary text-white hover:bg-secondary transition-colors"
                          >
                            Act
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReport(r._id)}
                          disabled={deletingId === r._id}
                          title="Delete report"
                          className="flex items-center gap-1 px-2 py-1.5 rounded-btn text-xs
                                       bg-error/10 text-error border border-error/20
                                       hover:bg-error hover:text-white transition-colors disabled:opacity-60"
                        >
                          {deletingId === r._id ? (
                            <RiLoader4Line className="animate-spin text-sm" />
                          ) : (
                            <RiDeleteBinLine className="text-sm" />
                          )}
                          Delete
                        </button>
                        {!canAct && (
                          <span className="text-xs text-text-secondary italic capitalize">
                            {r.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-background/50 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                          {/* Description */}
                          <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                              Report Description
                            </p>
                            <p className="text-sm text-primary bg-white border border-border rounded-input p-3">
                              {r.description || (
                                <span className="italic text-text-secondary">
                                  No description provided.
                                </span>
                              )}
                            </p>
                          </div>
                          {/* Meta */}
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                                Timeline
                              </p>
                              <p className="text-xs text-text-secondary flex items-center gap-1">
                                <RiTimeLine /> Reported:{" "}
                                {new Date(r.createdAt).toLocaleString()}
                              </p>
                              {r.resolvedAt && (
                                <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                                  <RiCheckLine className="text-success" />
                                  Resolved:{" "}
                                  {new Date(r.resolvedAt).toLocaleString()}
                                  {r.resolvedBy && ` by ${r.resolvedBy.name}`}
                                </p>
                              )}
                            </div>
                            {r.adminNote && (
                              <div>
                                <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                                  Admin Note
                                </p>
                                <p className="text-sm text-primary bg-white border border-border rounded-input p-3">
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background/50">
                <p className="text-xs text-text-secondary">
                  Page {page} of {totalPages} · {total} reports
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchReports({ page: page - 1 })}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary
                                     hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => fetchReports({ page: page + 1 })}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary
                                     hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
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
