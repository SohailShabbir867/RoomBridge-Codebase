import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine, RiUserLine, RiCalendarLine, RiCheckLine,
  RiCloseLine, RiLoader4Line, RiHome4Line, RiTimeLine,
} from 'react-icons/ri';

document.title = 'Booking Requests — RoomBridge';

const BADGE = {
  pending:   'bg-warning/10 text-warning border-warning/20',
  accepted:  'bg-success/10 text-success border-success/20',
  rejected:  'bg-error/10 text-error border-error/20',
  cancelled: 'bg-border text-text-secondary border-border',
};

const BookingRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    bookingService.getOwnerBookings()
      .then(res => {
        /*
          BUG FIX: Backend returns { success, bookings, pagination }.
          Old code: res.data → always undefined → always []
        */
        setBookings(
          Array.isArray(res.bookings) ? res.bookings
          : Array.isArray(res.data)   ? res.data
          : []
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id, status) => {
    try {
      setUpdating(id);
      /*
        BUG FIX: bookingService.updateBookingStatus expects (id, { status })
        — an object as second arg, NOT a raw string.
        Old code: bookingService.updateBookingStatus(id, status)  ← WRONG
        New code: bookingService.updateBookingStatus(id, { status }) ← CORRECT
      */
      await bookingService.updateBookingStatus(id, { status });

      setBookings(bs => bs.map(b => {
        if (b._id === id) return { ...b, status };
        /*
          BUG FIX: When a booking is accepted, the backend automatically sets all
          other pending bookings for the SAME listing to 'rejected'.
          Update local state to reflect this so the UI stays consistent
          without requiring a page reload.
        */
        const acceptedListing = bookings.find(x => x._id === id)?.listing?._id;
        if (
          status === 'accepted' &&
          b.status === 'pending' &&
          (b.listing?._id === acceptedListing || b.listing === acceptedListing)
        ) {
          return { ...b, status: 'rejected' };
        }
        return b;
      }));
      toast.success(`Booking ${status}!`);
    } catch (err) {
      /* BUG FIX: err.message undefined on axios errors */
      toast.error(err.response?.data?.message || 'Failed to update booking.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/owner/dashboard"
              className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary transition-colors">
          <RiArrowLeftLine className="text-xl" />
        </Link>
        <div>
          <h1 className="font-bold text-primary">Booking Requests</h1>
          <p className="text-text-secondary text-xs">{bookings.length} total requests</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all','pending','accepted','rejected','cancelled'].map(f => (
            <button key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                                ${filter === f
                                  ? 'bg-primary text-white shadow-card'
                                  : 'bg-white border border-border text-text-secondary hover:text-primary'}`}>
              {f}
              {f !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({bookings.filter(b => b.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiCalendarLine className="text-5xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold text-lg">No booking requests</p>
            <p className="text-text-secondary text-sm">
              {filter === 'all' ? 'Booking requests from seekers will appear here.' : `No ${filter} requests.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => (
              <div key={b._id}
                   className="bg-white rounded-card border border-border shadow-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shrink-0 overflow-hidden">
                      {b.seeker?.profilePhoto?.url
                        ? <img src={b.seeker.profilePhoto.url} alt=""
                               className="w-12 h-12 rounded-full object-cover" />
                        : <RiUserLine className="text-primary text-xl" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-primary">{b.seeker?.name || 'Seeker'}</p>
                      <p className="text-xs text-text-secondary">{b.seeker?.email}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <RiHome4Line className="text-secondary" />
                          {b.listing?.title || 'Unknown listing'}
                        </span>
                        {b.moveInDate && (
                          <span className="flex items-center gap-1">
                            <RiTimeLine className="text-secondary" />
                            Move-in: {new Date(b.moveInDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <RiCalendarLine className="text-secondary" />
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/*
                        BUG FIX: old code was literally: "{b.message}"
                        The curly braces inside the string were just characters — not JSX.
                        This rendered as the literal text "{b.message}" instead of the value.
                      */}
                      {b.message && (
                        <p className="mt-2 text-sm text-text-secondary italic bg-background rounded-input p-2 border border-border">
                          "{b.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 capitalize
                                    ${BADGE[b.status] || ''}`}>
                    {b.status}
                  </span>
                </div>

                {b.status === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <button onClick={() => handleStatus(b._id, 'accepted')}
                            disabled={updating === b._id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn
                                       bg-success text-white text-sm font-medium hover:bg-success/90
                                       disabled:opacity-60 transition-colors">
                      {updating === b._id ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
                      Accept
                    </button>
                    <button onClick={() => handleStatus(b._id, 'rejected')}
                            disabled={updating === b._id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn
                                       border border-error text-error text-sm font-medium hover:bg-error/5
                                       disabled:opacity-60 transition-colors">
                      <RiCloseLine /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingRequests;
