const User = require("../models/User.model");
const Listing = require("../models/Listing.model");
const Booking = require("../models/Booking.model");
const Message = require("../models/Message.model");
const Report = require("../models/Report.model");
const ContactMessage = require("../models/ContactMessage.model");
const Preference = require("../models/Preference.model");
const { statsCache } = require("../utils/cache");
const { deleteFromCloudinary } = require("../config/cloudinary");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/apiResponse");
const {
  sendEmail,
  adminNotificationEmail,
  maintenanceEmail,
  errorAlertEmail,
  listingRejectedEmail,
  listingDeactivatedEmail,
  listingApprovedEmail,
  newRoomAlertEmail,
} = require("../utils/sendEmail");
const Subscription = require("../models/Subscription.model");

/* ── Fire-and-forget email helper ────────────────────────── */
const sendEmailSafe = (opts, label = "admin email") =>
  sendEmail(opts).catch((err) =>
    console.error(`[Admin] ${label} failed:`, err.message),
  );

/* ── Notify subscribers of new active listings ─────────────── */
const notifySubscribersOfNewRoom = async (listing) => {
  try {
    const subs = await Subscription.find({ isActive: true });
    if (!subs || subs.length === 0) return;

    const subject = `🏠 New Room Alert in ${listing.city} — "${listing.title}"`;
    const html = newRoomAlertEmail(listing);

    subs.forEach((sub) => {
      sendEmailSafe(
        {
          to: sub.email,
          subject,
          html,
        },
        `room alert to ${sub.email}`
      );
    });
  } catch (err) {
    console.error("❌ Failed to notify alert subscribers:", err.message);
  }
};

/* ── Safe integer parse ─────────────────────────────────── */
const safeInt = (val, fallback, min, max) => {
  const n = parseInt(val, 10);
  if (isNaN(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
};

const VALID_STATUSES = ["pending", "active", "inactive", "rejected"];
const VALID_BOOKING_STATUSES = ["pending", "accepted", "rejected", "cancelled"];
const VALID_REPORT_STATUSES = ["pending", "reviewed", "resolved", "dismissed"];
const VALID_CONTACT_STATUSES = ["new", "in_progress", "resolved"];

/* Parse optional boolean from JSON/body inputs.
   Returns true/false when valid, undefined when omitted, null when invalid. */
const parseOptionalBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  return null;
};

/* ══════════════════════════════════════════════════════════
   DASHBOARD STATS
   GET /api/v1/admin/stats
══════════════════════════════════════════════════════════ */
const getDashboardStats = async (req, res, next) => {
  try {
    const cached = statsCache.get("admin:stats");
    if (cached) {
      return successResponse(res, 200, "Dashboard stats retrieved.", cached);
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    /* Build 6-month label/boundary array for charts */
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString("default", { month: "short", year: "numeric" }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }

    const [userResult, listingResult, bookingResult, reportsResult, contactResult, totalMessages] = await Promise.all([
      /* Users Facet Aggregation */
      User.aggregate([
        {
          $facet: {
            total: [ { $count: "count" } ],
            seekers: [ { $match: { role: "seeker" } }, { $count: "count" } ],
            owners: [ { $match: { role: "owner" } }, { $count: "count" } ],
            admins: [ { $match: { role: "admin" } }, { $count: "count" } ],
            recent: [ { $match: { createdAt: { $gte: sevenDaysAgo } } }, { $count: "count" } ],
            growth: [
              { $match: { createdAt: { $gte: months[0].start } } },
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]),

      /* Listings Facet Aggregation */
      Listing.aggregate([
        {
          $facet: {
            total: [ { $count: "count" } ],
            active: [ { $match: { status: "active" } }, { $count: "count" } ],
            pending: [ { $match: { status: "pending" } }, { $count: "count" } ],
            rejected: [ { $match: { status: "rejected" } }, { $count: "count" } ],
            inactive: [ { $match: { status: "inactive" } }, { $count: "count" } ],
            recent: [ { $match: { createdAt: { $gte: sevenDaysAgo } } }, { $count: "count" } ],
            growth: [
              { $match: { createdAt: { $gte: months[0].start } } },
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]),

      /* Bookings Facet Aggregation */
      Booking.aggregate([
        {
          $facet: {
            total: [ { $count: "count" } ],
            pending: [ { $match: { status: "pending" } }, { $count: "count" } ],
            accepted: [ { $match: { status: "accepted" } }, { $count: "count" } ],
            rejected: [ { $match: { status: "rejected" } }, { $count: "count" } ],
            cancelled: [ { $match: { status: "cancelled" } }, { $count: "count" } ]
          }
        }
      ]),

      /* Reports Facet Aggregation */
      Report.aggregate([
        {
          $facet: {
            total: [ { $count: "count" } ],
            pending: [ { $match: { status: "pending" } }, { $count: "count" } ]
          }
        }
      ]),

      /* Contact Messages Facet Aggregation */
      ContactMessage.aggregate([
        {
          $facet: {
            total: [ { $count: "count" } ],
            new: [ { $match: { status: "new" } }, { $count: "count" } ]
          }
        }
      ]),

      /* Messages countDocuments */
      Message.countDocuments()
    ]);

    // Helpers to safely parse count results
    const getCount = (resArray, key) => resArray?.[0]?.[key]?.[0]?.count || 0;
    const getGrowth = (resArray, key) => resArray?.[0]?.[key] || [];

    const monthlyUserGrowth = getGrowth(userResult, "growth");
    const monthlyListingGrowth = getGrowth(listingResult, "growth");

    /* Map aggregation results to chart-friendly arrays */
    const userGrowthMap = Object.fromEntries(
      monthlyUserGrowth.map((m) => [m._id, m.count])
    );
    const listingGrowthMap = Object.fromEntries(
      monthlyListingGrowth.map((m) => [m._id, m.count])
    );

    const monthlyUsers = months.map((m) => ({
      label: m.label,
      count: userGrowthMap[m.key] || 0,
    }));
    const monthlyListings = months.map((m) => ({
      label: m.label,
      count: listingGrowthMap[m.key] || 0,
    }));

    const statsData = {
      users: {
        total: getCount(userResult, "total"),
        seekers: getCount(userResult, "seekers"),
        owners: getCount(userResult, "owners"),
        admins: getCount(userResult, "admins"),
      },
      listings: {
        total: getCount(listingResult, "total"),
        active: getCount(listingResult, "active"),
        pending: getCount(listingResult, "pending"),
        rejected: getCount(listingResult, "rejected"),
        inactive: getCount(listingResult, "inactive"),
      },
      bookings: {
        total: getCount(bookingResult, "total"),
        pending: getCount(bookingResult, "pending"),
        accepted: getCount(bookingResult, "accepted"),
        rejected: getCount(bookingResult, "rejected"),
        cancelled: getCount(bookingResult, "cancelled"),
      },
      messages: { total: totalMessages },
      contactMessages: {
        total: getCount(contactResult, "total"),
        new: getCount(contactResult, "new"),
      },
      reports: {
        total: getCount(reportsResult, "total"),
        pending: getCount(reportsResult, "pending"),
      },
      recent: {
        newUsersLast7: getCount(userResult, "recent"),
        newListingsLast7: getCount(listingResult, "recent"),
      },
      growth: { monthlyUsers, monthlyListings },
    };

    statsCache.set("admin:stats", statsData);

    return successResponse(res, 200, "Dashboard stats retrieved.", statsData);
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
      search,
      role,
      city,
      isActive,
      isBanned,
      sortBy = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 20, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (role && ["seeker", "owner", "admin"].includes(role)) filter.role = role;
    if (city) filter.city = city;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isBanned !== undefined) filter.isBanned = isBanned === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
      role: { role: 1 },
    };
    const sort = sortMap[sortBy] || sortMap.newest;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpire")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Users retrieved.",
      users,
      pageNum,
      limitNum,
      total,
    );
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
    const parsedIsBanned = parseOptionalBoolean(isBanned);
    const parsedIsActive = parseOptionalBoolean(isActive);

    if (parsedIsBanned === null) {
      return errorResponse(res, 400, "isBanned must be a boolean.");
    }
    if (parsedIsActive === null) {
      return errorResponse(res, 400, "isActive must be a boolean.");
    }
    if (parsedIsBanned === undefined && parsedIsActive === undefined) {
      return errorResponse(
        res,
        400,
        "Provide at least one field to update: isBanned or isActive.",
      );
    }

    const user = await User.findById(req.params.id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );
    if (!user) return errorResponse(res, 404, "User not found.");
    if (user.role === "admin")
      return errorResponse(res, 403, "Cannot modify other admin accounts.");

    /* Prevent an admin from modifying themselves (extra safety) */
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(
        res,
        403,
        "Cannot modify your own account status from admin panel.",
      );
    }

    if (parsedIsBanned !== undefined) {
      user.isBanned = parsedIsBanned;
      user.bannedReason = user.isBanned
        ? (bannedReason || "Violation of platform rules.").toString().trim()
        : "";
    }
    if (parsedIsActive !== undefined) {
      user.isActive = parsedIsActive;
    }

    await user.save({ validateBeforeSave: false });

    const statusStr = user.isBanned
      ? "banned"
      : user.isActive
        ? "activated"
        : "deactivated";
    return successResponse(res, 200, `User ${statusStr} successfully.`, {
      user,
    });
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
    if (!user) return errorResponse(res, 404, "User not found.");
    if (user.role === "admin")
      return errorResponse(res, 403, "Cannot delete admin accounts.");

    /* ── Collect all Cloudinary photo IDs to delete ─────── */
    const userListings = await Listing.find({ owner: user._id }).select(
      "_id photos",
    );
    const photoIds = [];
    userListings.forEach((l) =>
      l.photos?.forEach((p) => p.public_id && photoIds.push(p.public_id)),
    );
    if (user.profilePhoto?.public_id)
      photoIds.push(user.profilePhoto.public_id);

    const listingIds = userListings.map((l) => l._id);

    /* When listings are deleted, other users' savedListings arrays
       will have dangling ObjectId references. Clean them up. */
    if (listingIds.length > 0) {
      await User.updateMany(
        { savedListings: { $in: listingIds } },
        { $pull: { savedListings: { $in: listingIds } } },
      );
    }

    /* Remove this user from savedBy arrays on all listings they saved */
    await Listing.updateMany(
      { savedBy: user._id },
      { $pull: { savedBy: user._id } },
    );

    /* ── BUG FIX: Cancel active bookings before cascading ────────
       Instead of hard-deleting active bookings, mark them as 'cancelled' first
       so the other active party (seeker or owner) retains the booking record
       with a clear explanation note. */
    await Booking.updateMany(
      { owner: user._id, status: { $in: ["pending", "accepted"] } },
      {
        $set: {
          status: "cancelled",
          ownerNote: "The owner's account has been removed from the platform.",
        },
      },
    );
    await Booking.updateMany(
      { seeker: user._id, status: { $in: ["pending", "accepted"] } },
      {
        $set: {
          status: "cancelled",
          ownerNote: "The seeker's account has been removed from the platform.",
        },
      },
    );

    /* Cascade delete everything in parallel */
    await Promise.all([
      /* Cloudinary photos (non-fatal — use allSettled) */
      ...photoIds.map((pid) => deleteFromCloudinary(pid).catch(() => {})),
      /* Data records. Do not delete bookings that are now marked 'cancelled'
         so the other active party can still view them in their history. */
      Listing.deleteMany({ owner: user._id }),
      Booking.deleteMany({
        $or: [{ seeker: user._id }, { owner: user._id }],
        status: { $nin: ["cancelled"] },
      }),
      Message.deleteMany({
        $or: [{ sender: user._id }, { receiver: user._id }],
      }),
      Preference.deleteOne({ user: user._id }),
      Report.deleteMany({ reporter: user._id }),
      /* Delete the user last */
      User.findByIdAndDelete(user._id),
    ]);

    return successResponse(
      res,
      200,
      `User "${user.name}" and all related data deleted successfully.`,
    );
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
    const pageNum = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 20, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && VALID_STATUSES.includes(status)) filter.status = status;
    if (city) filter.city = city;
    if (owner) filter.owner = owner;

    /* $text search throws if no text index exists AND does not support
       all query operator combinations. Use $regex for admin search — it's more
       flexible and works without a text index on every field. */
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { address: { $regex: search.trim(), $options: "i" } },
        { city: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("owner", "name email profilePhoto")
        .lean(),
      Listing.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Listings retrieved.",
      listings,
      pageNum,
      limitNum,
      total,
    );
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

    if (!["active", "rejected", "inactive"].includes(status)) {
      return errorResponse(
        res,
        400,
        "Status must be active, rejected, or inactive.",
      );
    }

    const listing = await Listing.findById(req.params.id).populate(
      "owner",
      "name email",
    );
    if (!listing) return errorResponse(res, 404, "Listing not found.");

    const prevStatus = listing.status;
    listing.status = status;
    listing.rejectionReason =
      status === "rejected"
        ? rejectionReason || "Does not meet platform guidelines."
        : undefined;

    await listing.save({ validateBeforeSave: false });

    if (prevStatus !== status && status === "active") {
      notifySubscribersOfNewRoom(listing);
    }

    if (listing.owner?.email && prevStatus !== status) {
      if (status === "active") {
        sendEmailSafe(
          {
            to: listing.owner.email,
            subject: `✅ Listing Approved — "${listing.title}"`,
            html: listingApprovedEmail(listing.owner.name, listing.title, listing._id),
          },
          `approval to ${listing.owner.email}`,
        );
      } else if (status === "rejected") {
        sendEmailSafe(
          {
            to: listing.owner.email,
            subject: `❌ Listing Declined — "${listing.title}"`,
            html: listingRejectedEmail(listing.owner.name, listing.title, listing.rejectionReason),
          },
          `rejection to ${listing.owner.email}`,
        );
      } else if (status === "inactive") {
        sendEmailSafe(
          {
            to: listing.owner.email,
            subject: `⚠️ Listing Deactivated — "${listing.title}"`,
            html: listingDeactivatedEmail(listing.owner.name, listing.title),
          },
          `deactivation to ${listing.owner.email}`,
        );
      }
    }

    return successResponse(res, 200, `Listing status updated to "${status}".`, {
      listing,
    });
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
    const listing = await Listing.findById(req.params.id).populate(
      "owner",
      "name email",
    );
    if (!listing) return errorResponse(res, 404, "Listing not found.");

    /* Delete photos from Cloudinary (non-fatal) */
    if (listing.photos?.length > 0) {
      await Promise.allSettled(
        listing.photos.map((p) => deleteFromCloudinary(p.public_id)),
      );
    }

    /* Cancel active bookings instead of hard-deleting.
       This preserves booking history and lets seekers know the listing was removed. */
    await Booking.updateMany(
      { listing: listing._id, status: { $in: ["pending", "accepted"] } },
      {
        $set: {
          status: "cancelled",
          ownerNote: "The listing was removed by an administrator.",
        },
      },
    );

    /* Remove this listing from all users' savedListings arrays */
    await User.updateMany(
      { savedListings: listing._id },
      { $pull: { savedListings: listing._id } },
    );

    /* Delete the listing document */
    await listing.deleteOne();

    return successResponse(res, 200, "Listing deleted successfully.");
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
    const pageNum = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 20, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && VALID_REPORT_STATUSES.includes(status))
      filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("reporter", "name email profilePhoto")
        .populate("reportedUser", "name email profilePhoto")
        .populate({
          path: "reportedListing",
          select: "title city rent status owner photos",
          populate: { path: "owner", select: "name email" },
        })
        .populate("resolvedBy", "name email")
        .lean(),
      Report.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Reports retrieved.",
      reports,
      pageNum,
      limitNum,
      total,
    );
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

    if (!["reviewed", "resolved", "dismissed"].includes(status)) {
      return errorResponse(
        res,
        400,
        "Status must be 'reviewed', 'resolved', or 'dismissed'.",
      );
    }

    const report = await Report.findById(req.params.id);
    if (!report) return errorResponse(res, 404, "Report not found.");

    /* Original only allowed updating 'pending' reports.
       Admins should be able to move from 'reviewed' → 'resolved' or 'dismissed'. */
    if (report.status === "resolved" || report.status === "dismissed") {
      return errorResponse(
        res,
        400,
        `This report has already been ${report.status}.`,
      );
    }

    report.status = status;
    report.adminNote = adminNote
      ? adminNote.toString().trim().slice(0, 500)
      : report.adminNote || "";
    report.resolvedBy = req.user._id;
    /* pre('save') hook also sets resolvedAt for resolved/dismissed, but we
       set it explicitly here for clarity and for 'reviewed' status: */
    if (["resolved", "dismissed"].includes(status)) {
      report.resolvedAt = new Date();
    }

    await report.save();

    return successResponse(res, 200, `Report ${status} successfully.`, {
      report,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE REPORT (admin)
   DELETE /api/v1/admin/reports/:id
══════════════════════════════════════════════════════════ */
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).select("_id");
    if (!report) return errorResponse(res, 404, "Report not found.");

    await report.deleteOne();

    return successResponse(res, 200, "Report deleted successfully.");
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET CONTACT MESSAGES (admin)
   GET /api/v1/admin/contact-messages
══════════════════════════════════════════════════════════ */
const getContactMessages = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 20, 1, 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && VALID_CONTACT_STATUSES.includes(status)) {
      filter.status = status;
    }
    if (search?.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
      ];
    }

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("senderUser", "_id name email role profilePhoto")
        .populate("resolvedBy", "_id name")
        .lean(),
      ContactMessage.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Contact messages retrieved.",
      messages,
      pageNum,
      limitNum,
      total,
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE CONTACT MESSAGE STATUS (admin)
   PUT /api/v1/admin/contact-messages/:id
══════════════════════════════════════════════════════════ */
const updateContactMessageStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;

    if (!VALID_CONTACT_STATUSES.includes(status)) {
      return errorResponse(
        res,
        400,
        "Status must be one of: new, in_progress, resolved.",
      );
    }

    const message = await ContactMessage.findById(req.params.id);
    if (!message) return errorResponse(res, 404, "Contact message not found.");

    message.status = status;
    message.adminNote = adminNote
      ? adminNote.toString().trim().slice(0, 500)
      : message.adminNote || "";

    if (status === "resolved") {
      message.resolvedBy = req.user._id;
      message.resolvedAt = new Date();
    } else if (status === "new") {
      message.resolvedBy = undefined;
      message.resolvedAt = undefined;
    }

    await message.save();

    return successResponse(res, 200, "Contact message updated.", { message });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE CONTACT MESSAGE (admin)
   DELETE /api/v1/admin/contact-messages/:id
══════════════════════════════════════════════════════════ */
const deleteContactMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id).select("_id");
    if (!message) return errorResponse(res, 404, "Contact message not found.");

    await message.deleteOne();

    return successResponse(res, 200, "Contact message deleted successfully.");
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
    const pageNum = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 20, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && VALID_BOOKING_STATUSES.includes(status))
      filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("listing", "title city rent photos address")
        .populate("seeker", "name email profilePhoto phone")
        .populate("owner", "name email profilePhoto phone")
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Bookings retrieved.",
      bookings,
      pageNum,
      limitNum,
      total,
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET RECIPIENT COUNT
   GET /api/v1/admin/notifications/recipient-count
══════════════════════════════════════════════════════════ */
const getRecipientCount = async (req, res, next) => {
  try {
    const { type } = req.query;
    const VALID_TYPES = ["all", "users", "owners", "admins", "single"];
    if (!VALID_TYPES.includes(type)) {
      return errorResponse(res, 400, "Invalid recipient type.");
    }

    let count = 0;
    if (type === "all") {
      count = await User.countDocuments({ isActive: true, isBanned: false });
    } else if (type === "users") {
      count = await User.countDocuments({ role: "seeker", isActive: true, isBanned: false });
    } else if (type === "owners") {
      count = await User.countDocuments({ role: "owner", isActive: true, isBanned: false });
    } else if (type === "admins") {
      count = await User.countDocuments({ role: "admin", isActive: true });
    } else if (type === "single") {
      count = 1;
    }

    return successResponse(res, 200, "Recipient count retrieved.", { count });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   SEND GENERAL NOTIFICATION (email broadcast)
   POST /api/v1/admin/notifications/send
══════════════════════════════════════════════════════════ */
const sendNotification = async (req, res, next) => {
  try {
    const { subject, message, recipientType, specificUserId } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return errorResponse(res, 400, "Subject and message are required.");
    }

    const VALID_TYPES = ["all", "users", "owners", "admins", "single"];
    if (!VALID_TYPES.includes(recipientType)) {
      return errorResponse(res, 400, "Invalid recipientType.");
    }

    let recipients = [];

    if (recipientType === "single") {
      if (!specificUserId) return errorResponse(res, 400, "Specify a userId for single recipient.");
      const u = await User.findById(specificUserId).select("name email").lean();
      if (!u) return errorResponse(res, 404, "Target user not found.");
      recipients = [u];
    } else {
      const filter = { isActive: true, isBanned: false };
      if (recipientType === "users")   filter.role = "seeker";
      if (recipientType === "owners")  filter.role = "owner";
      if (recipientType === "admins")  filter.role = "admin";
      recipients = await User.find(filter).select("name email").lean();
    }

    if (recipients.length === 0) {
      return successResponse(res, 200, "No recipients found.", { sent: 0, failed: 0 });
    }

    /* Send emails concurrently (non-fatal — collect results) */
    const results = await Promise.allSettled(
      recipients.map((u) =>
        sendEmail({
          to: u.email,
          subject: subject.trim(),
          html: adminNotificationEmail(u.name, subject.trim(), message.trim()),
        }),
      ),
    );

    const sent   = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`[Admin Notification] Sent: ${sent}, Failed: ${failed}`);

    return successResponse(res, 200, `Notification sent to ${sent} recipient(s).`, {
      sent, failed, total: recipients.length,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   SEND MAINTENANCE NOTIFICATION
   POST /api/v1/admin/notifications/maintenance
══════════════════════════════════════════════════════════ */
const sendMaintenanceNotification = async (req, res, next) => {
  try {
    const { startTime, endTime, reason, affectedServices } = req.body;

    if (!startTime || !reason?.trim()) {
      return errorResponse(res, 400, "startTime and reason are required.");
    }

    /* Format date nicely */
    const fmtDate = (d) => {
      if (!d) return null;
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : dt.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
    };

    const payload = {
      startTime: fmtDate(startTime),
      endTime:   fmtDate(endTime),
      reason:    reason.trim(),
      affectedServices: affectedServices?.trim() || "",
    };

    /* Notify ALL active non-banned users */
    const recipients = await User.find({ isActive: true, isBanned: false }).select("name email").lean();

    const results = await Promise.allSettled(
      recipients.map((u) =>
        sendEmail({
          to: u.email,
          subject: "⚠️ RoomBridge — Scheduled Maintenance Notice",
          html: maintenanceEmail(u.name, payload),
        }),
      ),
    );

    const sent   = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return successResponse(res, 200, `Maintenance notice sent to ${sent} user(s).`, {
      sent, failed, total: recipients.length,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   SEND ERROR ALERT (admins only)
   POST /api/v1/admin/notifications/error-alert
══════════════════════════════════════════════════════════ */
const sendErrorAlert = async (req, res, next) => {
  try {
    const { errorType, description, severity = "medium", affectedFeatures } = req.body;

    if (!errorType?.trim() || !description?.trim()) {
      return errorResponse(res, 400, "errorType and description are required.");
    }

    const VALID_SEVERITIES = ["low", "medium", "high", "critical"];
    if (!VALID_SEVERITIES.includes(severity)) {
      return errorResponse(res, 400, "severity must be low, medium, high, or critical.");
    }

    const payload = {
      errorType: errorType.trim(),
      description: description.trim(),
      severity,
      affectedFeatures: affectedFeatures?.trim() || "",
    };

    /* Only notify admin accounts */
    const admins = await User.find({ role: "admin", isActive: true }).select("name email").lean();

    const results = await Promise.allSettled(
      admins.map((u) =>
        sendEmail({
          to: u.email,
          subject: `🚨 [${severity.toUpperCase()}] RoomBridge System Alert — ${errorType.trim()}`,
          html: errorAlertEmail(u.name, payload),
        }),
      ),
    );

    const sent   = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return successResponse(res, 200, `Error alert sent to ${sent} admin(s).`, {
      sent, failed, total: admins.length,
    });
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
  deleteReport,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  getAllBookings,
  getRecipientCount,
  sendNotification,
  sendMaintenanceNotification,
  sendErrorAlert,
};
