const User = require("../models/User.model");
const Preference = require("../models/Preference.model");
const ContactMessage = require("../models/ContactMessage.model");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { calculateCompatibility } = require("../utils/compatibilityEngine");

/* ── Sensitive fields to always exclude from user responses ─
   findByIdAndUpdate() can return the full document including
   fields that are select:false in schema IF they happen to be loaded.
   Explicitly project them out for safety. */
const SAFE_USER_SELECT = "-password -resetPasswordToken -resetPasswordExpire";

/* ══════════════════════════════════════════════════════════
   GET PROFILE  (protected)
   GET /api/v1/users/profile
══════════════════════════════════════════════════════════ */
const getProfile = async (req, res, next) => {
  try {
    /* Explicitly exclude sensitive fields.
       Also populate savedListings but filter out nulls from inactive listings. */
    const [user, preference] = await Promise.all([
      User.findById(req.user._id)
        .select(SAFE_USER_SELECT)
        .populate({
          path: "savedListings",
          select: "title rent city photos roomType status address",
          match: { status: "active" },
          options: { limit: 50 },
        })
        .lean(),
      Preference.findOne({ user: req.user._id }).select("-__v").lean(),
    ]);

    if (!user) return errorResponse(res, 404, "User not found.");

    /* Filter nulls from inactive saved listings */
    user.savedListings = (user.savedListings || []).filter(Boolean);

    return successResponse(res, 200, "Profile retrieved successfully.", {
      user,
      preference: preference || null,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE PROFILE  (protected)
   PUT /api/v1/users/profile
══════════════════════════════════════════════════════════ */
const updateProfile = async (req, res, next) => {
  try {
    /* Strict whitelist — ONLY these fields can be updated via this endpoint.
       Prevents mass assignment of role, isBanned, isVerified, etc. */
    const ALLOWED = ["name", "phone", "city", "bio"];
    const updates = {};

    ALLOWED.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return errorResponse(
        res,
        400,
        `No valid fields provided. Allowed: ${ALLOWED.join(", ")}.`,
      );
    }

    /* Validate name */
    if (updates.name !== undefined) {
      const name = updates.name.trim();
      if (name.length < 3 || name.length > 50) {
        return errorResponse(
          res,
          400,
          "Name must be between 3 and 50 characters.",
        );
      }
      updates.name = name;
    }

    /* Validate phone */
    if (updates.phone !== undefined && updates.phone !== "") {
      const phone = updates.phone.trim();
      if (!/^(\+92|0)[0-9]{10}$/.test(phone)) {
        return errorResponse(
          res,
          400,
          "Please provide a valid Pakistani phone number (e.g. 03001234567).",
        );
      }
      updates.phone = phone;
    }

    if (updates.city !== undefined && !User.PAKISTAN_CITIES.includes(updates.city)) {
      return errorResponse(res, 400, "Please select a valid Pakistani city.");
    }

    /* Validate bio */
    if (updates.bio !== undefined && updates.bio.length > 500) {
      return errorResponse(res, 400, "Bio cannot exceed 500 characters.");
    }

    /* select() the sensitive fields OUT of the returned document.
       findByIdAndUpdate with { new: true } returns the updated doc — ensure
       password is never accidentally included. */
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
        select: SAFE_USER_SELECT,
      },
    );

    if (!user) return errorResponse(res, 404, "User not found.");

    return successResponse(res, 200, "Profile updated successfully.", { user });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE PROFILE PHOTO  (protected)
   PUT /api/v1/users/profile/photo
══════════════════════════════════════════════════════════ */
const updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, "Please upload an image file.");
    }

    const user = await User.findById(req.user._id).select("profilePhoto");
    if (!user) return errorResponse(res, 404, "User not found.");

    /* ── Upload new photo FIRST, THEN delete old one ────────
       Original deleted old photo BEFORE uploading new one.
       If the upload fails, the user is left with NO profile photo.
       Fix: upload first, delete old only on success. */
    let newPhoto;
    try {
      newPhoto = await uploadToCloudinary(
        req.file.buffer,
        "roombridge/avatars",
      );
    } catch (uploadErr) {
      return errorResponse(
        res,
        502,
        `Photo upload failed: ${uploadErr.message}`,
      );
    }

    /* Delete old photo from Cloudinary (non-fatal) */
    if (user.profilePhoto?.public_id) {
      deleteFromCloudinary(user.profilePhoto.public_id).catch((err) =>
        console.error("[Cloudinary] Failed to delete old avatar:", err.message),
      );
    }

    /* Save new photo — use findByIdAndUpdate to avoid pre-save hook */
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "profilePhoto.url": newPhoto.url,
        "profilePhoto.public_id": newPhoto.public_id,
      },
    });

    return successResponse(res, 200, "Profile photo updated successfully.", {
      profilePhoto: newPhoto,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   REMOVE PROFILE PHOTO  (protected)
   DELETE /api/v1/users/profile/photo
══════════════════════════════════════════════════════════ */
const removeProfilePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("profilePhoto");
    if (!user) return errorResponse(res, 404, "User not found.");

    if (!user.profilePhoto?.public_id) {
      return errorResponse(res, 400, "No profile photo to remove.");
    }

    /* Delete from Cloudinary */
    await deleteFromCloudinary(user.profilePhoto.public_id).catch((err) =>
      console.error("[Cloudinary] Failed to delete avatar:", err.message),
    );

    /* Clear photo from user document */
    await User.findByIdAndUpdate(req.user._id, {
      $set: { "profilePhoto.url": "", "profilePhoto.public_id": "" },
    });

    return successResponse(res, 200, "Profile photo removed successfully.");
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET ALL SEEKERS WITH COMPATIBILITY  (owner)
   GET /api/v1/users/seekers
══════════════════════════════════════════════════════════ */
const getAllSeekers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, city } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    /* Get owner's own preference for compatibility scoring */
    const ownerPreference = await Preference.findOne({
      user: req.user._id,
    }).lean();

    /* Build seeker filter */
    const seekerFilter = { role: "seeker", isActive: true, isBanned: false };
    if (city) seekerFilter.city = city;

    const [seekers, totalSeekers] = await Promise.all([
      User.find(seekerFilter)
        .select("name profilePhoto city bio createdAt")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
      User.countDocuments(seekerFilter),
    ]);

    /* N+1 query — original fetched user details inside a loop.
       Fetch ALL seeker preferences in ONE query, build a lookup map. */
    const seekerIds = seekers.map((s) => s._id);
    const seekerPrefs = await Preference.find({
      user: { $in: seekerIds },
    }).lean();
    const prefMap = {};
    seekerPrefs.forEach((p) => {
      prefMap[p.user.toString()] = p;
    });

    /* Calculate compatibility scores */
    const enriched = seekers.map((seeker) => {
      const seekerPref = prefMap[seeker._id.toString()];
      let compatibility = null;

      if (ownerPreference && seekerPref) {
        /* calculateCompatibility() already returns label in result.
           No need to call getCompatibilityLabel() separately. */
        try {
          const result = calculateCompatibility(ownerPreference, seekerPref);
          compatibility = {
            score: result.score,
            label: result.label,
            breakdown: result.breakdown,
          };
        } catch (calcErr) {
          // Malformed preference data — skip compatibility for this seeker
          console.warn(
            `[Compatibility] Failed for seeker ${seeker._id}:`,
            calcErr.message,
          );
        }
      }

      return {
        ...seeker,
        preference: seekerPref || null,
        compatibility: compatibility,
      };
    });

    /* Sort by compatibility score descending; seekers with no score go last */
    enriched.sort((a, b) => {
      const scoreA = a.compatibility?.score ?? -1;
      const scoreB = b.compatibility?.score ?? -1;
      return scoreB - scoreA;
    });

    /* Slice the sorted array to get the correct page items */
    const paginatedSeekers = enriched.slice(skip, skip + limitNum);

    return successResponse(res, 200, "Seekers retrieved successfully.", {
      seekers: paginatedSeekers,
      pagination: {
        total: totalSeekers,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalSeekers / limitNum),
        hasNextPage: pageNum < Math.ceil(totalSeekers / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET SUPPORT ADMIN CONTACT  (protected)
   GET /api/v1/users/support-admin
══════════════════════════════════════════════════════════ */
const getSupportAdmin = async (req, res, next) => {
  try {
    const baseFilter = { role: "admin", isActive: true, isBanned: false };

    let admin = await User.findOne({
      ...baseFilter,
      _id: { $ne: req.user._id },
    })
      .select("_id name profilePhoto role")
      .sort({ createdAt: 1 })
      .lean();

    if (!admin) {
      admin = await User.findOne(baseFilter)
        .select("_id name profilePhoto role")
        .sort({ createdAt: 1 })
        .lean();
    }

    if (!admin) {
      return errorResponse(res, 404, "No active support admin found.");
    }

    return successResponse(res, 200, "Support admin retrieved.", { admin });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   SUBMIT CONTACT MESSAGE  (public)
   POST /api/v1/users/contact
══════════════════════════════════════════════════════════ */
const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message, phone, role } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return errorResponse(
        res,
        400,
        "name, email, subject, and message are required.",
      );
    }

    /* Validate role if provided */
    const validRoles = ["Student", "Owner", "Other", ""];
    const cleanRole = role?.trim() || "";
    if (cleanRole && !validRoles.includes(cleanRole)) {
      return errorResponse(res, 400, "Invalid role. Must be Student, Owner, or Other.");
    }

    const saved = await ContactMessage.create({
      senderUser: req.user?._id,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      phone: phone?.trim() || "",
      role: cleanRole,
    });

    return successResponse(
      res,
      201,
      "Contact message submitted successfully.",
      {
        contactMessageId: saved._id,
      },
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  removeProfilePhoto,
  getAllSeekers,
  getSupportAdmin,
  submitContactMessage,
};
