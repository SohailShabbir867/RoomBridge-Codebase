import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine, RiSearchLine, RiLoader4Line,
  RiUserLine, RiShieldLine, RiDeleteBinLine,
  RiCheckLine, RiCloseLine, RiRefreshLine, RiFilterLine,
} from 'react-icons/ri';

document.title = 'Manage Users — RoomBridge';

const ROLE_BADGE = {
  seeker: 'bg-primary/10 text-primary border-primary/20',
  owner:  'bg-secondary/10 text-secondary border-secondary/20',
  admin:  'bg-accent/20 text-accent border-accent/30',
};

const STATUS_BADGE = {
  active:   'bg-success/10 text-success border-success/20',
  banned:   'bg-error/10 text-error border-error/20',
  inactive: 'bg-border text-text-secondary border-border',
};

const getUserStatus = (u) => {
  if (u.isBanned)   return 'banned';
  if (!u.isActive)  return 'inactive';
  return 'active';
};

const ManageUsers = () => {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('');
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [updating,  setUpdating]  = useState(null);  // userId being updated
  const [deleting,  setDeleting]  = useState(null);
  const [banModal,  setBanModal]  = useState(null);  // user to ban { user, reason }
  const [banReason, setBanReason] = useState('');
  const LIMIT = 20;

  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const params = {
        page:  opts.page  ?? page,
        limit: LIMIT,
        role:  opts.role  ?? roleFilter,
        search: opts.search !== undefined ? opts.search : search,
      };
      const res = await adminService.getAllUsers(params);
      /*
        Backend returns paginatedResponse:
        { success, message, data, pagination: { currentPage, totalPages, total } }
        data may be res.data or res.users depending on paginatedResponse impl.
      */
      const items = res.data ?? res.users ?? [];
      setUsers(Array.isArray(items) ? items : []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
      setPage(opts.page ?? page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line

  /* Debounced search */
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchUsers({ page: 1, search: val, role: roleFilter });
    }, 400);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    fetchUsers({ page: 1, role, search });
  };

  /* Ban */
  const handleBan = async () => {
    const u = banModal;
    if (!u) return;
    try {
      setUpdating(u._id);
      await adminService.updateUserStatus(u._id, { isBanned: true, bannedReason: banReason || undefined });
      setUsers(us => us.map(x => x._id === u._id ? { ...x, isBanned: true, bannedReason: banReason } : x));
      toast.success(`${u.name} banned.`);
      setBanModal(null);
      setBanReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to ban user.');
    } finally {
      setUpdating(null);
    }
  };

  /* Unban */
  const handleUnban = async (u) => {
    if (!window.confirm(`Unban ${u.name}?`)) return;
    try {
      setUpdating(u._id);
      await adminService.updateUserStatus(u._id, { isBanned: false });
      setUsers(us => us.map(x => x._id === u._id ? { ...x, isBanned: false, bannedReason: '' } : x));
      toast.success(`${u.name} unbanned.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unban user.');
    } finally {
      setUpdating(null);
    }
  };

  /* Delete */
  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name}? This cannot be undone.`)) return;
    try {
      setDeleting(u._id);
      await adminService.deleteUser(u._id);
      setUsers(us => us.filter(x => x._id !== u._id));
      setTotal(t => t - 1);
      toast.success(`${u.name} deleted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard"
                className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary transition-colors">
            <RiArrowLeftLine className="text-xl" />
          </Link>
          <div>
            <h1 className="font-bold text-primary">Manage Users</h1>
            <p className="text-text-secondary text-xs">{total} total users</p>
          </div>
        </div>
        <button onClick={() => fetchUsers()}
                className="flex items-center gap-2 text-sm text-secondary border border-secondary/30
                           px-3 py-1.5 rounded-btn hover:bg-secondary hover:text-white transition-colors">
          <RiRefreshLine className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input type="text" placeholder="Search by name or email…"
                   value={search} onChange={e => handleSearch(e.target.value)}
                   className="input pl-9 py-2 text-sm w-full" />
          </div>
          <div className="flex gap-2">
            {['', 'seeker', 'owner', 'admin'].map(r => (
              <button key={r} onClick={() => handleRoleFilter(r)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                                  ${roleFilter === r
                                    ? 'bg-primary text-white shadow-card'
                                    : 'bg-white border border-border text-text-secondary hover:text-primary'}`}>
                {r || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading && users.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiUserLine className="text-5xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold">No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Joined</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => {
                    const status = getUserStatus(u);
                    const isUpdating = updating === u._id;
                    const isDeleting = deleting === u._id;
                    return (
                      <tr key={u._id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center overflow-hidden shrink-0">
                              {u.profilePhoto?.url
                                ? <img src={u.profilePhoto.url} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                                : <span className="text-primary font-bold text-sm">{u.name?.[0]?.toUpperCase()}</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-primary truncate">{u.name}</p>
                              <p className="text-xs text-text-secondary truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize
                                           ${ROLE_BADGE[u.role] || ''}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize
                                           ${STATUS_BADGE[status] || ''}`}>
                            {status}
                          </span>
                          {u.bannedReason && (
                            <p className="text-[11px] text-error mt-0.5 max-w-[180px] truncate" title={u.bannedReason}>
                              {u.bannedReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {u.role !== 'admin' && (
                              <>
                                {u.isBanned ? (
                                  <button
                                    onClick={() => handleUnban(u)}
                                    disabled={isUpdating}
                                    title="Unban user"
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn text-xs
                                               bg-success/10 text-success border border-success/20
                                               hover:bg-success hover:text-white disabled:opacity-60 transition-colors">
                                    {isUpdating ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
                                    Unban
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setBanModal(u)}
                                    disabled={isUpdating}
                                    title="Ban user"
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn text-xs
                                               bg-warning/10 text-warning border border-warning/20
                                               hover:bg-warning hover:text-white disabled:opacity-60 transition-colors">
                                    {isUpdating ? <RiLoader4Line className="animate-spin" /> : <RiShieldLine />}
                                    Ban
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(u)}
                                  disabled={isDeleting}
                                  title="Delete user"
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn text-xs
                                             bg-error/10 text-error border border-error/20
                                             hover:bg-error hover:text-white disabled:opacity-60 transition-colors">
                                  {isDeleting ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                                </button>
                              </>
                            )}
                            {u.role === 'admin' && (
                              <span className="text-xs text-text-secondary italic">Admin — protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background/50">
                <p className="text-xs text-text-secondary">
                  Page {page} of {totalPages} · {total} users
                </p>
                <div className="flex gap-2">
                  <button onClick={() => fetchUsers({ page: page - 1 })} disabled={page <= 1 || loading}
                          className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary
                                     hover:text-primary disabled:opacity-40 transition-colors">
                    ← Prev
                  </button>
                  <button onClick={() => fetchUsers({ page: page + 1 })} disabled={page >= totalPages || loading}
                          className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary
                                     hover:text-primary disabled:opacity-40 transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ban reason modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-card shadow-hover w-full max-w-md p-6">
            <h3 className="font-bold text-primary text-lg mb-1">Ban {banModal.name}?</h3>
            <p className="text-text-secondary text-sm mb-4">
              This will prevent them from logging in. You can unban at any time.
            </p>
            <div className="mb-4">
              <label className="label">Reason (optional)</label>
              <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
                        placeholder="Violation of platform rules…"
                        rows={3} className="input resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setBanModal(null); setBanReason(''); }}
                      className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleBan} disabled={updating === banModal._id}
                      className="btn-primary flex-1 justify-center gap-2 bg-error hover:bg-error/90">
                {updating === banModal._id ? <RiLoader4Line className="animate-spin" /> : <RiShieldLine />}
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
