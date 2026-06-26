const Booking = require("../models/Booking.model");
const Listing = require("../models/Listing.model");
const User = require("../models/User.model");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/apiResponse");
const {
  sendEmail,
  bookingAcceptedEmail,
  bookingRejectedEmail,
  newBookingRequestEmail,
  bookingCancelledEmail,
} = require("../utils/sendEmail");

/* ── Whitelist of valid booking statuses for query filters ── */
const VALID_STATUSES = ["pending", "accepted", "rejected", "cancelled"];

/* ── Helper: send fire-and-forget email with error logging ──
   sendEmail() now throws on failure (fixed in sendEmail.js).
   All sendEmail calls in this controller must use .catch() to remain
   non-fatal — a failed email should NEVER crash the booking response. */
const sendEmailSafe = (options, label = "email") => {
  sendEmail(options).catch((err) =>
    console.error(`[Booking] ${label} failed:`, err.message),
  );
};

/* ══════════════════════════════════════════════════════════
   SEND BOOKING REQUEST  (seeker)
   POST /api/v1/bookings
══════════════════════════════════════════════════════════ */
const sendBookingRequest = async (req, res, next) => {
  try {
    const { listingId, message, moveInDate } = req.body;

    /* ── Validate required fields ───────────────────────── */
    if (!listingId) {
      return errorResponse(res, 400, "Listing ID is required.");
    }
    if (!message || message.trim().length < 10) {
      return errorResponse(res, 400, "Message must be at least 10 characters.");
    }
    if (message.trim().length > 500) {
      return errorResponse(res, 400, "Message cannot exceed 500 characters.");
    }

    /* ── Validate move-in date if provided ──────────────── */
    if (moveInDate) {
      const date = new Date(moveInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(date.getTime())) {
        return errorResponse(res, 400, "Invalid move-in date format.");
      }
      if (date < today) {
        return errorResponse(res, 400, "Move-in date cannot be in the past.");
      }
    }

    /* ── Check listing exists and is active ─────────────── */
    const listing = await Listing.findById(listingId).populate(
      "owner",
      "name email _id",
    );

    if (!listing) {
      return errorResponse(res, 404, "Listing not found.");
    }
    if (listing.status !== "active") {
      return errorResponse(
        res,
        400,
        "This listing is not currently accepting booking requests.",
      );
    }

    /* ── Cannot book own listing ────────────────────────── */
    if (listing.owner._id.toString() === req.user._id.toString()) {
      return errorResponse(
        res,
        400,
        "You cannot send a booking request for your own listing.",
      );
    }

    /* ── Prevent duplicate pending/accepted request ─────── */
    const existing = await Booking.findOne({
      listing: listingId,
      seeker: req.user._id,
      status: { $in: ["pending", "accepted"] },
    });
    if (existing) {
      return errorResponse(
        res,
        400,
        existing.status === "pending"
          ? "You already have a pending request for this listing."
          : "You already have an accepted booking for this listing.",
      );
    }

    /* ── Create booking ─────────────────────────────────── */
    let booking;
    try {
      booking = await Booking.create({
        listing: listingId,
        seeker: req.user._id,
        owner: listing.owner._id,
        message: message.trim(),
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
      });
    } catch (createErr) {
      if (createErr.name === "ValidationError") {
        const msgs = Object.values(createErr.errors)
          .map((e) => e.message)
          .join(", ");
        return errorResponse(res, 400, msgs);
      }
      throw createErr;
    }

    /* Temporarily hide listing from public results once a booking request is submitted.
       It becomes visible again if the request is rejected/cancelled/removed. */
    if (listing.status === "active") {
      await Listing.findByIdAndUpdate(listing._id, { status: "inactive" });
    }

    /* Populate for response */
    const populated = await Booking.findById(booking._id)
      .populate("listing", "title city rent photos address")
      .populate("seeker", "name profilePhoto")
      .populate("owner", "name profilePhoto");

    if (listing.owner.email) {
      sendEmailSafe(
        {
          to: listing.owner.email,
          subject: `📬 New Booking Request — "${listing.title}"`,
          html: newBookingRequestEmail(
            listing.owner.name,
            req.user.name,
            listing.title,
            listing.city,
            listing.rent,
            message,
            moveInDate
          ),
        },
        "owner booking notification",
      );
    }

    return successResponse(res, 201, "Booking request sent successfully.", {
      booking: populated,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET SEEKER'S BOOKINGS
   GET /api/v1/bookings/my-requests
══════════════════════════════════════════════════════════ */
const getSeekerBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = { seeker: req.user._id };

    /* validate status param against whitelist */
    if (status && VALID_STATUSES.includes(status)) {
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("listing", "title city rent photos roomType address")
        .populate("owner", "name profilePhoto")
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Booking requests retrieved.",
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
   GET OWNER'S BOOKINGS
   GET /api/v1/bookings/owner-requests
══════════════════════════════════════════════════════════ */
const getOwnerBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, listingId } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = { owner: req.user._id };

    /* validate status param against whitelist */
    if (status && VALID_STATUSES.includes(status)) {
      filter.status = status;
    }

    /* Optional: filter by specific listing */
    if (listingId) {
      filter.listing = listingId;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("listing", "title city rent photos roomType address")
        .populate("seeker", "name profilePhoto city bio")
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Booking requests retrieved.",
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
   UPDATE BOOKING STATUS  (owner)
   PUT /api/v1/bookings/:id/status
══════════════════════════════════════════════════════════ */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, ownerNote } = req.body;
    const sanitizedOwnerNote = (ownerNote || "")
      .toString()
      .trim()
      .slice(0, 500);

    /* Only owner can accept or reject */
    if (!["accepted", "rejected"].includes(status)) {
      return errorResponse(
        res,
        400,
        "Status must be 'accepted' or 'rejected'.",
      );
    }

    const booking = await Booking.findById(req.params.id)
      .populate("listing", "title city rent _id")
      .populate("seeker", "name email _id");

    if (!booking) {
      return errorResponse(res, 404, "Booking not found.");
    }

    /* Ownership check — only the owner of this booking can update it */
    if (booking.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        403,
        "You can only update your own booking requests.",
      );
    }

    /* Can only update PENDING bookings */
    if (booking.status !== "pending") {
      return errorResponse(
        res,
        400,
        `This booking has already been ${booking.status} and cannot be changed.`,
      );
    }

    /* ── Update booking status ──────────────────────────── */
    booking.status = status;
    if (status === "rejected" && !sanitizedOwnerNote) {
      return errorResponse(
        res,
        400,
        "Please provide a rejection reason for the seeker.",
      );
    }
    if (ownerNote !== undefined) {
      booking.ownerNote = sanitizedOwnerNote;
    }
    await booking.save();

    /* ── If accepted: auto-reject all other pending requests ──
       Auto-rejected seekers were getting NO notification.
       Now we fetch their emails and notify each one.
       Uses sendEmailSafe so failures don't break the response. */
    if (status === "accepted") {
      /* Find other pending bookings for this listing */
      const otherBookings = await Booking.find({
        listing: booking.listing._id,
        _id: { $ne: booking._id },
        status: "pending",
      }).populate("seeker", "name email");

      if (otherBookings.length > 0) {
        /* Bulk update status */
        await Booking.updateMany(
          {
            listing: booking.listing._id,
            _id: { $ne: booking._id },
            status: "pending",
          },
          {
            $set: {
              status: "rejected",
              ownerNote: "Another booking was accepted for this listing.",
            },
          },
        );

        /* notify each auto-rejected seeker */
        otherBookings.forEach((otherBooking) => {
          if (otherBooking.seeker?.email) {
            sendEmailSafe(
              {
                to: otherBooking.seeker.email,
                subject: `Booking Update — ${booking.listing.title}`,
                html: bookingRejectedEmail(
                  otherBooking.seeker.name,
                  booking.listing.title,
                ),
              },
              `auto-reject notification to ${otherBooking.seeker.email}`,
            );
          }
        });
      }

      /* Mark listing as inactive after accepting a booking
         so no more requests can come in. Owner can reactivate if the
         accepted seeker cancels later. */
      await Listing.findByIdAndUpdate(booking.listing._id, {
        status: "inactive",
      });
    }

    if (status === "rejected") {
      await Listing.findByIdAndUpdate(booking.listing._id, {
        status: "active",
      });
    }

    /* ── Send email notification to the seeker ──────────── */
    if (booking.seeker?.email) {
      const emailHtml =
        status === "accepted"
          ? bookingAcceptedEmail(booking.seeker.name, booking.listing.title)
          : bookingRejectedEmail(booking.seeker.name, booking.listing.title);

      /* was missing .catch() — sendEmail() throws on failure.
         Using sendEmailSafe wrapper so email failure doesn't crash response. */
      sendEmailSafe(
        {
          to: booking.seeker.email,
          subject: `Booking ${status === "accepted" ? "Accepted ✅" : "Update"} — ${booking.listing.title}`,
          html:
            status === "rejected"
              ? bookingRejectedEmail(
                  booking.seeker.name,
                  booking.listing.title,
                  booking.ownerNote,
                )
              : emailHtml,
        },
        `status update (${status}) to seeker`,
      );
    }

    /* Re-populate for complete response */
    const updated = await Booking.findById(booking._id)
      .populate("listing", "title city rent photos")
      .populate("seeker", "name profilePhoto")
      .populate("owner", "name profilePhoto");

    return successResponse(res, 200, `Booking ${status} successfully.`, {
      booking: updated,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   CANCEL BOOKING  (seeker)
   DELETE /api/v1/bookings/:id
══════════════════════════════════════════════════════════ */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "listing",
      "title _id owner",
    );

    if (!booking) {
      return errorResponse(res, 404, "Booking not found.");
    }

    /* Only the seeker who made the request can cancel */
    if (booking.seeker.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        403,
        "You can only cancel your own booking requests.",
      );
    }

    /* Only PENDING bookings can be cancelled.
       Original was correct here — accepted/rejected/cancelled cannot be
       re-cancelled. But accepted bookings should ALSO be cancellable
       (seeker changed their mind after acceptance).
       Allowing both 'pending' and 'accepted' cancellations: */
    if (!["pending", "accepted"].includes(booking.status)) {
      return errorResponse(
        res,
        400,
        `Cannot cancel a booking that has already been ${booking.status}.`,
      );
    }

    await booking.deleteOne();

    /* Reactivate listing when a pending/accepted booking is cancelled and no active blocker remains. */
    if (booking.listing && ["pending", "accepted"].includes(booking.status)) {
      const listing = await Listing.findById(booking.listing._id);
      if (listing && listing.status === "inactive") {
        const remainingActiveBookings = await Booking.countDocuments({
          listing: booking.listing._id,
          _id: { $ne: booking._id },
          status: { $in: ["pending", "accepted"] },
        });
        if (remainingActiveBookings === 0) {
          await Listing.findByIdAndUpdate(booking.listing._id, {
            status: "active",
          });
        }
      }
    }

    /* Notify owner that the booking was cancelled */
    if (booking.listing?.owner) {
      const owner = await User.findById(booking.listing.owner).select(
        "name email",
      );
      if (owner?.email) {
        sendEmailSafe(
          {
            to: owner.email,
            subject: `❌ Booking Cancelled — "${booking.listing.title}"`,
            html: bookingCancelledEmail(owner.name, req.user.name, booking.listing.title),
          },
          "cancellation notification to owner",
        );
      }
    }

    return successResponse(res, 200, "Booking request removed successfully.");
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   REMOVE BOOKING  (owner)
   DELETE /api/v1/bookings/:id/owner-remove
══════════════════════════════════════════════════════════ */
const ownerRemoveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "listing",
      "_id status",
    );

    if (!booking) {
      return errorResponse(res, 404, "Booking not found.");
    }

    if (booking.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        403,
        "You can only remove booking requests for your own listings.",
      );
    }

    const wasActiveFlowBooking = ["pending", "accepted"].includes(
      booking.status,
    );
    const listingId = booking.listing?._id;

    await booking.deleteOne();

    if (listingId && wasActiveFlowBooking) {
      const otherActive = await Booking.countDocuments({
        listing: listingId,
        status: { $in: ["pending", "accepted"] },
      });
      if (otherActive === 0) {
        await Listing.findByIdAndUpdate(listingId, { status: "active" });
      }
    }

    return successResponse(res, 200, "Booking request removed successfully.");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendBookingRequest,
  getSeekerBookings,
  getOwnerBookings,
  updateBookingStatus,
  cancelBooking,
  ownerRemoveBooking,
};
