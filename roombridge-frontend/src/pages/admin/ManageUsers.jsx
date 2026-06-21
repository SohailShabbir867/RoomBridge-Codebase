import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import adminService from "../../services/adminService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiSearchLine,
  RiLoader4Line,
  RiUserLine,
  RiShieldLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiRefreshLine,
} from "react-icons/ri";

document.title = "Manage Users — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

/* ── Badge helpers ───────────────────────────────────────────── */
const ROLE_COLORS = {
  seeker: { bg: "#EFF6FF", text: "#1D4ED8" },
  owner:  { bg: `${BTN}15`, text: BTN      },
  admin:  { bg: `${DK}15`,  text: DK       },
};
const STATUS_COLORS = {
  active:   { bg: "#D1FAE5", text: "#065F46" },
  banned:   { bg: "#FEE2E2", text: "#991B1B" },
  inactive: { bg: "#F3F4F6", text: "#6B7280" },
};

const getUserStatus = (u) =>
  u.isBanned ? "banned" : !u.isActive ? "inactive" : "active";

/* ── Pill filter button ───────────────────────────────────────── */
const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all border"
    style={{
      backgroundColor: active ? DK      : "#FFFFFF",
      color:           active ? "#FFF"  : "#6B7280",
      borderColor:     active ? DK      : "#E8E2D9",
    }}
  >
    {label}
  </button>
);

/* ── Action button ───────────────────────────────────────────── */
const ActionBtn = ({ onClick, disabled, color, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold
               border transition-all disabled:opacity-60"
    style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color; e.currentTarget.style.color = "#fff"; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${color}15`; e.currentTarget.style.color = color; }}
  >
    {children}
  </button>
);

const ManageUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState(() => searchParams.get("search") || "");
  const [roleFilter, setRoleFilter] = useState(() => {
    const role = searchParams.get("role") || "";
    return ["", "seeker", "owner", "admin"].includes(role) ? role : "";
  });
  const [page, setPage]         = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isNaN(p) ? 1 : Math.max(1, p);
  });
  const [total, setTotal]       = useState(0);
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState("");
  const LIMIT = 20;
  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const nextPage   = opts.page   ?? page;
      const nextRole   = opts.role   ?? roleFilter;
      const nextSearch = opts.search !== undefined ? opts.search : search;
      const nextParams = new URLSearchParams();
      if (nextRole)   nextParams.set("role",   nextRole);
      if (nextSearch) nextParams.set("search", nextSearch);
      if (nextPage > 1) nextParams.set("page", String(nextPage));
      setSearchParams(nextParams);
      const res   = await adminService.getAllUsers({ page: nextPage, limit: LIMIT, role: nextRole, search: nextSearch });
      const items = res.data ?? res.users ?? [];
      setUsers(Array.isArray(items) ? items : []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
      setPage(nextPage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search, setSearchParams]);

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers({ page: 1, search: val, role: roleFilter }), 400);
  };

  const handleBan = async () => {
    const u = banModal;
    if (!u) return;
    try {
      setUpdating(u._id);
      await adminService.updateUserStatus(u._id, { isBanned: true, bannedReason: banReason || undefined });
      setUsers((us) => us.map((x) => x._id === u._id ? { ...x, isBanned: true, bannedReason: banReason } : x));
      toast.success(`${u.name} banned.`);
      setBanModal(null);
      setBanReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to ban user.");
    } finally {
      setUpdating(null);
    }
  };

  const handleUnban = async (u) => {
    if (!window.confirm(`Unban ${u.name}?`)) return;
    try {
      setUpdating(u._id);
      await adminService.updateUserStatus(u._id, { isBanned: false });
      setUsers((us) => us.map((x) => x._id === u._id ? { ...x, isBanned: false, bannedReason: "" } : x));
      toast.success(`${u.name} unbanned.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unban user.");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name}? This cannot be undone.`)) return;
    try {
      setDeleting(u._id);
      await adminService.deleteUser(u._id);
      setUsers((us) => us.filter((x) => x._id !== u._id));
      setTotal((t) => t - 1);
      toast.success(`${u.name} deleted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <RoleDashboardLayout
      role="admin"
      title="Manage Users"
      subtitle={`${total} total users`}
      headerAction={
        <button
          onClick={() => fetchUsers()}
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
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all focus:ring-2"
              style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["", "seeker", "owner", "admin"].map((r) => (
              <FilterPill
                key={r} label={r || "All"}
                active={roleFilter === r}
                onClick={() => { setRoleFilter(r); fetchUsers({ page: 1, role: r, search }); }}
              />
            ))}
          </div>
        </div>

        {/* Table */}
        {loading && users.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#E8E2D9" }}>
            <RiUserLine className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="font-bold" style={{ color: DK }}>No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}>
                    {["User", "Role", "Status", "Joined", "Actions"].map((h, i) => (
                      <th key={h}
                        className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest ${i === 4 ? "text-right" : "text-left"}`}
                        style={{ color: `${DK}70` }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const status     = getUserStatus(u);
                    const isUpdating = updating === u._id;
                    const isDeleting = deleting === u._id;
                    const rc = ROLE_COLORS[u.role] || ROLE_COLORS.seeker;
                    const sc = STATUS_COLORS[status] || STATUS_COLORS.inactive;
                    return (
                      <tr key={u._id} className="border-b transition-colors hover:bg-[#F7F4EF]" style={{ borderColor: "#F3EFE9" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm"
                              style={{ backgroundColor: `${DK}15`, color: DK }}
                            >
                              {u.profilePhoto?.url
                                ? <img src={u.profilePhoto.url} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                                : u.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate text-xs" style={{ color: DK }}>{u.name}</p>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                            style={{ backgroundColor: rc.bg, color: rc.text }}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                            style={{ backgroundColor: sc.bg, color: sc.text }}>
                            {status}
                          </span>
                          {u.bannedReason && (
                            <p className="text-[10px] text-red-400 mt-0.5 max-w-40 truncate" title={u.bannedReason}>
                              {u.bannedReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.role !== "admin" ? (
                              <>
                                {u.isBanned ? (
                                  <ActionBtn onClick={() => handleUnban(u)} disabled={isUpdating} color="#16A34A">
                                    {isUpdating ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} Unban
                                  </ActionBtn>
                                ) : (
                                  <ActionBtn onClick={() => setBanModal(u)} disabled={isUpdating} color="#D97706">
                                    {isUpdating ? <RiLoader4Line className="animate-spin" /> : <RiShieldLine />} Ban
                                  </ActionBtn>
                                )}
                                <ActionBtn onClick={() => handleDelete(u)} disabled={isDeleting} color="#DC2626">
                                  {isDeleting ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                                </ActionBtn>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Admin — protected</span>
                            )}
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
                <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} users</p>
                <div className="flex gap-2">
                  {[{ label: "← Prev", pg: page - 1, dis: page <= 1 }, { label: "Next →", pg: page + 1, dis: page >= totalPages }]
                    .map(({ label, pg, dis }) => (
                      <button key={label} onClick={() => fetchUsers({ page: pg })} disabled={dis || loading}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40"
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

      {/* Ban modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-extrabold text-lg mb-1" style={{ color: DK }}>Ban {banModal.name}?</h3>
            <p className="text-gray-400 text-sm mb-4">This will prevent them from logging in. You can unban at any time.</p>
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Reason (optional)</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Violation of platform rules…"
                rows={3}
                className="w-full rounded-xl py-3 px-4 text-sm border outline-none resize-none focus:ring-2"
                style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setBanModal(null); setBanReason(""); }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                style={{ borderColor: "#E8E2D9" }}
              >Cancel</button>
              <button
                onClick={handleBan}
                disabled={updating === banModal._id}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ backgroundColor: "#DC2626" }}
              >
                {updating === banModal._id ? <RiLoader4Line className="animate-spin inline mr-1" /> : null}
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleDashboardLayout>
  );
};

export default ManageUsers;
