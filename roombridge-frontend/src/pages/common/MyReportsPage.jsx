import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import reportService from "../../services/reportService";
import {
  RiFlagLine,
  RiLoader4Line,
  RiRefreshLine,
  RiTimeLine,
  RiHome4Line,
  RiUserLine,
} from "react-icons/ri";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewed: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  dismissed: "bg-border text-text-secondary border-border",
};

const REASON_LABEL = {
  spam: "Spam",
  fake: "Fake / Misleading",
  inappropriate: "Inappropriate",
  scam: "Scam / Fraud",
  harassment: "Harassment",
  other: "Other",
};

const MyReportsPage = () => {
  const { user } = useSelector((s) => s.auth);
  const role = user?.role === "owner" ? "owner" : "seeker";

  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const fetchReports = useCallback(
    async (opts = {}) => {
      try {
        setLoading(true);
        const currentPage = opts.page ?? page;
        const currentStatus =
          opts.status !== undefined ? opts.status : statusFilter;

        const res = await reportService.getMyReports({
          page: currentPage,
          limit: LIMIT,
          status: currentStatus || undefined,
        });

        setReports(Array.isArray(res.data) ? res.data : []);
        setTotal(res.pagination?.total ?? 0);
        setPage(currentPage);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <RoleDashboardLayout
      role={role}
      title="My Reports"
      subtitle={`${total} submitted report${total !== 1 ? "s" : ""}`}
      headerAction={
        <button
          onClick={() => fetchReports()}
          className="flex items-center gap-2 text-sm text-secondary border border-secondary/30 px-3 py-1.5 rounded-btn hover:bg-secondary hover:text-white transition-colors"
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-2 mb-5 flex-wrap">
          {["", "pending", "reviewed", "resolved", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                fetchReports({ page: 1, status: s });
              }}
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

        {loading && reports.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiFlagLine className="text-5xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold text-lg">No reports yet</p>
            <p className="text-text-secondary text-sm mt-1">
              When you report a listing or user, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r._id}
                className="bg-white rounded-card border border-border shadow-card p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {REASON_LABEL[r.reason] || r.reason}
                    </p>
                    <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                      <RiTimeLine /> {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_BADGE[r.status] || ""}`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                    Reported Target
                  </p>
                  {r.reportedListing ? (
                    <p className="text-sm text-primary flex items-center gap-1.5">
                      <RiHome4Line className="text-secondary" />
                      {r.reportedListing.title} ({r.reportedListing.city})
                    </p>
                  ) : r.reportedUser ? (
                    <p className="text-sm text-primary flex items-center gap-1.5">
                      <RiUserLine className="text-secondary" />
                      {r.reportedUser.name} ({r.reportedUser.email})
                    </p>
                  ) : (
                    <p className="text-sm text-text-secondary italic">
                      Target removed.
                    </p>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                    Description
                  </p>
                  <p className="text-sm text-primary bg-background border border-border rounded-input p-3">
                    {r.description}
                  </p>
                </div>

                {r.adminNote && (
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                      Admin Note
                    </p>
                    <p className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-input p-3">
                      {r.adminNote}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-text-secondary">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchReports({ page: page - 1 })}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary hover:text-primary disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => fetchReports({ page: page + 1 })}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary hover:text-primary disabled:opacity-40"
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

export default MyReportsPage;
