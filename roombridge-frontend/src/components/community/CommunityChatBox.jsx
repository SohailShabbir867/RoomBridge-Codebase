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
  RiEditLine,
} from "react-icons/ri";
import CreateCommunityModal from "./CreateCommunityModal";

const DK  = "#012D1D";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

/* format timestamp for messages */
const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
};

/*
  CommunityChatBox — the message thread for a single community.
*/
const CommunityChatBox = ({ communityId, onMemberCountChange }) => {
  const { on, off, emit } = useSocket();
  const { user }          = useSelector((s) => s.auth);

  const [community, setCommunity]       = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxUrl, setLightboxUrl]   = useState("");
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [joining, setJoining]           = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const messagesEndRef = useRef(null);
  const roomId         = communityId ? `community_${communityId}` : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* Load community + messages, join socket room */
  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    setMessages([]);
    emit("join_room", roomId);

    Promise.all([
      communityService.getCommunityById(communityId),
      communityService.getMessages(communityId).catch((err) => {
        if (err.response?.status === 403) return { data: [] };
        throw err;
      }),
    ])
      .then(([communityRes, messagesRes]) => {
        setCommunity(communityRes.data?.community || communityRes.data);
        setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load community."))
      .finally(() => setLoading(false));

    return () => emit("leave_room", roomId);
  }, [communityId, emit, roomId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  /* Socket: new community message */
  useEffect(() => {
    const handleNew = (msg) => {
      if (msg.community !== communityId && msg.community?._id !== communityId) return;
      setMessages((ms) => (ms.some((m) => m._id === msg._id) ? ms : [...ms, msg]));
    };
    on("new_community_message", handleNew);
    return () => off("new_community_message", handleNew);
  }, [on, off, communityId]);

  /* Socket: member count */
  useEffect(() => {
    const bump = (data) => {
      if (data.communityId !== communityId) return;
      setCommunity((c) => (c ? { ...c, memberCount: data.memberCount } : c));
      onMemberCountChange?.(data.memberCount);
    };
    on("community_member_joined", bump);
    on("community_member_left", bump);
    return () => { off("community_member_joined", bump); off("community_member_left", bump); };
  }, [on, off, communityId, onMemberCountChange]);

  const handleJoin = async () => {
    try {
      setJoining(true);
      const res = await communityService.joinCommunity(communityId);
      setCommunity((c) => ({ ...c, isJoined: true, memberCount: res.data?.memberCount ?? c.memberCount }));
      toast.success("Joined the community!");
      const msgsRes = await communityService.getMessages(communityId);
      setMessages(Array.isArray(msgsRes.data) ? msgsRes.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join community.");
    } finally {
      setJoining(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || sending) return;
    try {
      setSending(true);
      const res = await communityService.sendMessage(communityId, { message: trimmed, imageFile: selectedImage });
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
      <div className="flex justify-center items-center h-full" style={{ backgroundColor: CR }}>
        <RiLoader4Line className="animate-spin text-3xl" style={{ color: DK }} />
      </div>
    );
  }

  if (!community) return null;

  const isPrivate = community.visibility === "private";
  const isAdmin   = user?.role === "admin";
  const isJoined  = community.isJoined;
  const canSend   = isAdmin || (!isPrivate && isJoined);

  /* Group messages by sender for avatar display */
  const isFirstInGroup = (idx) => {
    if (idx === 0) return true;
    const cur  = messages[idx].sender?._id  || messages[idx].sender;
    const prev = messages[idx - 1].sender?._id || messages[idx - 1].sender;
    return cur !== prev;
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: CR }}>

      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ backgroundColor: DK, borderColor: "rgba(255,255,255,0.08)" }}
      >
        {community.image?.url ? (
          <img src={community.image.url} alt={community.name}
            className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm text-white shrink-0"
            style={{ backgroundColor: ACC }}>
            {community.name?.[0]?.toUpperCase() || "C"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white font-extrabold text-sm leading-tight truncate flex items-center gap-1.5">
            {community.name}
            {isPrivate && <RiLockLine className="text-xs opacity-60" />}
            {community.type === "announcement" && <RiMegaphoneLine className="text-xs opacity-60" />}
          </p>
          <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.50)" }}>
            <RiGroupLine className="text-[10px]" />
            {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
            {community.city && ` · ${community.city}`}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowEditModal(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all text-white/80 hover:text-white cursor-pointer active:scale-95 shrink-0"
            title="Edit Community Settings"
          >
            <RiEditLine className="text-sm" />
          </button>
        )}
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1">
        {!isJoined && !isAdmin ? (
          /* Not a member — join prompt */
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${DK}12` }}>
              <RiGroupLine className="text-2xl" style={{ color: DK }} />
            </div>
            <p className="font-extrabold text-sm mb-1" style={{ color: DK }}>
              Join {community.name}
            </p>
            <p className="text-xs text-gray-400 mb-5 max-w-xs leading-relaxed">
              {isPrivate
                ? "This is a private community — you can read admin announcements once you join."
                : "Join to read and send messages with other members."}
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-6 py-3 rounded-full text-sm font-extrabold text-white disabled:opacity-60 active:scale-95 transition-all"
              style={{ backgroundColor: DK }}
            >
              {joining ? "Joining…" : "Join Community"}
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p className="font-bold text-sm" style={{ color: DK }}>No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">
              {canSend ? "Be the first to say something! 👋" : "Check back soon for announcements."}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine     = (msg.sender?._id || msg.sender) === user?._id;
            const showAvatar = !isMine && isFirstInGroup(idx);
            const isAnnounce = msg.isAnnouncement;

            return (
              <div
                key={msg._id}
                className={`flex gap-2 items-end ${isMine ? "justify-end" : "justify-start"} ${
                  isFirstInGroup(idx) ? "mt-3" : "mt-0.5"
                }`}
              >
                {/* Other user avatar */}
                {!isMine && (
                  <div className="w-7 h-7 shrink-0 mb-0.5">
                    {showAvatar ? (
                      msg.sender?.profilePhoto?.url ? (
                        <img src={msg.sender.profilePhoto.url} alt=""
                          className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                          style={{ backgroundColor: DK }}>
                          {(msg.sender?.name || "?")[0].toUpperCase()}
                        </div>
                      )
                    ) : (
                      <div className="w-7 h-7" /> /* spacer */
                    )}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    isAnnounce ? "border-2" : ""
                  } ${isMine ? "rounded-br-sm" : "rounded-bl-sm"}`}
                  style={{
                    backgroundColor: isMine ? DK : "#FFF",
                    borderColor: isAnnounce ? ACC : "#E8E2D9",
                    border: !isAnnounce ? `1px solid ${isMine ? "transparent" : "#E8E2D9"}` : undefined,
                  }}
                >
                  {/* Sender name + label */}
                  {!isMine && showAvatar && (
                    <p className="text-[11px] font-extrabold mb-0.5" style={{ color: ACC }}>
                      {msg.sender?.name || "Member"}
                      {isAnnounce && <span className="opacity-60 font-semibold"> · Announcement</span>}
                    </p>
                  )}

                  {/* Image attachment */}
                  {msg.image?.url && (
                    <img
                      src={msg.image.url}
                      alt=""
                      className="rounded-xl mb-1.5 max-h-52 w-full object-cover cursor-pointer"
                      onClick={() => setLightboxUrl(msg.image.url)}
                    />
                  )}

                  {/* Text */}
                  {msg.message && (
                    <p className="text-sm leading-snug break-words" style={{ color: isMine ? "#FFF" : DK }}>
                      {msg.message}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p
                    className="text-[10px] mt-1 text-right"
                    style={{ color: isMine ? "rgba(255,255,255,0.45)" : "#9CA3AF" }}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
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

      {showEditModal && (
        <CreateCommunityModal
          community={community}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setCommunity(updated);
          }}
        />
      )}
    </div>
  );
};

export default CommunityChatBox;
