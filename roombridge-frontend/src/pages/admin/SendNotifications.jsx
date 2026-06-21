import React, { useCallback, useEffect, useRef, useState } from "react";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import adminService from "../../services/adminService";
import toast from "react-hot-toast";
import {
  RiBroadcastLine,
  RiToolsLine,
  RiAlertLine,
  RiLoader4Line,
  RiCheckLine,
  RiMailSendLine,
  RiGroupLine,
  RiUserLine,
  RiHome4Line,
  RiShieldCheckLine,
} from "react-icons/ri";

document.title = "Send Notifications — RoomBridge Admin";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

/* ── Tabs config ─────────────────────────────────────────────── */
const TABS = [
  { id: "general",     label: "General Notification", icon: RiBroadcastLine,  accent: DK     },
  { id: "maintenance", label: "Maintenance Notice",   icon: RiToolsLine,      accent: "#D97706" },
  { id: "error",       label: "Error Alert",          icon: RiAlertLine,      accent: "#DC2626" },
];

/* ── Recipient cards ─────────────────────────────────────────── */
const RECIPIENT_OPTS = [
  { value: "all",    label: "All Users",      desc: "Seekers + Owners + Admins", icon: RiGroupLine      },
  { value: "users",  label: "Seekers Only",   desc: "Room seekers",              icon: RiUserLine       },
  { value: "owners", label: "Owners Only",    desc: "Property owners",           icon: RiHome4Line      },
  { value: "admins", label: "Admins Only",    desc: "Admin team",                icon: RiShieldCheckLine},
  { value: "single", label: "Single User",    desc: "One specific user",         icon: RiUserLine       },
];

const SEVERITY_OPTS = ["low", "medium", "high", "critical"];
const SEVERITY_COLORS = {
  low:      { bg: "#F3F4F6", text: "#6B7280" },
  medium:   { bg: "#FEF3C7", text: "#92400E" },
  high:     { bg: "#FEE2E2", text: "#DC2626" },
  critical: { bg: "#F3E8FF", text: "#7C3AED" },
};

/* ── Shared input styles ─────────────────────────────────────── */
const inputCls =
  "w-full rounded-xl py-3 px-4 text-sm border outline-none focus:ring-2 transition-all";
const inputStyle = { backgroundColor: CR, borderColor: "#E8E2D9" };
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5";

/* ── Result banner ───────────────────────────────────────────── */
const ResultBanner = ({ result, onClose }) => {
  if (!result) return null;
  const isOk = result.type === "success";
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-2xl border mb-5 animate-fade-in"
      style={{
        backgroundColor: isOk ? "#D1FAE5" : "#FEE2E2",
        borderColor:     isOk ? "#6EE7B7" : "#FECACA",
      }}
    >
      <div className="mt-0.5">
        {isOk
          ? <RiCheckLine className="text-green-600 text-lg" />
          : <RiAlertLine className="text-red-500 text-lg" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: isOk ? "#065F46" : "#991B1B" }}>
          {result.message}
        </p>
        {result.details?.failed > 0 && (
          <p className="text-xs mt-0.5 text-gray-500">
            {result.details.failed} email(s) failed to deliver.
          </p>
        )}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
const SendNotifications = () => {
  const [activeTab, setActiveTab]       = useState("general");
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState(null);
  const [recipientCount, setRecipientCount] = useState(0);
  const [countLoading, setCountLoading] = useState(false);
  const [users, setUsers]               = useState([]);
  const [userSearch, setUserSearch]     = useState("");

  /* Form states */
  const [generalForm, setGeneralForm] = useState({
    subject: "", message: "", recipientType: "all", specificUserId: "",
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    startTime: "", endTime: "", reason: "", affectedServices: "",
  });
  const [errorForm, setErrorForm] = useState({
    errorType: "", description: "", severity: "medium", affectedFeatures: "",
  });

  /* ── Fetch recipient count when type changes ─────────────── */
  const fetchCount = useCallback(async (type) => {
    if (type === "single") { setRecipientCount(1); return; }
    try {
      setCountLoading(true);
      const res = await adminService.getRecipientCount(type);
      setRecipientCount(res.data?.count ?? 0);
    } catch {
      setRecipientCount("?");
    } finally {
      setCountLoading(false);
    }
  }, []);

  useEffect(() => { fetchCount(generalForm.recipientType); }, [generalForm.recipientType, fetchCount]);

  /* ── Fetch users for single picker ─────────────────────────── */
  useEffect(() => {
    adminService.getAllUsers({ limit: 200, page: 1 })
      .then((res) => setUsers(res.data ?? []))
      .catch(() => {});
  }, []);

  /* Filtered users for the search-select */
  const filteredUsers = userSearch
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()),
      )
    : users;

  /* ── Handlers ────────────────────────────────────────────── */
  const handleSendGeneral = async (e) => {
    e.preventDefault();
    if (generalForm.recipientType === "single" && !generalForm.specificUserId) {
      toast.error("Please select a specific user.");
      return;
    }
    try {
      setLoading(true); setResult(null);
      const res = await adminService.sendNotification(generalForm);
      setResult({ type: "success", message: `✅ Sent to ${res.data?.sent ?? 0} recipient(s).`, details: res.data });
      setGeneralForm((f) => ({ ...f, subject: "", message: "" }));
      toast.success("Notification sent!");
    } catch (err) {
      setResult({ type: "error", message: err.response?.data?.message || "Failed to send notification." });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMaintenance = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setResult(null);
      const res = await adminService.sendMaintenanceNotification(maintenanceForm);
      setResult({ type: "success", message: `✅ Maintenance notice sent to ${res.data?.sent ?? 0} user(s).`, details: res.data });
      setMaintenanceForm({ startTime: "", endTime: "", reason: "", affectedServices: "" });
      toast.success("Maintenance notice sent!");
    } catch (err) {
      setResult({ type: "error", message: err.response?.data?.message || "Failed to send maintenance notice." });
    } finally {
      setLoading(false);
    }
  };

  const handleSendError = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setResult(null);
      const res = await adminService.sendErrorAlert(errorForm);
      setResult({ type: "success", message: `✅ Error alert sent to ${res.data?.sent ?? 0} admin(s).`, details: res.data });
      setErrorForm({ errorType: "", description: "", severity: "medium", affectedFeatures: "" });
      toast.success("Error alert sent!");
    } catch (err) {
      setResult({ type: "error", message: err.response?.data?.message || "Failed to send error alert." });
    } finally {
      setLoading(false);
    }
  };

  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <RoleDashboardLayout
      role="admin"
      title="Send Notifications"
      subtitle="Broadcast email notifications to platform users"
    >
      <div className="max-w-2xl mx-auto">

        {/* ── Tab selector ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setResult(null); }}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border transition-all text-center"
                style={{
                  backgroundColor: isActive ? t.accent : "#FFF",
                  borderColor:     isActive ? t.accent : "#E8E2D9",
                  color:           isActive ? "#FFF"   : "#6B7280",
                  boxShadow:       isActive ? `0 4px 16px ${t.accent}40` : "none",
                }}
              >
                <Icon className="text-2xl" />
                <span className="text-[11px] font-bold leading-tight">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Result banner */}
        <ResultBanner result={result} onClose={() => setResult(null)} />

        {/* ── GENERAL NOTIFICATION ─────────────────────────── */}
        {activeTab === "general" && (
          <form onSubmit={handleSendGeneral} className="bg-white rounded-2xl border shadow-sm p-6 space-y-5" style={{ borderColor: "#E8E2D9" }}>
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "#F3EFE9" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${DK}15` }}>
                <RiBroadcastLine className="text-xl" style={{ color: DK }} />
              </div>
              <div>
                <h2 className="font-extrabold text-base" style={{ color: DK }}>General Notification</h2>
                <p className="text-xs text-gray-400">Broadcast an email to selected recipients</p>
              </div>
            </div>

            {/* Recipient type */}
            <div>
              <label className={labelCls}>Send To</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {RECIPIENT_OPTS.map(({ value, label, desc, icon: Icon }) => {
                  const sel = generalForm.recipientType === value;
                  return (
                    <label key={value} className="cursor-pointer">
                      <input type="radio" name="recipientType" value={value} checked={sel}
                        onChange={(e) => setGeneralForm((f) => ({ ...f, recipientType: e.target.value, specificUserId: "" }))}
                        className="sr-only" />
                      <div className="flex flex-col gap-1 p-3 rounded-xl border transition-all"
                        style={{
                          backgroundColor: sel ? `${DK}10` : CR,
                          borderColor:     sel ? DK : "#E8E2D9",
                        }}>
                        <div className="flex items-center gap-1.5">
                          <Icon className="text-sm shrink-0" style={{ color: sel ? DK : "#9CA3AF" }} />
                          <span className="text-xs font-bold" style={{ color: sel ? DK : "#374151" }}>{label}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">{desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Recipient count badge */}
              {generalForm.recipientType !== "single" && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                  <RiMailSendLine style={{ color: ACC }} />
                  {countLoading ? "Counting…" : `${recipientCount} recipient(s) will receive this email`}
                </p>
              )}
            </div>

            {/* Single user selector */}
            {generalForm.recipientType === "single" && (
              <div>
                <label className={labelCls}>Search & Select User</label>
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className={`${inputCls} mb-2`}
                  style={inputStyle}
                />
                <select
                  value={generalForm.specificUserId}
                  onChange={(e) => setGeneralForm((f) => ({ ...f, specificUserId: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                  size={Math.min(5, filteredUsers.length + 1)}
                >
                  <option value="">— Select a user —</option>
                  {filteredUsers.slice(0, 100).map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className={labelCls}>Subject *</label>
              <input type="text" value={generalForm.subject} required
                onChange={(e) => setGeneralForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Notification subject…"
                className={inputCls} style={inputStyle}
              />
            </div>

            {/* Message */}
            <div>
              <label className={labelCls}>Message *</label>
              <textarea value={generalForm.message} required rows={6} resize="none"
                onChange={(e) => setGeneralForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Write your notification message…"
                className={`${inputCls} resize-none`} style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ backgroundColor: DK }}>
              {loading ? <RiLoader4Line className="animate-spin text-lg" /> : <RiMailSendLine className="text-lg" />}
              {loading ? "Sending…" : `Send to ${generalForm.recipientType === "single" ? "1" : recipientCount} Recipient(s)`}
            </button>
          </form>
        )}

        {/* ── MAINTENANCE NOTICE ───────────────────────────── */}
        {activeTab === "maintenance" && (
          <form onSubmit={handleSendMaintenance} className="bg-white rounded-2xl border shadow-sm p-6 space-y-5" style={{ borderColor: "#E8E2D9" }}>
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "#F3EFE9" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#FEF3C7" }}>
                <RiToolsLine className="text-xl text-yellow-700" />
              </div>
              <div>
                <h2 className="font-extrabold text-base" style={{ color: DK }}>Maintenance Notice</h2>
                <p className="text-xs text-gray-400">Notify all active users about scheduled downtime</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border text-xs text-yellow-800 font-medium flex items-center gap-2"
              style={{ backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }}>
              <RiToolsLine /> This will send an email to <strong>all active users</strong> on the platform.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Time *</label>
                <input type="datetime-local" value={maintenanceForm.startTime} required
                  onChange={(e) => setMaintenanceForm((f) => ({ ...f, startTime: e.target.value }))}
                  className={inputCls} style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls}>End Time (Optional)</label>
                <input type="datetime-local" value={maintenanceForm.endTime}
                  onChange={(e) => setMaintenanceForm((f) => ({ ...f, endTime: e.target.value }))}
                  className={inputCls} style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Reason for Maintenance *</label>
              <textarea value={maintenanceForm.reason} required rows={4}
                onChange={(e) => setMaintenanceForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Explain the reason for maintenance…"
                className={`${inputCls} resize-none`} style={inputStyle}
              />
            </div>

            <div>
              <label className={labelCls}>Affected Services (Optional)</label>
              <input type="text" value={maintenanceForm.affectedServices}
                onChange={(e) => setMaintenanceForm((f) => ({ ...f, affectedServices: e.target.value }))}
                placeholder="e.g. Room listings, Booking requests, Messaging"
                className={inputCls} style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ backgroundColor: "#D97706" }}>
              {loading ? <RiLoader4Line className="animate-spin text-lg" /> : <RiMailSendLine className="text-lg" />}
              {loading ? "Sending…" : "Send Maintenance Notice to All Users"}
            </button>
          </form>
        )}

        {/* ── ERROR ALERT ──────────────────────────────────── */}
        {activeTab === "error" && (
          <form onSubmit={handleSendError} className="bg-white rounded-2xl border shadow-sm p-6 space-y-5" style={{ borderColor: "#E8E2D9" }}>
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "#F3EFE9" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#FEE2E2" }}>
                <RiAlertLine className="text-xl text-red-600" />
              </div>
              <div>
                <h2 className="font-extrabold text-base" style={{ color: DK }}>Error Alert</h2>
                <p className="text-xs text-gray-400">Alert admin team about a system issue</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border text-xs text-red-800 font-medium flex items-center gap-2"
              style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}>
              <RiAlertLine /> This will only notify <strong>admin users</strong> — not regular platform users.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Error Type *</label>
                <input type="text" value={errorForm.errorType} required
                  onChange={(e) => setErrorForm((f) => ({ ...f, errorType: e.target.value }))}
                  placeholder="e.g. Database Error, API Failure"
                  className={inputCls} style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Severity</label>
                <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                  {SEVERITY_OPTS.map((s) => {
                    const sc = SEVERITY_COLORS[s];
                    const sel = errorForm.severity === s;
                    return (
                      <button key={s} type="button"
                        onClick={() => setErrorForm((f) => ({ ...f, severity: s }))}
                        className="py-2 rounded-xl text-xs font-bold capitalize border transition-all"
                        style={{
                          backgroundColor: sel ? sc.text : sc.bg,
                          color:           sel ? "#FFF" : sc.text,
                          borderColor:     sel ? sc.text : `${sc.text}40`,
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Description *</label>
              <textarea value={errorForm.description} required rows={5}
                onChange={(e) => setErrorForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the error or issue in detail…"
                className={`${inputCls} resize-none`} style={inputStyle}
              />
            </div>

            <div>
              <label className={labelCls}>Affected Features (Optional)</label>
              <input type="text" value={errorForm.affectedFeatures}
                onChange={(e) => setErrorForm((f) => ({ ...f, affectedFeatures: e.target.value }))}
                placeholder="e.g. Login, Listings page, Payments"
                className={inputCls} style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ backgroundColor: "#DC2626" }}>
              {loading ? <RiLoader4Line className="animate-spin text-lg" /> : <RiAlertLine className="text-lg" />}
              {loading ? "Sending…" : "Send Error Alert to Admins"}
            </button>
          </form>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default SendNotifications;
