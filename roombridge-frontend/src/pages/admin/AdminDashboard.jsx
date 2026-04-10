import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import { logout } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';
import {
  RiDashboardLine, RiUserLine, RiHome4Line, RiCalendarCheckLine,
  RiFlagLine, RiLogoutBoxLine, RiArrowRightLine, RiLoader4Line,
  RiGroupLine, RiListCheck, RiRefreshLine,
} from 'react-icons/ri';

document.title = 'Admin Dashboard — RoomBridge';

/* ── Stat card ────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
  <Link to={to || '#'}
        className="bg-white rounded-card border border-border p-5 flex items-start gap-4
                   shadow-card hover:shadow-hover transition-all group">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="text-white text-xl" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-primary">{value ?? '—'}</p>
      <p className="text-sm text-text-secondary group-hover:text-primary transition-colors">{label}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  </Link>
);

/* ── Mini bar chart ───────────────────────────────────────── */
const MiniBar = ({ data = [], color = 'bg-primary' }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-sm ${color} transition-all duration-500`}
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
            title={`${d.label}: ${d.count}`}
          />
        </div>
      ))}
    </div>
  );
};

const NAV = [
  { to: '/admin/dashboard', icon: RiDashboardLine,     label: 'Dashboard'       },
  { to: '/admin/users',     icon: RiGroupLine,         label: 'Manage Users'    },
  { to: '/admin/listings',  icon: RiHome4Line,         label: 'Manage Listings' },
  { to: '/admin/reports',   icon: RiFlagLine,          label: 'Reports'         },
];

const AdminDashboard = () => {
  const { user }   = useSelector(s => s.auth);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [sideOpen, setSideOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStats();
      /*
        Backend returns { success, data: { users, listings, bookings,
          messages, reports, recent, growth } }
      */
      setStats(res.data || res);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch (_) {}
    dispatch(logout());
    toast.success('Logged out.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary flex flex-col
                         transition-transform duration-300 lg:translate-x-0
                         ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-primary text-sm font-bold">R</span>
            </div>
            <span className="text-white font-bold text-lg">Room<span className="text-accent">Bridge</span></span>
          </Link>
          <p className="text-white/40 text-xs mt-1 ml-10">Admin Panel</p>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden shrink-0">
              {user?.profilePhoto?.url
                ? <img src={user.profilePhoto.url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                : <span className="text-accent font-bold">{user?.name?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-white/40 text-xs">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                             text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150">
              <Icon className="text-base shrink-0" /> {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium
                             text-white/70 hover:text-error hover:bg-red-500/10 transition-all duration-150">
            <RiLogoutBoxLine /> Logout
          </button>
        </div>
      </aside>

      {sideOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(s => !s)}
                    aria-label="Toggle sidebar"
                    className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-background transition-colors">
              <RiListCheck className="text-xl" />
            </button>
            <div>
              <h1 className="font-bold text-primary text-lg">Admin Dashboard</h1>
              <p className="text-text-secondary text-xs">Platform overview & statistics</p>
            </div>
          </div>
          <button onClick={fetchStats} disabled={loading}
                  className="flex items-center gap-2 text-sm text-secondary border border-secondary/30
                             px-3 py-1.5 rounded-btn hover:bg-secondary hover:text-white transition-colors disabled:opacity-60">
            <RiRefreshLine className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </header>

        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <RiLoader4Line className="animate-spin text-4xl text-primary" />
            </div>
          ) : !stats ? (
            <div className="text-center py-24">
              <p className="text-text-secondary">Failed to load stats.</p>
              <button onClick={fetchStats} className="btn-primary mt-4">Retry</button>
            </div>
          ) : (
            <>
              {/* ── Users row ─────────────────────────────── */}
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Users</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={RiGroupLine}     label="Total Users"   value={stats.users?.total}   color="bg-primary"   to="/admin/users" />
                  <StatCard icon={RiUserLine}       label="Seekers"       value={stats.users?.seekers} color="bg-secondary" to="/admin/users?role=seeker" />
                  <StatCard icon={RiHome4Line}      label="Owners"        value={stats.users?.owners}  color="bg-accent"    to="/admin/users?role=owner"  sub={`+${stats.recent?.newUsersLast7 || 0} this week`} />
                  <StatCard icon={RiUserLine}       label="Admins"        value={stats.users?.admins}  color="bg-primary/60" to="/admin/users?role=admin" />
                </div>
              </section>

              {/* ── Listings row ────────────────────────── */}
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Listings</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard icon={RiHome4Line}         label="Total"    value={stats.listings?.total}    color="bg-primary"   to="/admin/listings" />
                  <StatCard icon={RiHome4Line}         label="Active"   value={stats.listings?.active}   color="bg-success"   to="/admin/listings?status=active"   />
                  <StatCard icon={RiHome4Line}         label="Pending"  value={stats.listings?.pending}  color="bg-warning"   to="/admin/listings?status=pending"  sub="Need review" />
                  <StatCard icon={RiHome4Line}         label="Rejected" value={stats.listings?.rejected} color="bg-error"     to="/admin/listings?status=rejected" />
                  <StatCard icon={RiHome4Line}         label="Inactive" value={stats.listings?.inactive} color="bg-border text-text-secondary" to="/admin/listings?status=inactive" />
                </div>
              </section>

              {/* ── Bookings + Reports row ───────────────── */}
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Activity</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={RiCalendarCheckLine} label="Total Bookings"   value={stats.bookings?.total}   color="bg-primary"   to="/admin/listings" />
                  <StatCard icon={RiCalendarCheckLine} label="Accepted"         value={stats.bookings?.accepted} color="bg-success"  />
                  <StatCard icon={RiFlagLine}          label="Total Reports"    value={stats.reports?.total}    color="bg-error"     to="/admin/reports" />
                  <StatCard icon={RiFlagLine}          label="Pending Reports"  value={stats.reports?.pending}  color="bg-warning"   to="/admin/reports" sub="Need action" />
                </div>
              </section>

              {/* ── Growth charts ─────────────────────── */}
              {stats.growth && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-card border border-border shadow-card p-5">
                    <h3 className="font-semibold text-primary mb-4">User Growth (6 months)</h3>
                    <MiniBar data={stats.growth.monthlyUsers || []} color="bg-primary" />
                    <div className="flex justify-between mt-2">
                      {(stats.growth.monthlyUsers || []).map((d, i) => (
                        <span key={i} className="text-[9px] text-text-secondary">{d.label?.split(' ')[0]}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-card border border-border shadow-card p-5">
                    <h3 className="font-semibold text-primary mb-4">Listing Growth (6 months)</h3>
                    <MiniBar data={stats.growth.monthlyListings || []} color="bg-secondary" />
                    <div className="flex justify-between mt-2">
                      {(stats.growth.monthlyListings || []).map((d, i) => (
                        <span key={i} className="text-[9px] text-text-secondary">{d.label?.split(' ')[0]}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
