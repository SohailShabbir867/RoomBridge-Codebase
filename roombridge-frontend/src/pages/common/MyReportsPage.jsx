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
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiFeedbackLine,
} from "react-icons/ri";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  pending: "bg-amber-50 text-amber-700 border-amber-200/60",
  reviewed: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  dismissed: "bg-gray-50 text-gray-500 border-gray-200/60",
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
    [page, statusFilter]
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
          className="flex items-center gap-1.5 text-xs font-bold text-[#012D1D] bg-[#F9F7F2] border border-gray-200 px-4 py-2 rounded-2xl hover:border-[#012D1D] hover:bg-white transition-all active:scale-95"
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Status Filter Pills */}
        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
          {["", "pending", "reviewed", "resolved", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                fetchReports({ page: 1, status: s });
              }}
              className={`px-4 py-2 rounded-full text-xs font-extrabold capitalize transition-all border whitespace-nowrap active:scale-95 cursor-pointer ${
                statusFilter === s
                  ? "bg-[#012D1D] text-white border-[#012D1D] shadow-[0_4px_12px_rgba(1,45,29,0.15)]"
                  : "bg-white border-gray-200 text-gray-400 hover:text-[#012D1D] hover:border-[#012D1D]/30"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {loading && reports.length === 0 ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <RiLoader4Line className="animate-spin text-4xl text-[#012D1D] mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading reports…</p>
          </div>
        ) : reports.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <RiFlagLine className="text-3xl text-gray-300" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#012D1D]">No Reports Found</h3>
            <p className="text-xs text-gray-500 font-semibold max-w-xs mx-auto mt-2 leading-relaxed">
              When you report a listing or user, it will appear here with the administrator's review updates.
            </p>
          </div>
        ) : (
          /* Report List */
          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r._id}
                className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-300 space-y-5"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 border-b border-gray-50 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#012D1D]">
                      {REASON_LABEL[r.reason] || r.reason}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                      <RiTimeLine className="text-sm" /> {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_BADGE[r.status] || ""}`}
                  >
                    {r.status}
                  </span>
                </div>

                {/* Target Information */}
                <div className="bg-[#F9F7F2]/60 rounded-2xl p-4 border border-gray-50/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                      Reported Target
                    </span>
                    {r.reportedListing ? (
                      <p className="text-xs font-bold text-[#012D1D] flex items-center gap-2">
                        <RiHome4Line className="text-base text-[#8E4E14]" />
                        <span className="truncate">{r.reportedListing.title} ({r.reportedListing.city})</span>
                      </p>
                    ) : r.reportedUser ? (
                      <p className="text-xs font-bold text-[#012D1D] flex items-center gap-2">
                        <RiUserLine className="text-base text-[#8E4E14]" />
                        <span className="truncate">{r.reportedUser.name} ({r.reportedUser.email})</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Target has been removed.</p>
                    )}
                  </div>

                  <div>
                    <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                      Report Category
                    </span>
                    <p className="text-xs font-bold text-[#012D1D] flex items-center gap-2">
                      <RiFileTextLine className="text-base text-[#8E4E14]" />
                      <span className="capitalize">{r.targetType || "Listing"} Report</span>
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                    Your Description
                  </span>
                  <p className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-4 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                {/* Admin Response Note */}
                {r.adminNote && (
                  <div className="bg-emerald-50/40 border border-emerald-100/70 rounded-2xl p-4 space-y-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">
                      <RiFeedbackLine className="text-sm" /> Admin Feedback
                    </span>
                    <p className="text-xs font-bold text-emerald-900 leading-relaxed">
                      {r.adminNote}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchReports({ page: page - 1 })}
                    disabled={page <= 1 || loading}
                    className="px-4 py-2 rounded-2xl text-xs font-extrabold border border-gray-200 bg-white text-[#012D1D] hover:border-[#012D1D] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => fetchReports({ page: page + 1 })}
                    disabled={page >= totalPages || loading}
                    className="px-4 py-2 rounded-2xl text-xs font-extrabold border border-gray-200 bg-white text-[#012D1D] hover:border-[#012D1D] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
