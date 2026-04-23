const Preference = require("../models/Preference.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { calculateCompatibility } = require("../utils/compatibilityEngine");

/* Valid enum values — kept in sync with Preference.model.js */
const VALID_SLEEP = ["early", "late", "flexible"];
const VALID_OCC = ["student", "professional"];
const VALID_GENDER = ["male", "female"];
const VALID_GENDER_PREF = ["male", "female", "any"];

/* ══════════════════════════════════════════════════════════
   GET MY PREFERENCES
   GET /api/v1/preferences/me
══════════════════════════════════════════════════════════ */
const getMyPreferences = async (req, res, next) => {
  try {
    const preference = await Preference.findOne({ user: req.user._id })
      .select("-__v")
      .lean();

    return successResponse(
      res,
      200,
      preference ? "Preferences retrieved." : "No preferences set yet.",
      { preference: preference || null },
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   CREATE OR UPDATE PREFERENCES  (upsert)
   POST /api/v1/preferences
══════════════════════════════════════════════════════════ */
const createOrUpdatePreferences = async (req, res, next) => {
  try {
    const {
      sleepSchedule,
      smoker,
      pets,
      cleanliness,
      occupation,
      gender,
      genderPreference,
      ageRange,
      bio,
      budget,
      preferredCity,
    } = req.body;

    /* ── Validate required fields ───────────────────────── */
    if (!sleepSchedule || cleanliness === undefined || !occupation || !gender) {
      return errorResponse(
        res,
        400,
        "sleepSchedule, cleanliness, occupation, and gender are required.",
      );
    }

    if (!VALID_SLEEP.includes(sleepSchedule)) {
      return errorResponse(
        res,
        400,
        `sleepSchedule must be one of: ${VALID_SLEEP.join(", ")}.`,
      );
    }
    if (!VALID_OCC.includes(occupation)) {
      return errorResponse(
        res,
        400,
        `occupation must be one of: ${VALID_OCC.join(", ")}.`,
      );
    }
    if (!VALID_GENDER.includes(gender)) {
      return errorResponse(
        res,
        400,
        `gender must be one of: ${VALID_GENDER.join(", ")}.`,
      );
    }

    const cleanlinessNum = Number(cleanliness);
    if (isNaN(cleanlinessNum) || cleanlinessNum < 1 || cleanlinessNum > 5) {
      return errorResponse(
        res,
        400,
        "cleanliness must be a number between 1 and 5.",
      );
    }

    /* ── Validate optional genderPreference ─────────────── */
    if (
      genderPreference !== undefined &&
      !VALID_GENDER_PREF.includes(genderPreference)
    ) {
      return errorResponse(
        res,
        400,
        `genderPreference must be one of: ${VALID_GENDER_PREF.join(", ")}.`,
      );
    }

    /* ── Build update data ──────────────────────────────── */
    const updateData = {
      sleepSchedule,
      smoker: smoker === true || smoker === "true",
      pets: pets === true || pets === "true",
      cleanliness: cleanlinessNum,
      occupation,
      gender,
      /* genderPreference was entirely missing from the controller.
         The Preference model has this field but it was never read or saved.
         Now correctly included in the upsert payload. */
      genderPreference: genderPreference || "any",
    };

    /* Optional scalar fields — only set when provided */
    if (bio !== undefined)
      updateData.bio = bio.toString().trim().slice(0, 300) || undefined;
    if (budget !== undefined) updateData.budget = Number(budget) || undefined;
    if (preferredCity !== undefined && preferredCity !== "") {
      updateData.preferredCity = preferredCity;
    }

    /* ── Handle ageRange ────────────────────────────────── */
    if (ageRange !== undefined && ageRange !== null) {
      /* JSON.parse was unguarded — malformed string threw 500.
         Now returns a clear 400 validation error. */
      let parsed = ageRange;
      if (typeof ageRange === "string") {
        try {
          parsed = JSON.parse(ageRange);
        } catch {
          return errorResponse(
            res,
            400,
            "ageRange must be a valid JSON object with min and max fields.",
          );
        }
      }
      if (parsed && typeof parsed === "object") {
        const minAge = Number(parsed.min);
        const maxAge = Number(parsed.max);
        if (!isNaN(minAge) && !isNaN(maxAge)) {
          if (minAge > maxAge) {
            return errorResponse(
              res,
              400,
              "ageRange.min must be less than or equal to ageRange.max.",
            );
          }
          if (minAge < 16 || maxAge > 80) {
            return errorResponse(
              res,
              400,
              "Age range must be between 16 and 80.",
            );
          }
          updateData.ageRange = { min: minAge, max: maxAge };
        }
      }
    }

    /* ── Upsert (create if not exists, update if exists) ── */
    const preference = await Preference.findOneAndUpdate(
      { user: req.user._id },
      { $set: { ...updateData, user: req.user._id } },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return successResponse(res, 200, "Preferences saved successfully.", {
      preference,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET ROOMMATE MATCHES
   GET /api/v1/preferences/matches
══════════════════════════════════════════════════════════ */
const getRoommateMatches = async (req, res, next) => {
  try {
    /* Get the current seeker's preferences */
    const myPref = await Preference.findOne({ user: req.user._id }).lean();

    if (!myPref) {
      return errorResponse(
        res,
        400,
        "Please fill out your roommate preferences first before viewing matches.",
      );
    }

    /* ── N+1 query — original did User.findById inside a for-loop ──
       Fetch all preferences + their user docs using populate in one query,
       then filter in application code. Much more efficient. */
    const allPrefs = await Preference.find({
      user: { $ne: req.user._id },
    })
      .populate(
        "user",
        "name profilePhoto city bio createdAt role isActive isBanned",
      )
      .lean();

    const matches = [];

    for (const pref of allPrefs) {
      /* Skip if user was deleted (populate returns null) */
      if (!pref.user) continue;

      /* Only match with active, non-banned seekers */
      if (
        pref.user.role !== "seeker" ||
        pref.user.isActive === false ||
        pref.user.isBanned === true
      )
        continue;

      /* Calculate compatibility score */
      let result;
      try {
        result = calculateCompatibility(myPref, pref);
      } catch (calcErr) {
        console.warn(
          `[Compatibility] Skipping seeker ${pref.user._id}:`,
          calcErr.message,
        );
        continue;
      }

      /* Filter out poor matches (< 30%) */
      if (result.score < 30) continue;

      matches.push({
        user: {
          /* Strip role/isActive/isBanned from response — internal fields */
          _id: pref.user._id,
          name: pref.user.name,
          profilePhoto: pref.user.profilePhoto,
          city: pref.user.city,
          bio: pref.user.bio,
          createdAt: pref.user.createdAt,
        },
        preference: {
          sleepSchedule: pref.sleepSchedule,
          smoker: pref.smoker,
          pets: pref.pets,
          cleanliness: pref.cleanliness,
          occupation: pref.occupation,
          gender: pref.gender,
          genderPreference: pref.genderPreference,
          bio: pref.bio,
          budget: pref.budget,
          preferredCity: pref.preferredCity,
        },
        /* calculateCompatibility already returns label — use it directly */
        compatibility: {
          score: result.score,
          label: result.label,
          breakdown: result.breakdown,
        },
      });
    }

    /* Sort by score descending */
    matches.sort((a, b) => b.compatibility.score - a.compatibility.score);

    /* Return top 20 matching seekers */
    const top = matches.slice(0, 20);

    return successResponse(
      res,
      200,
      `Found ${top.length} compatible roommate${top.length !== 1 ? "s" : ""}.`,
      {
        matches: top,
        total: matches.length,
      },
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyPreferences,
  createOrUpdatePreferences,
  getRoommateMatches,
};
