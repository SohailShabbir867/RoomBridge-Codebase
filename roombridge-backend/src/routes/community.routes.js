const express = require("express");
const router = express.Router();

const {
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getAllCommunities,
  getCommunityById,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  getCommunityMessages,
  sendCommunityMessage,
} = require("../controllers/community.controller");

const { protect, optionalAuth } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { uploadSingle } = require("../middleware/upload.middleware");
const {
  loadCommunity,
  requireMembership,
  requireSendPermission,
} = require("../middleware/communityMembership.middleware");

/* ── PUBLIC ROUTES — browse communities before joining ──── */

/**
 * @route   GET /api/v1/communities
 * @desc    List all active communities (filter by type/city), with isJoined
 *          flag when a valid auth cookie is present.
 * @access  Public (optionalAuth)
 */
router.get("/", optionalAuth, getAllCommunities);

/**
 * @route   GET /api/v1/communities/:id
 * @desc    Get a single community's public details (name, image, type,
 *          visibility, memberCount) — does not expose the message feed.
 * @access  Public (optionalAuth)
 */
router.get("/:id", optionalAuth, getCommunityById);

/* ── ADMIN ONLY — create / update / delete ─────────────────
   Image upload uses the SAME uploadSingle("image") middleware pattern as
   the rest of the app (multer memory storage -> Cloudinary stream). */

/**
 * @route   POST /api/v1/communities
 * @desc    Create a new community (city, announcement, or general type),
 *          with name, description, visibility (public/private), and an
 *          optional cover image.
 * @access  Admin only
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadSingle("image"),
  createCommunity,
);

/**
 * @route   PUT /api/v1/communities/:id
 * @desc    Update name/description/visibility/image of an existing community.
 * @access  Admin only
 */
router.put(
  "/:id",
  protect,
  authorize("admin"),
  loadCommunity,
  uploadSingle("image"),
  updateCommunity,
);

/**
 * @route   DELETE /api/v1/communities/:id
 * @desc    Permanently delete a community, its cover image, and all of its
 *          (lightweight/TTL) messages.
 * @access  Admin only
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  loadCommunity,
  deleteCommunity,
);

/* ── MEMBER ACTIONS — join / leave ────────────────────────── */

/**
 * @route   POST /api/v1/communities/:id/join
 * @desc    Join a community (any authenticated, non-banned user).
 * @access  Protected
 */
router.post("/:id/join", protect, loadCommunity, joinCommunity);

/**
 * @route   DELETE /api/v1/communities/:id/leave
 * @desc    Leave a community. The creating admin cannot leave (must delete).
 * @access  Protected
 */
router.delete("/:id/leave", protect, loadCommunity, leaveCommunity);

/* ── MEMBERS LIST — members + admin only ──────────────────── */

/**
 * @route   GET /api/v1/communities/:id/members
 * @desc    List joined members. Must be a member yourself (or admin) to view.
 * @access  Protected (members or admin)
 */
router.get(
  "/:id/members",
  protect,
  loadCommunity,
  requireMembership,
  getCommunityMembers,
);

/* ── MESSAGES — read needs membership, send is visibility-gated ── */

/**
 * @route   GET /api/v1/communities/:id/messages
 * @desc    Fetch recent messages (paginated, chronological). Requires
 *          membership (admins can always view, for moderation).
 * @access  Protected (members or admin)
 */
router.get(
  "/:id/messages",
  protect,
  loadCommunity,
  requireMembership,
  getCommunityMessages,
);

/**
 * @route   POST /api/v1/communities/:id/messages
 * @desc    Send a text and/or image message.
 *            - public community  -> any joined member can send
 *            - private community -> admin only (announcement-style, view-only
 *                                    for everyone else)
 * @access  Protected (gated by requireSendPermission)
 */
router.post(
  "/:id/messages",
  protect,
  loadCommunity,
  requireSendPermission,
  uploadSingle("image"),
  sendCommunityMessage,
);

module.exports = router;
