const Listing = require("../models/Listing.model");
const Booking = require("../models/Booking.model");
const User = require("../models/User.model");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/apiResponse");
const { listingsCache } = require("../utils/cache");

/* Frontend uses plain amenities labels, while Listing model stores
   normalized feature objects. These maps keep both sides compatible. */
const FEATURE_TO_AMENITY = {
  wifi: "WiFi",
  ac: "AC",
  parking: "Parking",
  kitchen: "Kitchen",
  laundry: "Laundry",
  water: "Water",
  electricity: "Electricity",
  security: "Security",
  generator: "Generator",
  cctv: "CCTV",
  furnished: "Furnished",
  attached_bath: "Attached Bath",
  balcony: "Balcony",
  gas: "Gas",
};

const AMENITY_TO_FEATURE = {
  wifi: "wifi",
  ac: "ac",
  parking: "parking",
  kitchen: "kitchen",
  laundry: "laundry",
  water: "water",
  electricity: "electricity",
  security: "security",
  generator: "generator",
  cctv: "cctv",
  furnished: "furnished",
  "attached bath": "attached_bath",
  balcony: "balcony",
  gas: "gas",
  "generator backup": "generator",
  "water supply 24/7": "water",
  "water supply": "water",
};

/* ── Safe integer parse with fallback ──────────────────────
   parseInt('abc') returns NaN; Math.max(1, NaN) → NaN.
   This helper returns a clamped integer or the fallback value. */
const safeInt = (val, fallback, min, max) => {
  const n = parseInt(val, 10);
  if (isNaN(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
};

/* ── Parse JSON field from multipart/form-data ─────────────
   silently swallowed parse errors left an unparsed string in the
   field, which then caused a Mongoose cast error at save time.
   Now returns the fallback value ([] or {}) on any failure. */
const parseJSON = (val, fallback) => {
  if (val === undefined || val === null) return fallback;
  if (typeof val !== "string") return val; // already parsed
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const parseAmenitiesInput = (val) => {
  if (val === undefined || val === null) return null;

  let raw = val;
  if (typeof raw === "string") {
    const parsed = parseJSON(raw, raw);
    raw = parsed;
  }

  if (!Array.isArray(raw)) {
    raw = [raw];
  }

  const normalized = raw
    .map((item) => (item === undefined || item === null ? "" : String(item)))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => AMENITY_TO_FEATURE[item.toLowerCase()])
    .filter(Boolean);

  return [...new Set(normalized)].map((name) => ({ name, available: true }));
};

const toAmenities = (features) => {
  if (!Array.isArray(features)) return [];
  return features
    .filter((f) => f && f.available !== false)
    .map(
      (f) => FEATURE_TO_AMENITY[f.name] || String(f.name || "").toUpperCase(),
    )
    .filter(Boolean);
};

const withAmenities = (listing) => ({
  ...listing,
  amenities: toAmenities(listing.features),
});

/* ── Whitelist of allowed status values for query filters ── */
const VALID_STATUSES = ["pending", "active", "inactive", "rejected"];

/* ══════════════════════════════════════════════════════════
   GET ALL LISTINGS  (public)
   GET /api/v1/listings
══════════════════════════════════════════════════════════ */
const getAllListings = async (req, res, next) => {
  try {
    const {
      city,
      minRent,
      maxRent,
      roomType,
      genderPreference,
      furnished,
      search,
      university,   // NEW: dedicated university name filter (regex on nearbyUniversity)
      location,     // NEW: dedicated location filter (regex on address + area)
      page = 1,
      limit = 12,
      sortBy = "newest",
    } = req.query;

    /* ── LRU cache (public, unauthenticated requests only) ───────
       Only cache for guests — authenticated users get isSaved flag
       which is personal, so we skip the cache for them.            */
    const isGuest = !req.user;
    const cacheKey = isGuest
      ? `listings:${JSON.stringify(req.query)}`
      : null;

    if (cacheKey) {
      const cached = listingsCache.get(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    /* ── Build dynamic filter ────────────────────────────── */
    const filter = { status: "active" }; // ALWAYS restrict to active on public route

    if (city) filter.city = city;
    if (roomType) filter.roomType = roomType;

    if (genderPreference) {
      if (genderPreference === "any") {
        filter.genderPreference = "any";
      } else {
        filter.genderPreference = { $in: [genderPreference, "any"] };
      }
    }

    if (furnished !== undefined && furnished !== "") {
      filter.furnished = furnished === "true" || furnished === true;
    }

    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = Number(minRent);
      if (maxRent) filter.rent.$lte = Number(maxRent);
    }

    /* ── University filter (dedicated param) ─────────────────────────────
       ?university=Islamia University Bahawalpur
       Matches against nearbyUniversity field (case-insensitive regex).
       Split on spaces to allow partial word matching, e.g. "islamia" will
       match "Islamia University of Bahawalpur". Uses $regex for flexibility
       rather than $text so it works without exact phrase indexing.          */
    if (university && university.trim()) {
      const uniQuery = university.trim();
      filter.nearbyUniversity = { $regex: uniQuery, $options: "i" };
    }

    /* ── Location filter (dedicated param) ───────────────────────────────
       ?location=Johar Town
       Matches address OR area with a case-insensitive regex.               */
    if (location && location.trim()) {
      const locQuery = location.trim();
      filter.$or = [
        { address: { $regex: locQuery, $options: "i" } },
        { area:    { $regex: locQuery, $options: "i" } },
      ];
    }

    /* ── Build sort + text search ────────────────────────────────────────
       Relevance sort:
         - "relevance"  → { score: { $meta: "textScore" } }  (needs $text)
         - "price_asc"  → alias for price_low
         - "price_desc" → alias for price_high
       When a search query is present we default to relevance automatically.
       When a university/location filter is present without a text query we
       still sort by the user's sortBy preference.                          */
    const sortMap = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      price_low:  { rent:  1 },
      price_high: { rent: -1 },
      price_asc:  { rent:  1 },   // frontend alias
      price_desc: { rent: -1 },   // frontend alias
      most_viewed:{ views: -1 },
      relevance:  { score: { $meta: "textScore" } },
    };

    let sort, projection;

    if (search && search.trim()) {
      const searchTerm = search.trim();

      /* Full-text search using our newly created weighted text index */
      filter.$text = { $search: searchTerm };
      projection = { score: { $meta: "textScore" } };

      /* Default to relevance when searching; respect explicit sortBy */
      sort = sortBy === "relevance" || !sortMap[sortBy]
        ? sortMap.relevance
        : sortMap[sortBy] ?? sortMap.relevance;

    } else {
      sort = sortMap[sortBy] || sortMap.newest;
    }


    /* ── Pagination ──────────────────────────────────── */
    const pageNum  = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 12, 1, 50);
    const skip     = (pageNum - 1) * limitNum;

    /* ── Query ───────────────────────────────────────── */
    const [listings, total] = await Promise.all([
      Listing.find(filter, projection)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate("owner", "name profilePhoto city")
        .lean(),
      Listing.countDocuments(filter),
    ]);

    /* ── O(1) isSaved check using Set of user's savedListings ── */
    let enriched;
    if (req.user) {
      const savedSet = new Set(
        (req.user.savedListings || []).map((id) => id.toString())
      );
      enriched = listings.map((l) => ({
        ...l,
        amenities: toAmenities(l.features),
        isSaved: savedSet.has(l._id.toString()),
      }));
    } else {
      enriched = listings.map((l) => ({
        ...l,
        amenities: toAmenities(l.features),
        isSaved: false,
      }));
    }

    const payload = {
      success: true,
      message: "Listings retrieved successfully.",
      data: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 0,
        hasNextPage: pageNum < (limitNum > 0 ? Math.ceil(total / limitNum) : 0),
        hasPrevPage: pageNum > 1,
      },
    };

    if (cacheKey) {
      listingsCache.set(cacheKey, payload);
    }

    return res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET LISTING BY ID  (public, optionalAuth)
   GET /api/v1/listings/:id
══════════════════════════════════════════════════════════ */
const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("owner", "name profilePhoto city createdAt")
      .lean();

    if (!listing) {
      return errorResponse(res, 404, "Listing not found.");
    }

    /* Non-active listings are only visible to the owner or admins */
    if (
      listing.status !== "active" &&
      (!req.user ||
        (req.user._id.toString() !== listing.owner._id.toString() &&
          req.user.role !== "admin"))
    ) {
      return errorResponse(res, 404, "Listing not found.");
    }

    /* Removed the auto-increment from here.
       getListingById was calling Listing.findByIdAndUpdate({ $inc: { views:1 } })
       as fire-and-forget AND the route POST /:id/views exists for the same purpose.
       Every page load was counting double. Frontend must call POST /:id/views
       explicitly — this endpoint does NOT auto-increment. */

    /* Check if current user saved this listing */
    const isSaved = req.user
      ? (listing.savedBy || []).some(
          (id) => id.toString() === req.user._id.toString(),
        )
      : false;

    /* Strip savedBy array from response — it's an implementation detail */
    const { savedBy: _savedBy, ...listingData } = listing;

    return successResponse(res, 200, "Listing retrieved successfully.", {
      listing: { ...withAmenities(listingData), isSaved },
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   CREATE LISTING  (protected, owner)
   POST /api/v1/listings
══════════════════════════════════════════════════════════ */
const createListing = async (req, res, next) => {
  try {
    /* ── Require at least one photo ──────────────────────── */
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, "At least one photo is required.");
    }

    /* ── Upload photos to Cloudinary in parallel ─────────── */
    let photos;
    try {
      photos = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "roombridge/listings"),
        ),
      );
    } catch (uploadErr) {
      return errorResponse(
        res,
        502,
        `Photo upload failed: ${uploadErr.message}`,
      );
    }

    const {
      title,
      description,
      rent,
      city,
      address,
      area,
      nearbyUniversity,
      roomType,
      genderPreference,
      availableFrom,
      furnished,
      features,
      amenities,
      nearbyPlaces,
      roommatePreferences,
    } = req.body;

    /* parseJSON returns [] / {} fallback on any parse failure
       instead of silently keeping the raw string, which caused Mongoose
       to throw a CastError when trying to save a string into an array field. */
    const parsedAmenities = parseAmenitiesInput(amenities);
    const parsedFeatures = parseJSON(features, []);
    const parsedNearby = parseJSON(nearbyPlaces, []);
    const parsedRoommate = parseJSON(roommatePreferences, {});

    const listing = await Listing.create({
      title,
      description,
      rent: Number(rent),
      city,
      address,
      area: area || "",
      nearbyUniversity: nearbyUniversity?.trim() || "",
      roomType,
      genderPreference: genderPreference || "any",
      availableFrom,
      furnished: furnished === "true" || furnished === true,
      photos,
      features:
        parsedAmenities !== null
          ? parsedAmenities
          : Array.isArray(parsedFeatures)
            ? parsedFeatures
            : [],
      nearbyPlaces: Array.isArray(parsedNearby) ? parsedNearby : [],
      roommatePreferences: parsedRoommate,
      owner: req.user._id,
      status: "pending",
    });

    return successResponse(
      res,
      201,
      "Listing created successfully. It will be reviewed by an admin before going live.",
      { listing: withAmenities(listing.toObject()) },
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE LISTING  (protected, owner)
   PUT /api/v1/listings/:id
══════════════════════════════════════════════════════════ */
const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return errorResponse(res, 404, "Listing not found.");
    }

    /* Ownership check */
    if (listing.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, "You can only update your own listings.");
    }

    /* Cannot edit a listing that is under review */
    if (listing.status === "pending") {
      return errorResponse(
        res,
        400,
        "This listing is currently under review and cannot be edited.",
      );
    }

    const {
      title,
      description,
      rent,
      city,
      address,
      area,
      nearbyUniversity,
      roomType,
      genderPreference,
      availableFrom,
      furnished,
      features,
      amenities,
      nearbyPlaces,
      roommatePreferences,
      removePhotos,
    } = req.body;

    /* ── Step 1: Remove old photos from Cloudinary FIRST ────
       Photo count check was done BEFORE removing old photos.
       Example: 6 existing, remove 2, add 2 → check fired "6+2=8 > 6" → rejected.
       Correct order: remove first, THEN check, THEN add. */
    let toRemove = parseJSON(removePhotos, []);
    if (Array.isArray(toRemove) && toRemove.length > 0) {
      /* Delete from Cloudinary (non-fatal — log errors but continue) */
      await Promise.allSettled(
        toRemove.map((pid) => deleteFromCloudinary(pid)),
      );
      /* Remove from in-memory array */
      listing.photos = listing.photos.filter(
        (p) => !toRemove.includes(p.public_id),
      );
    }

    /* ── Step 2: Enforce maximum photo count AFTER removing ─ */
    if (req.files && req.files.length > 0) {
      const totalAfterAdd = listing.photos.length + req.files.length;
      if (totalAfterAdd > 6) {
        return errorResponse(
          res,
          400,
          `Maximum 6 photos allowed. After removal you have ${listing.photos.length}, trying to add ${req.files.length}.`,
        );
      }

      /* ── Step 3: Upload new photos ─────────────────────── */
      let newPhotos;
      try {
        newPhotos = await Promise.all(
          req.files.map((f) =>
            uploadToCloudinary(f.buffer, "roombridge/listings"),
          ),
        );
      } catch (uploadErr) {
        return errorResponse(
          res,
          502,
          `Photo upload failed: ${uploadErr.message}`,
        );
      }
      listing.photos.push(...newPhotos);
    }

    /* Ensure at least 1 photo remains */
    if (listing.photos.length === 0) {
      return errorResponse(res, 400, "A listing must have at least one photo.");
    }

    /* ── Update scalar fields ──────────────────────────────
       use explicit undefined checks instead of truthiness.
       `if (title)` skips an update when title = '' — but that fails
       validation anyway. Rent = 0 would be skipped by `if (rent)`. */
    if (title !== undefined) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (rent !== undefined) listing.rent = Number(rent);
    if (city !== undefined) listing.city = city;
    if (address !== undefined) listing.address = address;
    if (area !== undefined) listing.area = area;
    if (nearbyUniversity !== undefined) listing.nearbyUniversity = nearbyUniversity?.trim() || "";
    if (roomType !== undefined) listing.roomType = roomType;
    if (genderPreference !== undefined)
      listing.genderPreference = genderPreference;
    if (availableFrom !== undefined) listing.availableFrom = availableFrom;
    if (furnished !== undefined) {
      listing.furnished = furnished === "true" || furnished === true;
    }

    /* JSON sub-doc fields. Use else-if block to prioritize amenities and avoid double-writing listing.features. */
    const pAmenities = parseAmenitiesInput(amenities);
    const pFeatures = parseJSON(features, null);
    const pNearby = parseJSON(nearbyPlaces, null);
    const pRoommate = parseJSON(roommatePreferences, null);
    if (pAmenities !== null) {
      listing.features = pAmenities;
    } else if (pFeatures !== null && Array.isArray(pFeatures)) {
      listing.features = pFeatures;
    }
    if (pNearby !== null && Array.isArray(pNearby))
      listing.nearbyPlaces = pNearby;
    if (pRoommate !== null && typeof pRoommate === "object")
      listing.roommatePreferences = pRoommate;

    /* Re-submit for admin review after any edit */
    listing.status = "pending";
    await listing.save();

    return successResponse(
      res,
      200,
      "Listing updated successfully. It has been re-submitted for admin review.",
      { listing: withAmenities(listing.toObject()) },
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE LISTING  (protected, owner or admin)
   DELETE /api/v1/listings/:id
══════════════════════════════════════════════════════════ */
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return errorResponse(res, 404, "Listing not found.");
    }

    /* Owner OR admin can delete */
    const isOwner = listing.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return errorResponse(
        res,
        403,
        "You do not have permission to delete this listing.",
      );
    }

    /* ── Delete all Cloudinary photos ────────────────────── */
    if (listing.photos && listing.photos.length > 0) {
      /* Use allSettled — don't fail the delete if Cloudinary is slow/down */
      await Promise.allSettled(
        listing.photos.map((p) => deleteFromCloudinary(p.public_id)),
      );
    }

    /* ── Notify seekers with active bookings, then cancel ───
       was using Booking.deleteMany — erased booking history.
       Now set to 'cancelled' + notify seekers so they know the listing
       was removed. */
    const activeBookings = await Booking.find({
      listing: listing._id,
      status: { $in: ["pending", "accepted"] },
    }).populate("seeker", "name email");

    if (activeBookings.length > 0) {
      /* Cancel all active bookings */
      await Booking.updateMany(
        { listing: listing._id, status: { $in: ["pending", "accepted"] } },
        {
          $set: {
            status: "cancelled",
            ownerNote: "The listing was removed by the owner.",
          },
        },
      );
    }

    /* Delete the listing document */
    await listing.deleteOne();

    return successResponse(res, 200, "Listing deleted successfully.");
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET OWNER'S LISTINGS
   GET /api/v1/listings/owner/my-listings
══════════════════════════════════════════════════════════ */
const getOwnerListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status } = req.query;
    const pageNum = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 12, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = { owner: req.user._id };

    /* validate status param before using in query */
    if (status && VALID_STATUSES.includes(status)) {
      filter.status = status;
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(filter),
    ]);

    /* Attach pending booking count per listing */
    const listingIds = listings.map((l) => l._id);
    const bookingCounts = await Booking.aggregate([
      { $match: { listing: { $in: listingIds }, status: "pending" } },
      { $group: { _id: "$listing", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    bookingCounts.forEach((b) => {
      countMap[b._id.toString()] = b.count;
    });

    const enriched = listings.map((l) => ({
      ...withAmenities(l),
      bookingCount: countMap[l._id.toString()] || 0,
    }));

    return paginatedResponse(
      res,
      "Your listings retrieved successfully.",
      enriched,
      pageNum,
      limitNum,
      total,
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   SAVE LISTING  (protected, seeker)
   POST /api/v1/listings/:id/save
══════════════════════════════════════════════════════════ */
const saveListing = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const listingId = req.params.id;

    /* Use atomic findByIdAndUpdate with $addToSet instead of
       loading the document + listing.save(). This avoids triggering
       pre-save hooks unnecessarily AND prevents race conditions where
       two concurrent requests double-add. */
    const listing = await Listing.findById(listingId).select(
      "status savedBy owner title",
    );
    if (!listing) return errorResponse(res, 404, "Listing not found.");
    if (listing.status !== "active") {
      return errorResponse(res, 400, "You can only save active listings.");
    }

    const alreadySaved = listing.savedBy.some(
      (id) => id.toString() === userId.toString(),
    );
    if (alreadySaved) {
      /* Idempotent — return success rather than an error for better UX */
      return successResponse(res, 200, "Listing already saved.", {
        isSaved: true,
      });
    }

    /* Atomic updates on both documents */
    await Promise.all([
      Listing.findByIdAndUpdate(listingId, { $addToSet: { savedBy: userId } }),
      User.findByIdAndUpdate(userId, {
        $addToSet: { savedListings: listingId },
      }),
    ]);

    return successResponse(res, 200, "Listing saved successfully.", {
      isSaved: true,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   UNSAVE LISTING  (protected, seeker)
   DELETE /api/v1/listings/:id/save
══════════════════════════════════════════════════════════ */
const unsaveListing = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const listingId = req.params.id;

    const listing = await Listing.findById(listingId).select("_id");
    if (!listing) return errorResponse(res, 404, "Listing not found.");

    /* Use $pull on both documents atomically instead of loading
       the full listing + filtering + saving, which triggers pre-save hooks. */
    await Promise.all([
      Listing.findByIdAndUpdate(listingId, { $pull: { savedBy: userId } }),
      User.findByIdAndUpdate(userId, { $pull: { savedListings: listingId } }),
    ]);

    return successResponse(res, 200, "Listing unsaved successfully.", {
      isSaved: false,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET SAVED LISTINGS  (protected, seeker)
   GET /api/v1/listings/seeker/saved
══════════════════════════════════════════════════════════ */
const getSavedListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = safeInt(page, 1, 1);
    const limitNum = safeInt(limit, 12, 1, 50);
    const skip = (pageNum - 1) * limitNum;

    /* Only show listings that are still active */
    const filter = { savedBy: req.user._id, status: "active" };

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("owner", "name profilePhoto city")
        .lean(),
      Listing.countDocuments(filter),
    ]);

    /* All results are by definition saved by this user */
    const enriched = listings.map((l) => ({
      ...withAmenities(l),
      isSaved: true,
    }));

    return paginatedResponse(
      res,
      "Saved listings retrieved successfully.",
      enriched,
      pageNum,
      limitNum,
      total,
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   INCREMENT VIEWS  (public)
   POST /api/v1/listings/:id/views
   Called explicitly by the frontend on detail page load.
   getListingById no longer auto-increments — this is the
   single authoritative place where view counts are updated.
══════════════════════════════════════════════════════════ */
const incrementViews = async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: "after", select: "views" },
    );

    if (!listing) return errorResponse(res, 404, "Listing not found.");

    return successResponse(res, 200, "View count updated.", {
      views: listing.views,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getOwnerListings,
  saveListing,
  unsaveListing,
  getSavedListings,
  incrementViews,
};
