const Community = require("../models/Community.model");
const CommunityMessage = require("../models/CommunityMessage.model");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/apiResponse");

/* ── Safe Socket.io getter — same fault-tolerant pattern used in
   message.controller.js, so tests/environments without an initialised
   socket server don't crash the request. */
let getIO;
try {
  getIO = require("../config/socket").getIO;
} catch {
  getIO = null;
}

const emitToRoom = (room, event, data) => {
  try {
    if (!getIO) return;
    const io = getIO();
    if (io) io.to(room).emit(event, data);
  } catch {
    // Socket.io not ready — silent fail, HTTP response remains source of truth
  }
};

/* Room naming convention: distinct prefix from DM conversationIds so the
   existing socket.js join_room/send_message handlers can be reused without
   any risk of a community room colliding with a 2-user conversationId. */
const communityRoom = (communityId) => `community_${communityId}`;

/* ══════════════════════════════════════════════════════════
   CREATE COMMUNITY  (admin only)
   POST /api/v1/communities
   multipart/form-data: name, description, type, city, visibility, image
══════════════════════════════════════════════════════════ */
const createCommunity = async (req, res, next) => {
  try {
    const { name, description, type, city, visibility } = req.body;
    const imageFile = req.file;

    if (!name || !name.trim()) {
      return errorResponse(res, 400, "Community name is required.");
    }
    if (type === "city" && !city) {
      return errorResponse(
        res,
        400,
        "City is required for a city-type community.",
      );
    }

    let uploadedImage = { url: "", public_id: "" };
    if (imageFile) {
      uploadedImage = await uploadToCloudinary(
        imageFile.buffer,
        "roombridge/communities",
      );
    }

    const community = await Community.create({
      name: name.trim(),
      description: description?.trim() || "",
      type: type || "city",
      city: type === "city" ? city : undefined,
      visibility: visibility === "private" ? "private" : "public",
      image: uploadedImage,
      createdBy: req.user._id,
      members: [req.user._id], // admin auto-joins their own community
    });

    return successResponse(res, 201, "Community created successfully.", {
      community,
    });
  } catch (err) {
    /* Duplicate city+type partial unique index collision */
    if (err.code === 11000) {
      return errorResponse(
        res,
        409,
        "An active community for this city already exists.",
      );
    }
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE COMMUNITY  (admin only) — name, description, visibility, image
   PUT /api/v1/communities/:id
══════════════════════════════════════════════════════════ */
const updateCommunity = async (req, res, next) => {
  try {
    const community = req.community; // attached by loadCommunity middleware
    const { name, description, visibility } = req.body;
    const imageFile = req.file;

    if (name?.trim()) community.name = name.trim();
    if (description !== undefined) community.description = description.trim();
    if (visibility === "public" || visibility === "private") {
      community.visibility = visibility;
    }

    if (imageFile) {
      /* Replace old image: upload new one first, then delete the old
         Cloudinary asset (mirrors the safe-replace pattern used for
         listing photos — never delete before the new upload succeeds). */
      const uploaded = await uploadToCloudinary(
        imageFile.buffer,
        "roombridge/communities",
      );
      const oldPublicId = community.image?.public_id;
      community.image = uploaded;
      if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    }

    await community.save();

    return successResponse(res, 200, "Community updated successfully.", {
      community,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE COMMUNITY  (admin only)
   DELETE /api/v1/communities/:id
══════════════════════════════════════════════════════════ */
const deleteCommunity = async (req, res, next) => {
  try {
    const community = req.community;

    if (community.image?.public_id) {
      await deleteFromCloudinary(community.image.public_id);
    }

    await CommunityMessage.deleteMany({ community: community._id });
    await community.deleteOne();

    return successResponse(res, 200, "Community deleted successfully.", {});
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   LIST COMMUNITIES  (public — browse before joining)
   GET /api/v1/communities?type=&city=&page=&limit=
══════════════════════════════════════════════════════════ */
const getAllCommunities = async (req, res, next) => {
  try {
    const { type, city, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true };
    if (type) filter.type = type;
    if (city) filter.city = city;

    const [communities, total] = await Promise.all([
      Community.find(filter)
        .select("-members") // member ObjectId list omitted in list view (use memberCount)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Community.countDocuments(filter),
    ]);

    /* Attach isJoined flag if the request is authenticated (req.user may or
       may not exist depending on whether optionalAuth was applied on the route). */
    const myId = req.user?._id?.toString();
    const result = myId
      ? await Promise.all(
          communities.map(async (c) => {
            const full = await Community.findById(c._id).select("members").lean();
            return {
              ...c,
              isJoined: full.members.some((m) => m.toString() === myId),
            };
          }),
        )
      : communities;

    return paginatedResponse(
      res,
      "Communities retrieved.",
      result,
      pageNum,
      limitNum,
      total,
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET SINGLE COMMUNITY  (public — view details before joining)
   GET /api/v1/communities/:id
══════════════════════════════════════════════════════════ */
const getCommunityById = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("createdBy", "name profilePhoto")
      .lean();

    if (!community || !community.isActive) {
      return errorResponse(res, 404, "Community not found.");
    }

    const myId = req.user?._id?.toString();
    const isJoined = myId
      ? community.members.some((m) => m.toString() === myId)
      : false;

    /* Member ObjectId list isn't useful to the client directly — strip it
       and expose only the count + the requester's own join status. */
    const { members, ...rest } = community;

    return successResponse(res, 200, "Community retrieved.", {
      community: { ...rest, isJoined },
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   JOIN COMMUNITY
   POST /api/v1/communities/:id/join
══════════════════════════════════════════════════════════ */
const joinCommunity = async (req, res, next) => {
  try {
    const community = req.community;

    if (community.isMember(req.user._id)) {
      return errorResponse(res, 400, "You already joined this community.");
    }

    community.members.push(req.user._id);
    await community.save();

    emitToRoom(communityRoom(community._id), "community_member_joined", {
      communityId: community._id,
      userId: req.user._id,
      memberCount: community.memberCount,
    });

    return successResponse(res, 200, "Joined community successfully.", {
      memberCount: community.memberCount,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   LEAVE COMMUNITY
   DELETE /api/v1/communities/:id/leave
══════════════════════════════════════════════════════════ */
const leaveCommunity = async (req, res, next) => {
  try {
    const community = req.community;

    if (community.createdBy.toString() === req.user._id.toString()) {
      return errorResponse(
        res,
        400,
        "The admin who created this community cannot leave it. Delete it instead.",
      );
    }

    if (!community.isMember(req.user._id)) {
      return errorResponse(res, 400, "You are not a member of this community.");
    }

    community.members = community.members.filter(
      (m) => m.toString() !== req.user._id.toString(),
    );
    await community.save();

    emitToRoom(communityRoom(community._id), "community_member_left", {
      communityId: community._id,
      userId: req.user._id,
      memberCount: community.memberCount,
    });

    return successResponse(res, 200, "Left community successfully.", {
      memberCount: community.memberCount,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET MEMBERS  (members + admin only — requireMembership applied on route)
   GET /api/v1/communities/:id/members
══════════════════════════════════════════════════════════ */
const getCommunityMembers = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("members", "name profilePhoto role")
      .select("members");

    return successResponse(res, 200, "Members retrieved.", {
      members: community.members,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   GET COMMUNITY MESSAGES  (members + admin only)
   GET /api/v1/communities/:id/messages?page=&limit=
══════════════════════════════════════════════════════════ */
const getCommunityMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const filter = { community: req.community._id };

    const [messages, total] = await Promise.all([
      CommunityMessage.find(filter)
        .sort({ createdAt: -1 }) // newest first for "load older on scroll up" pagination
        .skip(skip)
        .limit(limitNum)
        .populate("sender", "name profilePhoto role")
        .lean(),
      CommunityMessage.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Messages retrieved.",
      messages.reverse(), // re-ascend to chronological order for this page
      pageNum,
      limitNum,
      total,
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════
   SEND COMMUNITY MESSAGE  (visibility-gated by requireSendPermission)
   POST /api/v1/communities/:id/messages
   multipart/form-data: message (text), image (optional file)
══════════════════════════════════════════════════════════ */
const sendCommunityMessage = async (req, res, next) => {
  try {
    const community = req.community;
    const { message: text } = req.body;
    const imageFile = req.file;
    const trimmed = (text || "").trim();

    if (!trimmed && !imageFile) {
      return errorResponse(res, 400, "Message text or image is required.");
    }
    if (trimmed.length > 1000) {
      return errorResponse(res, 400, "Message cannot exceed 1000 characters.");
    }

    let uploadedImage;
    if (imageFile) {
      uploadedImage = await uploadToCloudinary(
        imageFile.buffer,
        "roombridge/communities/messages",
      );
    }

    const isAnnouncement =
      req.user.role === "admin" && community.visibility === "private";

    const msg = await CommunityMessage.create({
      community: community._id,
      sender: req.user._id,
      message: trimmed,
      messageType: uploadedImage ? "image" : "text",
      image: uploadedImage
        ? { url: uploadedImage.url, public_id: uploadedImage.public_id }
        : undefined,
      isAnnouncement,
    });

    const populated = await CommunityMessage.findById(msg._id)
      .populate("sender", "name profilePhoto role")
      .lean();

    /* Distinct event name from the DM "new_message" event so the existing
       ChatBox listeners (built for 1:1 conversations) never accidentally
       pick up community traffic on the same socket connection. */
    emitToRoom(communityRoom(community._id), "new_community_message", populated);

    return successResponse(res, 201, "Message sent.", { message: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
