import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSocket } from "../../context/SocketContext";
import communityService from "../../services/communityService";
import CommunityChatInput from "./CommunityChatInput";
import ImageLightbox from "../chat/ImageLightbox";
import toast from "react-hot-toast";
import {
  RiLoader4Line,
  RiGroupLine,
  RiLockLine,
  RiMegaphoneLine,
} from "react-icons/ri";

const DK = "#012D1D";
const ACC = "#FFAB69";
const CR = "#F7F4EF";

/*
  CommunityChatBox — the message thread for a single community.

  Reuses the EXISTING socket connection from SocketContext (same connection
  used for 1:1 DMs) — per the decision to not spin up a separate namespace.
  Room naming "community_<id>" keeps it distinct from DM conversationIds so
  the existing join_room/leave_room/send_message handlers in socket.js work
  unmodified, and a new event name "new_community_message" (instead of
  "new_message") keeps DM ChatBox listeners from picking up community traffic.

  Props:
    communityId: string
    onMemberCountChange?: (count) => void
*/
const CommunityChatBox = ({ communityId, onMemberCountChange }) => {
  const { on, off, emit } = useSocket();
  const { user } = useSelector((state) => state.auth);

  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);

  const messagesEndRef = useRef(null);
  const roomId = communityId ? `community_${communityId}` : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── Load community detail + messages, join socket room ──── */
  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    setMessages([]);

    emit("join_room", roomId);

    Promise.all([
      communityService.getCommunityById(communityId),
      communityService.getMessages(communityId).catch((err) => {
        /* 403 = not a member yet — not a hard error, just means no feed yet */
        if (err.response?.status === 403) return { data: [] };
        throw err;
      }),
    ])
      .then(([communityRes, messagesRes]) => {
        setCommunity(communityRes.data?.community || communityRes.data);
        setMessages(
          Array.isArray(messagesRes.data) ? messagesRes.data : [],
        );
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Failed to load community."),
      )
      .finally(() => setLoading(false));

    return () => emit("leave_room", roomId);
  }, [communityId, emit, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── Socket: new community message ───────────────────────── */
  useEffect(() => {
    const handleNew = (msg) => {
      if (msg.community !== communityId && msg.community?._id !== communityId) return;
      setMessages((ms) => (ms.some((m) => m._id === msg._id) ? ms : [...ms, msg]));
    };
    on("new_community_message", handleNew);
    return () => off("new_community_message", handleNew);
  }, [on, off, communityId]);

  /* ── Socket: member join/leave -> live member count ──────── */
  useEffect(() => {
    const bump = (data) => {
      if (data.communityId !== communityId) return;
      setCommunity((c) => (c ? { ...c, memberCount: data.memberCount } : c));
      onMemberCountChange?.(data.memberCount);
    };
    on("community_member_joined", bump);
    on("community_member_left", bump);
    return () => {
      off("community_member_joined", bump);
      off("community_member_left", bump);
    };
  }, [on, off, communityId, onMemberCountChange]);

  /* ── Join community ───────────────────────────────────────── */
  const handleJoin = async () => {
    try {
      setJoining(true);
      const res = await communityService.joinCommunity(communityId);
      setCommunity((c) => ({
        ...c,
        isJoined: true,
        memberCount: res.data?.memberCount ?? c.memberCount,
      }));
      toast.success("Joined the community!");
      /* Re-fetch messages now that membership unlocks the feed */
      const msgsRes = await communityService.getMessages(communityId);
      setMessages(Array.isArray(msgsRes.data) ? msgsRes.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join community.");
    } finally {
      setJoining(false);
    }
  };

  /* ── Send message ─────────────────────────────────────────── */
  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || sending) return;
    try {
      setSending(true);
      const res = await communityService.sendMessage(communityId, {
        message: trimmed,
        imageFile: selectedImage,
      });
      const saved = res.data?.message;
      setMessages((ms) => (ms.some((m) => m._id === saved._id) ? ms : [...ms, saved]));
      setText("");
      setSelectedImage(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20" style={{ backgroundColor: CR }}>
        <RiLoader4Line className="animate-spin text-3xl" style={{ color: DK }} />
      </div>
    );
  }

  if (!community) return null;

  const isPrivate = community.visibility === "private";
  const isAdmin = user?.role === "admin";
  const isJoined = community.isJoined;
  /* Mirrors Community.canSend on the backend: admins can always send;
     in a private community nobody else can; in public, joined members can. */
  const canSend = isAdmin || (!isPrivate && isJoined);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: CR }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ backgroundColor: DK, borderColor: "rgba(255,255,255,0.08)" }}
      >
        {community.image?.url ? (
          <img src={community.image.url} alt={community.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
            style={{ backgroundColor: ACC }}
          >
            {community.name?.[0]?.toUpperCase() || "C"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate flex items-center gap-1.5">
            {community.name}
            {isPrivate && <RiLockLine className="text-xs opacity-70" />}
            {community.type === "announcement" && <RiMegaphoneLine className="text-xs opacity-70" />}
          </p>
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.55)" }}>
            <RiGroupLine className="text-xs" />
            {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
            {community.city ? ` · ${community.city}` : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {!isJoined && !isAdmin ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${DK}12` }}
            >
              <RiGroupLine className="text-2xl" style={{ color: DK }} />
            </div>
            <p className="font-bold text-sm" style={{ color: DK }}>
              Join {community.name} to see messages
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {isPrivate
                ? "This is a private community — you'll be able to read admin announcements once you join."
                : "Join to read and send messages with other members."}
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="mt-4 px-5 py-2 rounded-full text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: DK }}
            >
              {joining ? "Joining…" : "Join Community"}
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p className="font-bold text-sm" style={{ color: DK }}>
              No messages yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {canSend ? "Be the first to say something!" : "Check back soon for announcements."}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = (msg.sender?._id || msg.sender) === user?._id;
            return (
              <div key={msg._id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine && (
                  <div className="w-7 h-7 shrink-0">
                    {msg.sender?.profilePhoto?.url ? (
                      <img src={msg.sender.profilePhoto.url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                        style={{ backgroundColor: DK }}
                      >
                        {(msg.sender?.name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    msg.isAnnouncement ? "border-2" : ""
                  }`}
                  style={{
                    backgroundColor: isMine ? DK : "#FFF",
                    borderColor: msg.isAnnouncement ? ACC : "#E8E2D9",
                    border: !msg.isAnnouncement ? "1px solid #E8E2D9" : undefined,
                  }}
                >
                  {!isMine && (
                    <p className="text-[11px] font-bold mb-0.5" style={{ color: ACC }}>
                      {msg.sender?.name || "Member"}
                      {msg.isAnnouncement && " · Announcement"}
                    </p>
                  )}
                  {msg.image?.url && (
                    <img
                      src={msg.image.url}
                      alt=""
                      className="rounded-lg mb-1.5 max-h-56 object-cover cursor-pointer"
                      onClick={() => setLightboxUrl(msg.image.url)}
                    />
                  )}
                  {msg.message && (
                    <p className="text-sm" style={{ color: isMine ? "#FFF" : DK }}>
                      {msg.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — hidden entirely until joined (or admin) */}
      {(isJoined || isAdmin) && (
        <CommunityChatInput
          value={text}
          onChange={setText}
          onSend={handleSend}
          selectedImage={selectedImage}
          onImageSelect={setSelectedImage}
          onImageClear={() => setSelectedImage(null)}
          sending={sending}
          canSend={canSend}
          placeholder={`Message ${community.name}…`}
        />
      )}

      <ImageLightbox
        isOpen={Boolean(lightboxUrl)}
        imageUrl={lightboxUrl}
        onClose={() => setLightboxUrl("")}
      />
    </div>
  );
};

export default CommunityChatBox;
