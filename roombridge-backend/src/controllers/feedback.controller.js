const Feedback = require("../models/Feedback.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { sendEmailSafe, feedbackThankYouEmail } = require("../utils/sendEmail");

/* ══════════════════════════════════════════════════════════
   SUBMIT FEEDBACK
   POST /api/v1/feedback
   Protected — any logged-in user
══════════════════════════════════════════════════════════ */
const submitFeedback = async (req, res) => {
  try {
    const { rating, category, message } = req.body;

    if (!rating || !message) {
      return errorResponse(res, 400, "Rating and message are required.");
    }

    const feedback = await Feedback.create({
      userId:   req.user._id,
      name:     req.user.name,
      email:    req.user.email,
      rating:   Number(rating),
      category: category || "general",
      message:  message.trim(),
    });

    /* Send branded thank-you auto-reply */
    sendEmailSafe(
      {
        to:      req.user.email,
        subject: "RoomBridge — Thank You for Your Feedback!",
        html:    feedbackThankYouEmail(req.user.name, Number(rating), category || "general"),
      },
      "feedback thank-you email",
    );

    return successResponse(
      res,
      201,
      "Thank you for your feedback! We appreciate your time.",
      { feedback },
    );
  } catch (err) {
    console.error("[Feedback] Submit error:", err.message);
    return errorResponse(res, 500, "Failed to submit feedback. Please try again.");
  }
};

/* ══════════════════════════════════════════════════════════
   GET ALL FEEDBACK (Admin)
   GET /api/v1/feedback
   Query: status, category, rating, page, limit
══════════════════════════════════════════════════════════ */
const getAllFeedback = async (req, res) => {
  try {
    const {
      status,
      category,
      rating,
      page  = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (rating)   filter.rating   = Number(rating);

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Feedback.countDocuments(filter);

    const feedbacks = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("userId",     "name email role")
      .populate("reviewedBy", "name email");

    /* Summary stats */
    const [stats] = await Feedback.aggregate([
      {
        $group: {
          _id:          null,
          total:        { $sum: 1 },
          avgRating:    { $avg: "$rating" },
          newCount:     { $sum: { $cond: [{ $eq: ["$status", "new"]      }, 1, 0] } },
          reviewedCount:{ $sum: { $cond: [{ $eq: ["$status", "reviewed"] }, 1, 0] } },
          resolvedCount:{ $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        },
      },
    ]);

    return successResponse(res, 200, "Feedback retrieved.", {
      feedbacks,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats: stats || {
        total: 0, avgRating: 0, newCount: 0, reviewedCount: 0, resolvedCount: 0,
      },
    });
  } catch (err) {
    console.error("[Feedback] Get all error:", err.message);
    return errorResponse(res, 500, "Failed to retrieve feedback.");
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE FEEDBACK STATUS (Admin)
   PUT /api/v1/feedback/:id
══════════════════════════════════════════════════════════ */
const updateFeedbackStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return errorResponse(res, 404, "Feedback not found.");

    if (status)    feedback.status    = status;
    if (adminNote !== undefined) feedback.adminNote = adminNote;

    if (status && status !== "new") {
      feedback.reviewedBy = req.user._id;
      feedback.reviewedAt = new Date();
    }

    await feedback.save();

    return successResponse(res, 200, "Feedback updated.", { feedback });
  } catch (err) {
    console.error("[Feedback] Update error:", err.message);
    return errorResponse(res, 500, "Failed to update feedback.");
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE FEEDBACK (Admin)
   DELETE /api/v1/feedback/:id
══════════════════════════════════════════════════════════ */
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return errorResponse(res, 404, "Feedback not found.");

    return successResponse(res, 200, "Feedback deleted successfully.");
  } catch (err) {
    console.error("[Feedback] Delete error:", err.message);
    return errorResponse(res, 500, "Failed to delete feedback.");
  }
};

module.exports = {
  submitFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
};
