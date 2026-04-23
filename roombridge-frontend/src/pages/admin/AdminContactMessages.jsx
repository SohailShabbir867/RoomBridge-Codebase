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

const STATUS_STYLES = {
  new: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
};

const STATUS_LABEL = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getContactMessages({
        search: search || undefined,
        status: statusFilter || undefined,
        page: 1,
        limit: 100,
      });

      const items = Array.isArray(res.data) ? res.data : [];
      setMessages(items);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load contact messages.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      await adminService.updateContactMessageStatus(id, { status });
      setMessages((prev) =>
        prev.map((m) =>
          m._id === id
            ? {
                ...m,
                status,
                resolvedAt: status === "resolved" ? new Date().toISOString() : null,
              }
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
    const ok = window.confirm(
      "Delete this contact message permanently? This action cannot be undone.",
    );
    if (!ok) return;

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
      subtitle="See all website contact form submissions"
      headerAction={
        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 text-sm text-secondary border border-secondary/30 px-3 py-1.5 rounded-btn hover:bg-secondary hover:text-white transition-colors"
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-card border border-border shadow-card p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, subject..."
                className="input pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
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
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiMailOpenLine className="text-5xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold text-lg">No contact messages</p>
            <p className="text-text-secondary text-sm">
              No user has submitted a contact form yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m._id}
                className="bg-white rounded-card border border-border shadow-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">{m.subject}</p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {m.name} · {m.email}
                    </p>
                    <p className="text-xs text-text-secondary mt-1 inline-flex items-center gap-1">
                      <RiTimeLine /> {formatDate(m.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`text-xs border px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[m.status] || "bg-border text-text-secondary border-border"}`}
                  >
                    {STATUS_LABEL[m.status] || m.status}
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-background border border-border">
                  <p className="text-sm text-primary whitespace-pre-wrap">{m.message}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(m._id, "new")}
                    disabled={updatingId === m._id}
                    className="btn-secondary text-xs"
                  >
                    Mark New
                  </button>
                  <button
                    onClick={() => updateStatus(m._id, "in_progress")}
                    disabled={updatingId === m._id}
                    className="btn-secondary text-xs"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateStatus(m._id, "resolved")}
                    disabled={updatingId === m._id}
                    className="btn-primary text-xs gap-1"
                  >
                    {updatingId === m._id ? (
                      <RiLoader4Line className="animate-spin" />
                    ) : (
                      <RiCheckLine />
                    )}
                    Resolve
                  </button>
                  <button
                    onClick={() => deleteMessage(m._id)}
                    disabled={deletingId === m._id}
                    className="text-xs px-3 py-1.5 rounded-btn border border-error/20 text-error
                               bg-error/10 hover:bg-error hover:text-white transition-colors
                               inline-flex items-center gap-1 disabled:opacity-60"
                  >
                    {deletingId === m._id ? (
                      <RiLoader4Line className="animate-spin" />
                    ) : (
                      <RiDeleteBinLine />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default AdminContactMessages;
