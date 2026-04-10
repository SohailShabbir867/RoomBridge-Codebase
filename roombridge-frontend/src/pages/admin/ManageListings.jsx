import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine, RiSearchLine, RiLoader4Line,
  RiHome4Line, RiCheckLine, RiCloseLine,
  RiDeleteBinLine, RiRefreshLine, RiMapPin2Line,
} from 'react-icons/ri';

document.title = 'Manage Listings — RoomBridge';

const STATUS_BADGE = {
  pending:  'bg-warning/10 text-warning border-warning/20',
  active:   'bg-success/10 text-success border-success/20',
  rejected: 'bg-error/10 text-error border-error/20',
  inactive: 'bg-border text-text-secondary border-border',
};

const ROOM_TYPE_LABELS = {
  single:    'Single Room',
  shared:    'Shared Room',
  apartment: 'Apartment',
};

const ManageListings = () => {
  const [listings,      setListings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [page,          setPage]          = useState(1);
  const [total,         setTotal]         = useState(0);
  const [updating,      setUpdating]      = useState(null);
  const [deleting,      setDeleting]      = useState(null);
  const [rejectModal,   setRejectModal]   = useState(null);  // listing to reject
  const [rejectReason,  setRejectReason]  = useState('');
  const LIMIT = 20;
  const searchTimer = useRef(null);

  const fetchListings = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const params = {
        page:   opts.page   ?? page,
        limit:  LIMIT,
        status: opts.status !== undefined ? opts.status : statusFilter,
        search: opts.search !== undefined ? opts.search : search,
      };
      const res = await adminService.getAllListings(params);
      const items = res.data ?? res.listings ?? [];
      setListings(Array.isArray(items) ? items : []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
      setPage(opts.page ?? page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load listings.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchListings(); }, []); // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchListings({ page: 1, search: val, status: statusFilter });
    }, 400);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchListings({ page: 1, status, search });
  };

  /* Approve */
  const handleApprove = async (l) => {
    try {
      setUpdating(l._id);
      await adminService.updateListingStatus(l._id, { status: 'active' });
      setListings(ls => ls.map(x => x._id === l._id ? { ...x, status: 'active' } : x));
      toast.success(`"${l.title}" approved!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve listing.');
    } finally {
      setUpdating(null);
    }
  };

  /* Deactivate */
  const handleDeactivate = async (l) => {
    if (!window.confirm(`Deactivate "${l.title}"?`)) return;
    try {
      setUpdating(l._id);
      await adminService.updateListingStatus(l._id, { status: 'inactive' });
      setListings(ls => ls.map(x => x._id === l._id ? { ...x, status: 'inactive' } : x));
      toast.success(`"${l.title}" deactivated.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate listing.');
    } finally {
      setUpdating(null);
    }
  };

  /* Reject (with reason) */
  const handleReject = async () => {
    const l = rejectModal;
    if (!l) return;
    try {
      setUpdating(l._id);
      await adminService.updateListingStatus(l._id, {
        status: 'rejected',
        rejectionReason: rejectReason || undefined,
      });
      setListings(ls => ls.map(x => x._id === l._id
        ? { ...x, status: 'rejected', rejectionReason: rejectReason }
        : x
      ));
      toast.success(`"${l.title}" rejected.`);
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject listing.');
    } finally {
      setUpdating(null);
    }
  };

  /* Delete */
  const handleDelete = async (l) => {
    if (!window.confirm(`Permanently delete "${l.title}"?`)) return;
    try {
      setDeleting(l._id);
      await adminService.deleteListing(l._id);
      setListings(ls => ls.filter(x => x._id !== l._id));
      setTotal(t => t - 1);
      toast.success('Listing deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete listing.');
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
            <h1 className="font-bold text-primary">Manage Listings</h1>
            <p className="text-text-secondary text-xs">{total} total listings</p>
          </div>
        </div>
        <button onClick={() => fetchListings()}
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
            <input type="text" placeholder="Search by title, city, address…"
                   value={search} onChange={e => handleSearch(e.target.value)}
                   className="input pl-9 py-2 text-sm w-full" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'active', 'rejected', 'inactive'].map(s => (
              <button key={s} onClick={() => handleStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                                  ${statusFilter === s
                                    ? 'bg-primary text-white shadow-card'
                                    : 'bg-white border border-border text-text-secondary hover:text-primary'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading && listings.length === 0 ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiHome4Line className="text-5xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold">No listings found</p>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Listing</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Owner</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Rent</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Submitted</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listings.map(l => {
                    const isUpdating = updating === l._id;
                    const isDeleting = deleting === l._id;
                    return (
                      <tr key={l._id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-background shrink-0">
                              {l.photos?.[0]?.url
                                ? <img src={l.photos[0].url} alt={l.title} className="w-10 h-10 object-cover" />
                                : <RiHome4Line className="text-primary m-auto mt-2.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-primary truncate max-w-[200px]">{l.title}</p>
                              <p className="text-xs text-text-secondary flex items-center gap-1">
                                <RiMapPin2Line className="text-accent" /> {l.city}
                                {l.roomType && <span>· {ROOM_TYPE_LABELS[l.roomType] || l.roomType}</span>}
                              </p>
                              {l.rejectionReason && (
                                <p className="text-[11px] text-error truncate max-w-[200px]" title={l.rejectionReason}>
                                  ❌ {l.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-primary">{l.owner?.name || '—'}</p>
                          <p className="text-xs text-text-secondary">{l.owner?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize
                                           ${STATUS_BADGE[l.status] || ''}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-primary">
                          PKR {(l.rent || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve — only for pending/rejected/inactive */}
                            {l.status !== 'active' && (
                              <button
                                onClick={() => handleApprove(l)}
                                disabled={isUpdating}
                                title="Approve listing"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn text-xs
                                           bg-success/10 text-success border border-success/20
                                           hover:bg-success hover:text-white disabled:opacity-60 transition-colors">
                                {isUpdating ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
                                Approve
                              </button>
                            )}
                            {/* Reject — only for pending/active */}
                            {(l.status === 'pending' || l.status === 'active') && (
                              <button
                                onClick={() => setRejectModal(l)}
                                disabled={isUpdating}
                                title="Reject listing"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn text-xs
                                           bg-warning/10 text-warning border border-warning/20
                                           hover:bg-warning hover:text-white disabled:opacity-60 transition-colors">
                                <RiCloseLine /> Reject
                              </button>
                            )}
                            {/* Deactivate — only active */}
                            {l.status === 'active' && (
                              <button
                                onClick={() => handleDeactivate(l)}
                                disabled={isUpdating}
                                title="Deactivate listing"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn text-xs
                                           bg-border text-text-secondary border border-border
                                           hover:bg-primary/10 hover:text-primary disabled:opacity-60 transition-colors">
                                Off
                              </button>
                            )}
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(l)}
                              disabled={isDeleting}
                              title="Delete listing permanently"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn text-xs
                                         bg-error/10 text-error border border-error/20
                                         hover:bg-error hover:text-white disabled:opacity-60 transition-colors">
                              {isDeleting ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background/50">
                <p className="text-xs text-text-secondary">Page {page} of {totalPages} · {total} listings</p>
                <div className="flex gap-2">
                  <button onClick={() => fetchListings({ page: page - 1 })} disabled={page <= 1 || loading}
                          className="px-3 py-1.5 rounded-btn text-sm border border-border text-text-secondary
                                     hover:text-primary disabled:opacity-40 transition-colors">
                    ← Prev
                  </button>
                  <button onClick={() => fetchListings({ page: page + 1 })} disabled={page >= totalPages || loading}
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

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-card shadow-hover w-full max-w-md p-6">
            <h3 className="font-bold text-primary text-lg mb-1">Reject "{rejectModal.title}"?</h3>
            <p className="text-text-secondary text-sm mb-4">
              An email will be sent to the owner explaining the reason.
            </p>
            <div className="mb-4">
              <label className="label">Rejection Reason (optional)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                        placeholder="Does not meet platform guidelines…"
                        rows={3} className="input resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                      className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleReject} disabled={updating === rejectModal._id}
                      className="btn-primary flex-1 justify-center gap-2"
                      style={{ background: '#ef4444' }}>
                {updating === rejectModal._id ? <RiLoader4Line className="animate-spin" /> : <RiCloseLine />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageListings;
