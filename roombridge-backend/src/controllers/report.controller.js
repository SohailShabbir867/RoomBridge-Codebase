const Report  = require("../models/Report.model");
const User    = require("../models/User.model");
const Listing = require("../models/Listing.model");
const { successResponse, errorResponse, paginatedResponse } = require("../utils/apiResponse");
const { ERROR_CODES } = require("../utils/errorCodes");

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
      return errorResponse(res, 400, "Description must be between 20 and 1000 characters.");
    }

    // Must have exactly one target
    if (!reportedUser && !reportedListing) {
      return errorResponse(res, 400, "You must report either a user or a listing.");
    }
    if (reportedUser && reportedListing) {
      return errorResponse(res, 400, "A report can target either a user or a listing, not both.");
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
      const listing = await Listing.findById(reportedListing).select("_id owner");
      if (!listing) return errorResponse(res, 404, ERROR_CODES.LISTING_NOT_FOUND);
      // Cannot report your own listing
      if (listing.owner.toString() === req.user._id.toString()) {
        return errorResponse(res, 400, "You cannot report your own listing.");
      }
    }

    // Prevent duplicate / spam reports
    const duplicateFilter = { reporter: req.user._id, status: "pending" };
    if (reportedUser)    duplicateFilter.reportedUser = reportedUser;
    if (reportedListing) duplicateFilter.reportedListing = reportedListing;

    const existing = await Report.findOne(duplicateFilter);
    if (existing) {
      return errorResponse(res, 400, "You have already submitted a pending report for this target.");
    }

    const report = await Report.create({
      reporter:        req.user._id,
      reportedUser:    reportedUser || undefined,
      reportedListing: reportedListing || undefined,
      reason,
      description:     description.trim(),
    });

    return successResponse(res, 201, "Report submitted successfully. Our team will review it.", { report });
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
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const filter = { reporter: req.user._id };
    if (status) filter.status = status;

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

    return paginatedResponse(res, "Your reports retrieved.", reports, pageNum, limitNum, total);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitReport,
  getMyReports,
};
