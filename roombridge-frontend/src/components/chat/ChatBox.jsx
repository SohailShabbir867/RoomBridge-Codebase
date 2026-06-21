import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../../context/SocketContext";
import chatService from "../../services/chatService";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ImageLightbox from "./ImageLightbox";
import toast from "react-hot-toast";
import { RiLoader4Line, RiMoreLine, RiUser3Line } from "react-icons/ri";

/*
  ChatBox — the message thread for a single conversation.

  Props:
    conversation: {
      conversationId, otherUser, listingId, listingTitle, unreadCount
    }
    onMessageSent: (savedMessage) => void   — to update ChatList last message
    onUnreadCleared: (convId) => void       — to zero-out unread count in parent
*/

const DK  = "#012D1D";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

const TYPING_THROTTLE_MS = 1500;
const TYPING_TIMEOUT_MS  = 3000;
const READ_SYNC_WINDOW_MS = 1200;

const ChatBox = ({ conversation, onMessageSent, onUnreadCleared }) => {
  const { on, off, emit } = useSocket();

  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState("");
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);

  const messagesEndRef    = useRef(null);
  const typingTimerRef    = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const readSyncRef       = useRef({ convId: null, inFlight: false, lastAt: 0 });

  const convId    = conversation.conversationId;
  const otherUser = conversation.otherUser;

  /* ── Scroll to bottom ─────────────────────────────────── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    readSyncRef.current = { convId, inFlight: false, lastAt: 0 };
  }, [convId]);

  const markAsReadSafely = useCallback(
    (force = false) => {
      if (!convId) return;
      const now   = Date.now();
      const state = readSyncRef.current;
      const same  = state.convId === convId;
      if (!force && same && (state.inFlight || now - state.lastAt < READ_SYNC_WINDOW_MS)) {
        if (onUnreadCleared) onUnreadCleared(convId);
        return;
      }
      readSyncRef.current = { convId, inFlight: true, lastAt: state.lastAt };
      if (onUnreadCleared) onUnreadCleared(convId);
      chatService.markAsRead(convId).catch(() => {}).finally(() => {
        readSyncRef.current = { convId, inFlight: false, lastAt: Date.now() };
      });
    },
    [convId, onUnreadCleared],
  );

  /* ── Load messages + join socket room ───────────────────── */
  useEffect(() => {
    if (!convId) return;
    setLoading(true);
    setMessages([]);
    emit("join_room", convId);
    chatService.getMessages(convId)
      .then((res) => {
        const msgs = Array.isArray(res.data) ? res.data : res.messages || [];
        setMessages(msgs);
        markAsReadSafely(true);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load messages."))
      .finally(() => setLoading(false));
    return () => emit("leave_room", convId);
  }, [convId, emit, markAsReadSafely]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  /* ── Socket: receive new_message ─────────────────────── */
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (msg.conversationId !== convId) return;
      setMessages((ms) => {
        if (ms.some((m) => m._id && m._id === msg._id)) return ms;
        return [...ms, msg];
      });
      markAsReadSafely();
    };
    on("new_message", handleNewMessage);
    return () => off("new_message", handleNewMessage);
  }, [on, off, convId, markAsReadSafely]);

  /* ── Socket: typing indicators ────────────────────────── */
  useEffect(() => {
    const onType     = ({ conversationId }) => { if (conversationId === convId) setOtherIsTyping(true);  };
    const onStopType = ({ conversationId }) => { if (conversationId === convId) setOtherIsTyping(false); };
    on("typing", onType);
    on("stop_typing", onStopType);
    return () => { off("typing", onType); off("stop_typing", onStopType); };
  }, [on, off, convId]);

  useEffect(() => () => clearTimeout(typingTimerRef.current), [convId]);

  /* ── Typing emission (throttled) ───────────────────────── */
  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingEmitRef.current > TYPING_THROTTLE_MS) {
      lastTypingEmitRef.current = now;
      emit("typing", { conversationId: convId, receiverId: otherUser?._id });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emit("stop_typing", { conversationId: convId, receiverId: otherUser?._id });
    }, TYPING_TIMEOUT_MS);
  }, [emit, convId, otherUser]);

  /* ── Send message ─────────────────────────────────────── */
  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || sending) return;
    clearTimeout(typingTimerRef.current);
    emit("stop_typing", { conversationId: convId, receiverId: otherUser?._id });
    try {
      setSending(true);
      const res   = await chatService.sendMessage({
        receiverId: otherUser._id,
        message: trimmed,
        listingId: conversation.listingId,
        imageFile: selectedImage,
      });
      const saved = res.data?.message || res.message || res.data;
      setMessages((ms) => {
        if (ms.some((m) => m._id === saved._id)) return ms;
        return [...ms, saved];
      });
      setText("");
      setSelectedImage(null);
      if (onMessageSent) onMessageSent(saved);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const isFirstInGroup = (idx) => {
    if (idx === 0) return true;
    const curSender  = messages[idx].sender?._id  || messages[idx].sender;
    const prevSender = messages[idx - 1].sender?._id || messages[idx - 1].sender;
    return curSender !== prevSender;
  };

  /* ── Avatar helper ─────────────────────────────────────── */
  const OtherAvatar = ({ size = "sm" }) => {
    const sz = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-sm";
    return otherUser?.profilePhoto?.url ? (
      <img src={otherUser.profilePhoto.url} alt={otherUser.name}
        className={`${sz} rounded-full object-cover shrink-0`} />
    ) : (
      <div className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0 text-white`}
        style={{ backgroundColor: DK }}>
        {(otherUser?.name || "?")[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: CR }}>

      {/* ── Chat header (navbar) ──────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ backgroundColor: DK, borderColor: "rgba(255,255,255,0.08)" }}
      >
        <OtherAvatar size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">
            {otherUser?.name || "Unknown"}
          </p>
          <p className="text-xs mt-0.5 font-medium capitalize truncate"
            style={{ color: otherIsTyping ? ACC : "rgba(255,255,255,0.45)" }}>
            {otherIsTyping ? "typing…" : (otherUser?.role || "user")}
          </p>
          {conversation.listingTitle && (
            <p className="text-[10px] truncate mt-0.5" style={{ color: `${ACC}80` }}>
              re: {conversation.listingTitle}
            </p>
          )}
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <RiUser3Line className="text-white/60 text-sm" />
        </div>
      </div>

      {/* ── Messages area ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        {loading ? (
          <div className="flex justify-center py-12">
            <RiLoader4Line className="animate-spin text-3xl" style={{ color: DK }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${DK}12` }}>
              <RiUser3Line className="text-2xl" style={{ color: DK }} />
            </div>
            <p className="font-bold text-sm" style={{ color: DK }}>Start a conversation</p>
            <p className="text-xs text-gray-400 mt-1">Say hello to {otherUser?.name || "them"} 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage
              key={msg._id || `msg-${idx}`}
              message={msg}
              otherUser={otherUser}
              showAvatar={isFirstInGroup(idx)}
              onImageClick={(url) => setLightboxImageUrl(url)}
            />
          ))
        )}

        {/* Typing indicator */}
        {otherIsTyping && (
          <div className="flex items-end gap-2 mt-1">
            <div className="w-7 h-7 shrink-0">
              {otherUser?.profilePhoto?.url ? (
                <img src={otherUser.profilePhoto.url} alt=""
                  className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                  style={{ backgroundColor: DK }}>
                  {(otherUser?.name || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex gap-1 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm"
              style={{ backgroundColor: "#FFF", border: "1px solid #E8E2D9" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: DK, animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────── */}
      <ChatInput
        value={text}
        onChange={setText}
        onSend={handleSend}
        onTyping={handleTyping}
        selectedImage={selectedImage}
        onImageSelect={setSelectedImage}
        onImageClear={() => setSelectedImage(null)}
        sending={sending}
        disabled={loading}
        placeholder={`Message ${otherUser?.name || ""}…`}
      />

      <ImageLightbox
        isOpen={Boolean(lightboxImageUrl)}
        imageUrl={lightboxImageUrl}
        onClose={() => setLightboxImageUrl("")}
      />
    </div>
  );
};

export default ChatBox;
