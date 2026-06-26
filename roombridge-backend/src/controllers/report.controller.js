const Report = require("../models/Report.model");
const User = require("../models/User.model");
const Listing = require("../models/Listing.model");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/apiResponse");
const { ERROR_CODES } = require("../utils/errorCodes");
const {
  sendEmail,
  newReportAdminEmail,
  reportAcknowledgmentEmail,
} = require("../utils/sendEmail");

/* ── Fire-and-forget email helper ────────────────────────── */
const sendEmailSafe = (opts, label = "report email") =>
  sendEmail(opts).catch((err) =>
    console.error(`[Report] ${label} failed:`, err.message),
  );

const VALID_REPORT_STATUSES = ["pending", "reviewed", "resolved", "dismissed"];

const safeInt = (val, fallback, min, max) => {
  const n = parseInt(val, 10);
  if (isNaN(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
};

/* ══════════════════════════════════════════════════════════
   SUBMIT REPORT
   POST /api/v1/reports
══════════════════════════════════════════════════════════ */
const submitReport = async (req, res, next) => {
  try {
    const { reason, description, reportedUser, reportedListing } = req.body;

    // Validate required fields
    if (!reason || !description) {
      return errorResponse(res, 400, "Reason and description are required.");
    }

    if (description.trim().length < 20 || description.trim().length > 1000) {
      return errorResponse(
        res,
        400,
        "Description must be between 20 and 1000 characters.",
      );
    }

    // Must have exactly one target
    if (!reportedUser && !reportedListing) {
      return errorResponse(
        res,
        400,
        "You must report either a user or a listing.",
      );
    }
    if (reportedUser && reportedListing) {
      return errorResponse(
        res,
        400,
        "A report can target either a user or a listing, not both.",
      );
    }

    // Cannot report yourself
    if (reportedUser && reportedUser === req.user._id.toString()) {
      return errorResponse(res, 400, "You cannot report yourself.");
    }

    // Validate target exists
    if (reportedUser) {
      const user = await User.findById(reportedUser).select("_id");
      if (!user) return errorResponse(res, 404, ERROR_CODES.USER_NOT_FOUND);
    }
    if (reportedListing) {
      const listing =
        await Listing.findById(reportedListing).select("_id owner");
      if (!listing)
        return errorResponse(res, 404, ERROR_CODES.LISTING_NOT_FOUND);
      // Cannot report your own listing
      if (listing.owner.toString() === req.user._id.toString()) {
        return errorResponse(res, 400, "You cannot report your own listing.");
      }
    }

    // Prevent duplicate / spam reports
    const duplicateFilter = { reporter: req.user._id, status: "pending" };
    if (reportedUser) duplicateFilter.reportedUser = reportedUser;
    if (reportedListing) duplicateFilter.reportedListing = reportedListing;

    const existing = await Report.findOne(duplicateFilter);
    if (existing) {
      return errorResponse(
        res,
        400,
        "You have already submitted a pending report for this target.",
      );
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUser || undefined,
      reportedListing: reportedListing || undefined,
      reason,
      description: description.trim(),
    });

    const [reporterInfo, reportedUserInfo, reportedListingInfo, admins] =
      await Promise.all([
        User.findById(req.user._id).select("name email role city"),
        reportedUser
          ? User.findById(reportedUser).select("name email role city")
          : null,
        reportedListing
          ? Listing.findById(reportedListing)
              .select("title city rent owner")
              .populate("owner", "name email")
          : null,
        User.find({ role: "admin", isActive: true, isBanned: false }).select(
          "email",
        ),
      ]);

    if (admins.length > 0) {
      const reasonLabel =
        {
          spam: "Spam",
          fake: "Fake",
          inappropriate: "Inappropriate",
          scam: "Scam",
          harassment: "Harassment",
          other: "Other",
        }[reason] || reason;

      const targetDetails = reportedUserInfo
        ? `
           <p style="margin:0 0 4px;font-size:14px;color:#334155;"><strong>Email:</strong> ${reportedUserInfo.email || "N/A"}</p>
           <p style="margin:0 0 4px;font-size:14px;color:#334155;"><strong>Role:</strong> ${reportedUserInfo.role || "N/A"}</p>
           <p style="margin:0;font-size:14px;color:#334155;"><strong>City:</strong> ${reportedUserInfo.city || "N/A"}</p>`
        : `
           <p style="margin:0 0 4px;font-size:14px;color:#334155;"><strong>City:</strong> ${reportedListingInfo?.city || "N/A"}</p>
           <p style="margin:0 0 4px;font-size:14px;color:#334155;"><strong>Rent:</strong> PKR ${(reportedListingInfo?.rent || 0).toLocaleString()}</p>
           <p style="margin:0 0 4px;font-size:14px;color:#334155;"><strong>Owner:</strong> ${reportedListingInfo?.owner?.name || "Unknown"}</p>
           <p style="margin:0;font-size:14px;color:#334155;"><strong>Owner Email:</strong> ${reportedListingInfo?.owner?.email || "N/A"}</p>`;

      const targetName = reportedUserInfo
        ? (reportedUserInfo.name || "Unknown")
        : (reportedListingInfo?.title || "Unknown");

      const reporterName = reporterInfo?.name || req.user?.name || "Unknown";
      const reporterEmail = reporterInfo?.email || req.user?.email || "N/A";
      const reporterRole = reporterInfo?.role || req.user?.role || "N/A";

      const emailHtml = newReportAdminEmail(
        reporterName,
        reporterEmail,
        reporterRole,
        reportedUserInfo ? "User" : "Listing",
        targetName,
        targetDetails,
        reasonLabel,
        description.trim(),
        report._id.toString()
      );

      admins.forEach((admin) => {
        if (!admin.email) return;
        sendEmailSafe(
          {
            to: admin.email,
            subject: `🚨 Report: ${reasonLabel} (${report._id.toString().slice(-6)})`,
            html: emailHtml,
          },
          `new report notification to ${admin.email}`,
        );
      });
    }

    if (reporterInfo?.email) {
      sendEmailSafe(
        {
          to: reporterInfo.email,
          subject: "Report Received — RoomBridge Safety Team",
          html: reportAcknowledgmentEmail(reporterInfo.name || "there", report._id.toString()),
        },
        `report acknowledgment to ${reporterInfo.email}`,
      );
    }

    return successResponse(
      res,
      201,
      "Report submitted successfully. Our team will review it.",
      { report },
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET MY REPORTS
   GET /api/v1/reports/my-reports
══════════════════════════════════════════════════════════ */
const getMyReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 10, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = { reporter: req.user._id };
    if (status) {
      if (!VALID_REPORT_STATUSES.includes(status)) {
        return errorResponse(
          res,
          400,
          `Invalid status. Allowed values: ${VALID_REPORT_STATUSES.join(", ")}.`,
        );
      }
      filter.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("reportedUser", "name email profilePhoto")
        .populate("reportedListing", "title city rent")
        .lean(),
      Report.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Your reports retrieved.",
      reports,
      pageNum,
      limitNum,
      total,
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitReport,
  getMyReports,
};
