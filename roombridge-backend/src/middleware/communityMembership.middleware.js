const Community = require("../models/Community.model");
const { errorResponse } = require("../utils/apiResponse");

/**
 * loadCommunity — Fetches the community from req.params.id (or .communityId)
 * and attaches it as req.community. Returns 404 if missing/inactive.
 *
 * Must run BEFORE requireMembership / requireSendPermission so those
 * middlewares can read req.community without querying the DB twice.
 */
const loadCommunity = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.communityId;
    const community = await Community.findById(id);

    if (!community || !community.isActive) {
      return errorResponse(res, 404, "Community not found.");
    }

    req.community = community;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireMembership — User must have joined the community to VIEW its
 * messages or member list. Admins bypass this (they can inspect any
 * community for moderation purposes).
 *
 * Must be used AFTER `protect` and `loadCommunity`.
 */
const requireMembership = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, "Not authenticated.");
  }
  if (!req.community) {
    return errorResponse(
      res,
      500,
      "requireMembership used without loadCommunity — misconfigured route.",
    );
  }

  if (req.user.role === "admin") return next();

  if (!req.community.isMember(req.user._id)) {
    return errorResponse(
      res,
      403,
      "Join this community first to view its messages.",
    );
  }

  next();
};

/**
 * requireSendPermission — Gate for POSTing a message.
 *
 *   PUBLIC community  -> any joined member can send.
 *   PRIVATE community  -> only the admin can send (read-only / announcement
 *                          style for everyone else, even if they're a member).
 *
 * Must be used AFTER `protect` and `loadCommunity`.
 */
const requireSendPermission = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, "Not authenticated.");
  }
  if (!req.community) {
    return errorResponse(
      res,
      500,
      "requireSendPermission used without loadCommunity — misconfigured route.",
    );
  }

  const { community, user } = req;

  if (user.role !== "admin" && !community.isMember(user._id)) {
    return errorResponse(
      res,
      403,
      "Join this community first to send messages.",
    );
  }

  if (!community.canSend(user._id, user.role)) {
    return errorResponse(
      res,
      403,
      "This is a private community. Only the admin can post messages here.",
    );
  }

  next();
};

module.exports = {
  loadCommunity,
  requireMembership,
  requireSendPermission,
};
