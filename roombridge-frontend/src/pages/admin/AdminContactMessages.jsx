import React, { useCallback, useEffect, useState } from "react";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import adminService from "../../services/adminService";
import toast from "react-hot-toast";
import {
  RiMailOpenLine,
  RiLoader4Line,
  RiRefreshLine,
  RiSearchLine,
  RiCheckLine,
  RiTimeLine,
  RiDeleteBinLine,
} from "react-icons/ri";

document.title = "Contact Messages — RoomBridge Admin";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

const STATUS_COLORS = {
  new:         { bg: "#FEF3C7", text: "#92400E" },
  in_progress: { bg: "#EFF6FF", text: "#1D4ED8" },
  resolved:    { bg: "#D1FAE5", text: "#065F46" },
};
const STATUS_LABEL = { new: "New", in_progress: "In Progress", resolved: "Resolved" };

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-PK", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

/* ── Status action button ────────────────────────────────────── */
const ActionBtn = ({ onClick, disabled, color, bg, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border
               transition-all disabled:opacity-60"
    style={{ backgroundColor: bg, color, borderColor: `${color}30` }}
  >
    {children}
  </button>
);

const AdminContactMessages = () => {
  const [messages, setMessages]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getContactMessages({
        search: search || undefined,
        status: statusFilter || undefined,
        page: 1, limit: 100,
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load contact messages.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      await adminService.updateContactMessageStatus(id, { status });
      setMessages((prev) =>
        prev.map((m) =>
          m._id === id
            ? { ...m, status, resolvedAt: status === "resolved" ? new Date().toISOString() : null }
            : m,
        ),
      );
      toast.success("Message status updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingId("");
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this contact message permanently?")) return;
    try {
      setDeletingId(id);
      await adminService.deleteContactMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      toast.success("Contact message deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete message.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <RoleDashboardLayout
      role="admin"
      title="Contact Messages"
      subtitle="Website contact form submissions"
      headerAction={
        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all"
          style={{ backgroundColor: BTN }}
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-4xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 mb-5" style={{ borderColor: "#E8E2D9" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, subject..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none focus:ring-2 transition-all"
                style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2.5 px-3 text-sm rounded-xl border outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: CR, borderColor: "#E8E2D9", color: DK }}
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#E8E2D9" }}>
            <RiMailOpenLine className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-lg" style={{ color: DK }}>No contact messages</p>
            <p className="text-gray-400 text-sm">No user has submitted a contact form yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const sc = STATUS_COLORS[m.status] || STATUS_COLORS.new;
              return (
                <div
                  key={m._id}
                  className="bg-white rounded-2xl border shadow-sm p-5"
                  style={{ borderColor: "#E8E2D9" }}
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: DK }}>{m.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{m.name} · {m.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <RiTimeLine style={{ color: ACC }} /> {formatDate(m.createdAt)}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                    >
                      {STATUS_LABEL[m.status] || m.status}
                    </span>
                  </div>

                  {/* Message body */}
                  <div className="rounded-xl p-3 border mb-4" style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: DK }}>{m.message}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <ActionBtn
                      onClick={() => updateStatus(m._id, "new")}
                      disabled={updatingId === m._id}
                      color="#92400E" bg="#FEF3C7"
                    >
                      Mark New
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => updateStatus(m._id, "in_progress")}
                      disabled={updatingId === m._id}
                      color="#1D4ED8" bg="#EFF6FF"
                    >
                      In Progress
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => updateStatus(m._id, "resolved")}
                      disabled={updatingId === m._id}
                      color="#065F46" bg="#D1FAE5"
                    >
                      {updatingId === m._id
                        ? <RiLoader4Line className="animate-spin" />
                        : <RiCheckLine />}
                      Resolve
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => deleteMessage(m._id)}
                      disabled={deletingId === m._id}
                      color="#DC2626" bg="#FEE2E2"
                    >
                      {deletingId === m._id
                        ? <RiLoader4Line className="animate-spin" />
                        : <RiDeleteBinLine />}
                      Delete
                    </ActionBtn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default AdminContactMessages;
