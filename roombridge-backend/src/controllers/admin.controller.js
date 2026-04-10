const User       = require('../models/User.model');
const Listing    = require('../models/Listing.model');
const Booking    = require('../models/Booking.model');
const Message    = require('../models/Message.model');
const Report     = require('../models/Report.model');
const Preference = require('../models/Preference.model');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { sendEmail } = require('../utils/sendEmail');

/* ── Fire-and-forget email helper ────────────────────────── */
const sendEmailSafe = (opts, label = 'admin email') =>
  sendEmail(opts).catch(err => console.error(`[Admin] ${label} failed:`, err.message));

/* ── Safe integer parse ─────────────────────────────────── */
const safeInt = (val, fallback, min, max) => {
  const n = parseInt(val, 10);
  if (isNaN(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
};

const VALID_STATUSES        = ['pending', 'active', 'inactive', 'rejected'];
const VALID_BOOKING_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'];
const VALID_REPORT_STATUSES  = ['pending', 'reviewed', 'resolved', 'dismissed'];

/* ══════════════════════════════════════════════════════════
   DASHBOARD STATS
   GET /api/v1/admin/stats
══════════════════════════════════════════════════════════ */
const getDashboardStats = async (req, res, next) => {
  try {
    const now         = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    /* Build 6-month label/boundary array for charts */
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        start: d,
        end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }

    /* All counts fetched in ONE parallel Promise.all — no sequential awaits */
    const [
      totalUsers, seekerCount, ownerCount, adminCount,
      totalListings, activeListings, pendingListings, rejectedListings, inactiveListings,
      totalBookings, pendingBookings, acceptedBookings, rejectedBookings, cancelledBookings,
      totalMessages,
      totalReports, pendingReports,
      newUsersLast7, newListingsLast7,
      monthlyUserGrowth, monthlyListingGrowth,
    ] = await Promise.all([
      /* Users */
      User.countDocuments(),
      User.countDocuments({ role: 'seeker' }),
      User.countDocuments({ role: 'owner'  }),
      User.countDocuments({ role: 'admin'  }),
      /* Listings */
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active'   }),
      Listing.countDocuments({ status: 'pending'  }),
      Listing.countDocuments({ status: 'rejected' }),
      Listing.countDocuments({ status: 'inactive' }),
      /* Bookings */
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending'   }),
      Booking.countDocuments({ status: 'accepted'  }),
      Booking.countDocuments({ status: 'rejected'  }),
      Booking.countDocuments({ status: 'cancelled' }),
      /* Messages */
      Message.countDocuments(),
      /* Reports */
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      /* Recent activity */
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Listing.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      /* Monthly growth aggregations */
      User.aggregate([
        { $match: { createdAt: { $gte: months[0].start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Listing.aggregate([
        { $match: { createdAt: { $gte: months[0].start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    /* Map aggregation results to chart-friendly arrays */
    const userGrowthMap    = Object.fromEntries(monthlyUserGrowth.map(m    => [m._id, m.count]));
    const listingGrowthMap = Object.fromEntries(monthlyListingGrowth.map(m => [m._id, m.count]));

    const monthlyUsers    = months.map(m => ({ label: m.label, count: userGrowthMap[m.key]    || 0 }));
    const monthlyListings = months.map(m => ({ label: m.label, count: listingGrowthMap[m.key] || 0 }));

    return successResponse(res, 200, 'Dashboard stats retrieved.', {
      users:    { total: totalUsers,    seekers: seekerCount, owners: ownerCount, admins: adminCount },
      listings: { total: totalListings, active: activeListings, pending: pendingListings, rejected: rejectedListings, inactive: inactiveListings },
      bookings: { total: totalBookings, pending: pendingBookings, accepted: acceptedBookings, rejected: rejectedBookings, cancelled: cancelledBookings },
      messages: { total: totalMessages },
      reports:  { total: totalReports, pending: pendingReports },
      recent:   { newUsersLast7, newListingsLast7 },
      growth:   { monthlyUsers, monthlyListings },
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET ALL USERS
   GET /api/v1/admin/users
══════════════════════════════════════════════════════════ */
const getAllUsers = async (req, res, next) => {
  try {
    const {
      search, role, city,
      isActive, isBanned,
      sortBy = 'newest',
      page = 1, limit = 20,
    } = req.query;

    const pageNum  = safeInt(page,  1,  1);
    const limitNum = safeInt(limit, 20, 1, 50);
    const skip     = (pageNum - 1) * limitNum;

    const filter = {};
    if (role   && ['seeker','owner','admin'].includes(role)) filter.role   = role;
    if (city)  filter.city     = city;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isBanned !== undefined) filter.isBanned = isBanned === 'true';

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt:  1 },
      name:   { name:  1 },
      role:   { role:  1 },
    };
    const sort = sortMap[sortBy] || sortMap.newest;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Users retrieved.', users, pageNum, limitNum, total);
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE USER STATUS (ban / unban / deactivate)
   PUT /api/v1/admin/users/:id/status
══════════════════════════════════════════════════════════ */
const updateUserStatus = async (req, res, next) => {
  try {
    const { isBanned, bannedReason, isActive } = req.body;

    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) return errorResponse(res, 404, 'User not found.');
    if (user.role === 'admin') return errorResponse(res, 403, 'Cannot modify other admin accounts.');

    /* Prevent an admin from modifying themselves (extra safety) */
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 403, 'Cannot modify your own account status from admin panel.');
    }

    if (isBanned !== undefined) {
      user.isBanned     = Boolean(isBanned);
      user.bannedReason = user.isBanned ? (bannedReason || 'Violation of platform rules.') : '';
    }
    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    await user.save({ validateBeforeSave: false });

    const statusStr = user.isBanned ? 'banned' : (user.isActive ? 'activated' : 'deactivated');
    return successResponse(res, 200, `User ${statusStr} successfully.`, { user });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE USER (cascade all related data)
   DELETE /api/v1/admin/users/:id
══════════════════════════════════════════════════════════ */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, 'User not found.');
    if (user.role === 'admin') return errorResponse(res, 403, 'Cannot delete admin accounts.');

    /* ── Collect all Cloudinary photo IDs to delete ─────── */
    const userListings = await Listing.find({ owner: user._id }).select('_id photos');
    const photoIds     = [];
    userListings.forEach(l => l.photos?.forEach(p => p.public_id && photoIds.push(p.public_id)));
    if (user.profilePhoto?.public_id) photoIds.push(user.profilePhoto.public_id);

    const listingIds = userListings.map(l => l._id);

    /* BUG FIX: When listings are deleted, other users' savedListings arrays
       will have dangling ObjectId references. Clean them up. */
    if (listingIds.length > 0) {
      await User.updateMany(
        { savedListings: { $in: listingIds } },
        { $pull: { savedListings: { $in: listingIds } } }
      );
    }

    /* BUG FIX: Remove this user from savedBy arrays on all listings they saved */
    await Listing.updateMany(
      { savedBy: user._id },
      { $pull: { savedBy: user._id } }
    );

    /* Cascade delete everything in parallel */
    await Promise.all([
      /* Cloudinary photos (non-fatal — use allSettled) */
      ...photoIds.map(pid => deleteFromCloudinary(pid).catch(() => {})),
      /* Data records */
      Listing.deleteMany(   { owner:    user._id }),
      Booking.deleteMany(   { $or: [{ seeker: user._id }, { owner: user._id }] }),
      Message.deleteMany(   { $or: [{ sender: user._id }, { receiver: user._id }] }),
      Preference.deleteOne( { user:     user._id }),
      Report.deleteMany(    { reporter: user._id }),
      /* Delete the user last */
      User.findByIdAndDelete(user._id),
    ]);

    return successResponse(res, 200, `User "${user.name}" and all related data deleted successfully.`);
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET ALL LISTINGS (admin — any status)
   GET /api/v1/admin/listings
══════════════════════════════════════════════════════════ */
const getAllListingsAdmin = async (req, res, next) => {
  try {
    const { status, city, owner, search, page = 1, limit = 20 } = req.query;
    const pageNum  = safeInt(page,  1,  1);
    const limitNum = safeInt(limit, 20, 1, 50);
    const skip     = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && VALID_STATUSES.includes(status)) filter.status = status;
    if (city)   filter.city  = city;
    if (owner)  filter.owner = owner;

    /* BUG FIX: $text search throws if no text index exists AND does not support
       all query operator combinations. Use $regex for admin search — it's more
       flexible and works without a text index on every field. */
    if (search && search.trim()) {
      filter.$or = [
        { title:   { $regex: search.trim(), $options: 'i' } },
        { address: { $regex: search.trim(), $options: 'i' } },
        { city:    { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name email profilePhoto')
        .lean(),
      Listing.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Listings retrieved.', listings, pageNum, limitNum, total);
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE LISTING STATUS (approve / reject / deactivate)
   PUT /api/v1/admin/listings/:id/status
══════════════════════════════════════════════════════════ */
const updateListingStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['active', 'rejected', 'inactive'].includes(status)) {
      return errorResponse(res, 400, 'Status must be active, rejected, or inactive.');
    }

    const listing = await Listing.findById(req.params.id).populate('owner', 'name email');
    if (!listing) return errorResponse(res, 404, 'Listing not found.');

    const prevStatus          = listing.status;
    listing.status            = status;
    listing.rejectionReason   = status === 'rejected' ? (rejectionReason || 'Does not meet platform guidelines.') : undefined;

    await listing.save({ validateBeforeSave: false });

    /* ── Send notification email to listing owner ────────── */
    if (listing.owner?.email && prevStatus !== status) {
      const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';
      const listingLink = `${CLIENT}/listings/${listing._id}`;
      const dashboardLink = `${CLIENT}/owner/listings`;

      if (status === 'active') {
        /* BUG FIX: was missing .catch() — sendEmail now throws.
           Using sendEmailSafe wrapper. */
        sendEmailSafe({
          to:      listing.owner.email,
          subject: `✅ Listing Approved — "${listing.title}"`,
          html: `
            <div style="font-family:Inter,Arial,sans-serif;color:#374151;">
              <h2 style="color:#10b981;">Your Listing is Live! 🎉</h2>
              <p>Hi <strong>${listing.owner.name}</strong>,</p>
              <p>Your listing <strong>"${listing.title}"</strong> has been reviewed and <strong>approved</strong>. It is now live on RoomBridge and visible to seekers.</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${listingLink}" style="background:#1A3A5C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">View Your Listing</a>
              </div>
            </div>`,
        }, `approval to ${listing.owner.email}`);

      } else if (status === 'rejected') {
        sendEmailSafe({
          to:      listing.owner.email,
          subject: `❌ Listing Declined — "${listing.title}"`,
          html: `
            <div style="font-family:Inter,Arial,sans-serif;color:#374151;">
              <h2 style="color:#ef4444;">Listing Review Update</h2>
              <p>Hi <strong>${listing.owner.name}</strong>,</p>
              <p>Your listing <strong>"${listing.title}"</strong> was reviewed but could not be approved.</p>
              <div style="background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;">
                <strong>Reason:</strong> ${listing.rejectionReason}
              </div>
              <p>Please update your listing and resubmit for review.</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${dashboardLink}" style="background:#1A3A5C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Edit Your Listings</a>
              </div>
            </div>`,
        }, `rejection to ${listing.owner.email}`);

      } else if (status === 'inactive') {
        sendEmailSafe({
          to:      listing.owner.email,
          subject: `Listing Deactivated — "${listing.title}"`,
          html: `
            <div style="font-family:Inter,Arial,sans-serif;color:#374151;">
              <h2 style="color:#f59e0b;">Listing Deactivated</h2>
              <p>Hi <strong>${listing.owner.name}</strong>,</p>
              <p>Your listing <strong>"${listing.title}"</strong> has been deactivated by an admin and is no longer visible to seekers.</p>
              <p>If you believe this is in error, please contact support.</p>
            </div>`,
        }, `deactivation to ${listing.owner.email}`);
      }
    }

    return successResponse(res, 200, `Listing status updated to "${status}".`, { listing });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE LISTING (admin)
   DELETE /api/v1/admin/listings/:id
══════════════════════════════════════════════════════════ */
const deleteListingAdmin = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('owner', 'name email');
    if (!listing) return errorResponse(res, 404, 'Listing not found.');

    /* Delete photos from Cloudinary (non-fatal) */
    if (listing.photos?.length > 0) {
      await Promise.allSettled(
        listing.photos.map(p => deleteFromCloudinary(p.public_id))
      );
    }

    /* BUG FIX: Cancel active bookings instead of hard-deleting.
       This preserves booking history and lets seekers know the listing was removed. */
    await Booking.updateMany(
      { listing: listing._id, status: { $in: ['pending', 'accepted'] } },
      { $set: { status: 'cancelled', ownerNote: 'The listing was removed by an administrator.' } }
    );

    /* BUG FIX: Remove this listing from all users' savedListings arrays */
    await User.updateMany(
      { savedListings: listing._id },
      { $pull: { savedListings: listing._id } }
    );

    /* Delete the listing document */
    await listing.deleteOne();

    return successResponse(res, 200, 'Listing deleted successfully.');
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET ALL REPORTS
   GET /api/v1/admin/reports
══════════════════════════════════════════════════════════ */
const getAllReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum  = safeInt(page,  1,  1);
    const limitNum = safeInt(limit, 20, 1, 50);
    const skip     = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && VALID_REPORT_STATUSES.includes(status)) filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('reporter',        'name email profilePhoto')
        .populate('reportedUser',    'name email profilePhoto')
        .populate('reportedListing', 'title city rent status')
        .populate('resolvedBy',      'name email')
        .lean(),
      Report.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Reports retrieved.', reports, pageNum, limitNum, total);
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   RESOLVE REPORT
   PUT /api/v1/admin/reports/:id
══════════════════════════════════════════════════════════ */
const resolveReport = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;

    if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return errorResponse(res, 400, "Status must be 'reviewed', 'resolved', or 'dismissed'.");
    }

    const report = await Report.findById(req.params.id);
    if (!report) return errorResponse(res, 404, 'Report not found.');

    /* BUG FIX: Original only allowed updating 'pending' reports.
       Admins should be able to move from 'reviewed' → 'resolved' or 'dismissed'. */
    if (report.status === 'resolved' || report.status === 'dismissed') {
      return errorResponse(res, 400, `This report has already been ${report.status}.`);
    }

    report.status    = status;
    report.adminNote = adminNote ? adminNote.toString().trim().slice(0, 500) : report.adminNote || '';
    report.resolvedBy = req.user._id;
    /* pre('save') hook also sets resolvedAt for resolved/dismissed, but we
       set it explicitly here for clarity and for 'reviewed' status: */
    if (['resolved', 'dismissed'].includes(status)) {
      report.resolvedAt = new Date();
    }

    await report.save();

    return successResponse(res, 200, `Report ${status} successfully.`, { report });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET ALL BOOKINGS (admin)
   GET /api/v1/admin/bookings
══════════════════════════════════════════════════════════ */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum  = safeInt(page,  1,  1);
    const limitNum = safeInt(limit, 20, 1, 50);
    const skip     = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && VALID_BOOKING_STATUSES.includes(status)) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('listing', 'title city rent photos address')
        .populate('seeker',  'name email profilePhoto phone')
        .populate('owner',   'name email profilePhoto phone')
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Bookings retrieved.', bookings, pageNum, limitNum, total);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllListingsAdmin,
  updateListingStatus,
  deleteListingAdmin,
  getAllReports,
  resolveReport,
  getAllBookings,
};
