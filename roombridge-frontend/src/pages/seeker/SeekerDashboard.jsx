import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  RiDashboardLine, RiHeart3Line, RiCalendarCheckLine,
  RiGroupLine, RiMessageLine, RiUserLine, RiLogoutBoxLine,
  RiListCheck, RiHome4Line, RiArrowRightLine, RiLoader4Line,
  RiSearchLine,
} from 'react-icons/ri';
import bookingService from '../../services/bookingService';
import listingService from '../../services/listingService';
import authService from '../../services/authService';
import { logout } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';

document.title = 'Seeker Dashboard — RoomBridge';

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to || '#'}
        className="bg-white rounded-card border border-border p-5 flex items-start gap-4
                   shadow-card hover:shadow-hover transition-all group">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="text-white text-xl" />
    </div>
    <div>
      <p className="text-2xl font-bold text-primary">{value ?? '—'}</p>
      <p className="text-sm text-text-secondary group-hover:text-primary transition-colors">{label}</p>
    </div>
  </Link>
);

const BOOKING_BADGE = {
  pending:   'bg-warning/10 text-warning',
  accepted:  'bg-success/10 text-success',
  rejected:  'bg-error/10 text-error',
  cancelled: 'bg-border text-text-secondary',
};

const SeekerDashboard = () => {
  const { user }  = useSelector(s => s.auth);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [bookings,  setBookings]  = useState([]);
  const [saved,     setSaved]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [sideOpen,  setSideOpen]  = useState(false);

  useEffect(() => {
    Promise.all([
      bookingService.getMyBookings({ limit: 5 }),
      listingService.getSavedListings({ limit: 4 }),
    ]).then(([bRes, sRes]) => {
      /*
        BUG FIX: Backend returns:
        - getMyBookings: { success, bookings, pagination }
        - getSavedListings: { success, listings, pagination }
        Old code: bRes.data and sRes.data → both undefined → empty arrays → zero stats.
      */
      setBookings(
        Array.isArray(bRes.bookings) ? bRes.bookings
        : Array.isArray(bRes.data)   ? bRes.data
        : []
      );
      setSaved(
        Array.isArray(sRes.listings) ? sRes.listings
        : Array.isArray(sRes.data)   ? sRes.data
        : []
      );
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch (_) {}
    dispatch(logout());
    toast.success('Logged out.');
    navigate('/login');
  };

  const pending  = bookings.filter(b => b.status === 'pending').length;
  const accepted = bookings.filter(b => b.status === 'accepted').length;

  const NAV = [
    { to: '/seeker/dashboard',      icon: RiDashboardLine,     label: 'Dashboard' },
    { to: '/listings',              icon: RiSearchLine,        label: 'Browse Rooms' },
    { to: '/seeker/saved',          icon: RiHeart3Line,        label: 'Saved Rooms' },
    { to: '/seeker/requests',       icon: RiCalendarCheckLine, label: 'My Requests' },
    { to: '/seeker/roommate-match', icon: RiGroupLine,         label: 'Roommate Match' },
    { to: '/seeker/messages',       icon: RiMessageLine,       label: 'Messages' },
    { to: '/seeker/profile',        icon: RiUserLine,          label: 'My Profile' },
  ];

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
              <p className="text-white/50 text-xs">Room Seeker</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(s => !s)}
                    aria-label="Toggle sidebar"
                    className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-background transition-colors">
              <RiListCheck className="text-xl" />
            </button>
            <div>
              <h1 className="font-bold text-primary text-lg">Seeker Dashboard</h1>
              <p className="text-text-secondary text-xs">Hello, {user?.name?.split(' ')[0]} 👋</p>
            </div>
          </div>
          <Link to="/listings"
                className="flex items-center gap-2 bg-secondary text-white text-sm font-semibold
                           px-4 py-2 rounded-btn hover:bg-primary transition-colors shadow-card">
            <RiSearchLine /> Browse Rooms
          </Link>
        </header>

        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RiLoader4Line className="animate-spin text-4xl text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={RiCalendarCheckLine} label="Total Requests"    value={bookings.length} color="bg-primary"   to="/seeker/requests" />
                <StatCard icon={RiHome4Line}         label="Pending"           value={pending}         color="bg-warning"   to="/seeker/requests" />
                <StatCard icon={RiHeart3Line}        label="Accepted Bookings" value={accepted}        color="bg-success"   to="/seeker/requests" />
                <StatCard icon={RiGroupLine}         label="Saved Rooms"       value={saved.length}    color="bg-secondary" to="/seeker/saved" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Booking Requests */}
                <div className="bg-white rounded-card border border-border shadow-card">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-semibold text-primary">My Booking Requests</h2>
                    <Link to="/seeker/requests" className="text-xs text-secondary hover:text-primary flex items-center gap-1">
                      View all <RiArrowRightLine />
                    </Link>
                  </div>
                  <div className="divide-y divide-border">
                    {bookings.length === 0 ? (
                      <div className="p-6 text-center text-sm text-text-secondary">
                        No requests yet.{' '}
                        <Link to="/listings" className="text-secondary font-medium">Browse rooms →</Link>
                      </div>
                    ) : bookings.slice(0, 5).map(b => (
                      <div key={b._id} className="flex items-center gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {b.listing?.title || 'Listing'}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {b.listing?.city} · {new Date(b.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize
                                          ${BOOKING_BADGE[b.status] || ''}`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saved Rooms */}
                <div className="bg-white rounded-card border border-border shadow-card">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-semibold text-primary">Saved Rooms</h2>
                    <Link to="/seeker/saved" className="text-xs text-secondary hover:text-primary flex items-center gap-1">
                      View all <RiArrowRightLine />
                    </Link>
                  </div>
                  <div className="divide-y divide-border">
                    {saved.length === 0 ? (
                      <div className="p-6 text-center text-sm text-text-secondary">
                        No saved rooms yet.{' '}
                        <Link to="/listings" className="text-secondary font-medium">Find rooms →</Link>
                      </div>
                    ) : saved.slice(0, 4).map(l => (
                      <Link key={l._id} to={`/listings/${l._id}`}
                            className="flex items-center gap-3 p-4 hover:bg-background transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0 overflow-hidden">
                          {l.photos?.[0]?.url
                            ? <img src={l.photos[0].url} alt={l.title} className="w-10 h-10 rounded-lg object-cover" />
                            : <RiHome4Line className="text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">{l.title}</p>
                          <p className="text-xs text-text-secondary">
                            {l.city} · PKR {(l.rent || 0).toLocaleString()}/mo
                          </p>
                        </div>
                        <RiArrowRightLine className="text-text-secondary text-sm shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SeekerDashboard;
