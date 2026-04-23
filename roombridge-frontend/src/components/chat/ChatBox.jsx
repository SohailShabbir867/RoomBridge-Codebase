import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../../context/SocketContext";
import chatService from "../../services/chatService";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ImageLightbox from "./ImageLightbox";
import toast from "react-hot-toast";
import { RiLoader4Line } from "react-icons/ri";

/*
  ChatBox — the message thread for a single conversation.

  Props:
    conversation: {
      conversationId, otherUser, listingId, listingTitle, unreadCount
    }
    onMessageSent: (savedMessage) => void   — to update ChatList last message
    onUnreadCleared: (convId) => void       — to zero-out unread count in parent

  Key behaviours fixed:
  1. Real-time receive via socket 'new_message' event
  2. Typing indicator: emit 'typing' / 'stop_typing' with throttle
  3. Auto-scroll to bottom on new message
  4. Mark as read on mount and on new incoming message
  5. Send on Enter (delegated to ChatInput)
  6. Unread count update propagated to parent via onUnreadCleared
  7. Avatar grouping: only show avatar for first message in a sequence
*/

const TYPING_THROTTLE_MS = 1500; // how often we re-emit 'typing'
const TYPING_TIMEOUT_MS = 3000; // how long before 'stop_typing' fires
const READ_SYNC_WINDOW_MS = 1200; // guard repeated read calls

const ChatBox = ({ conversation, onMessageSent, onUnreadCleared }) => {
  const { on, off, emit } = useSocket();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null); // for 'stop_typing' timeout
  const lastTypingEmitRef = useRef(0); // timestamp of last 'typing' emit
  const readSyncRef = useRef({ convId: null, inFlight: false, lastAt: 0 });

  const convId = conversation.conversationId;
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

      const now = Date.now();
      const state = readSyncRef.current;
      const sameConversation = state.convId === convId;

      if (
        !force &&
        sameConversation &&
        (state.inFlight || now - state.lastAt < READ_SYNC_WINDOW_MS)
      ) {
        if (onUnreadCleared) onUnreadCleared(convId);
        return;
      }

      readSyncRef.current = { convId, inFlight: true, lastAt: state.lastAt };
      if (onUnreadCleared) onUnreadCleared(convId);

      chatService
        .markAsRead(convId)
        .catch(() => {})
        .finally(() => {
          readSyncRef.current = {
            convId,
            inFlight: false,
            lastAt: Date.now(),
          };
        });
    },
    [convId, onUnreadCleared],
  );

  /* ── Load messages + join socket room ───────────────────── */
  useEffect(() => {
    if (!convId) return;
    setLoading(true);
    setMessages([]);

    /* Join the conversation room so we receive socket events for this chat */
    emit("join_room", convId);

    chatService
      .getMessages(convId)
      .then((res) => {
        const msgs = Array.isArray(res.data) ? res.data : res.messages || [];
        setMessages(msgs);
        /* Mark as read on open */
        markAsReadSafely(true);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load messages.");
      })
      .finally(() => setLoading(false));

    /* Leave room on cleanup (conversation switch or unmount) */
    return () => {
      emit("leave_room", convId);
    };
  }, [convId, emit, markAsReadSafely]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── Socket: receive new_message ─────────────────────── */
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (msg.conversationId !== convId) return;
      setMessages((ms) => {
        /* Deduplicate: ignore if we already have this _id (own sent message) */
        if (ms.some((m) => m._id && m._id === msg._id)) return ms;
        return [...ms, msg];
      });
      /* Mark incoming as read immediately since we're in this conversation */
      markAsReadSafely();
    };

    on("new_message", handleNewMessage);
    return () => off("new_message", handleNewMessage);
  }, [on, off, convId, markAsReadSafely]);

  /* ── Socket: typing indicators ────────────────────────── */
  useEffect(() => {
    const handleTyping = ({ conversationId }) => {
      if (conversationId === convId) setOtherIsTyping(true);
    };
    const handleStopTyping = ({ conversationId }) => {
      if (conversationId === convId) setOtherIsTyping(false);
    };

    on("typing", handleTyping);
    on("stop_typing", handleStopTyping);
    return () => {
      off("typing", handleTyping);
      off("stop_typing", handleStopTyping);
    };
  }, [on, off, convId]);

  /* Cleanup typing timer on unmount / conversation change */
  useEffect(
    () => () => {
      clearTimeout(typingTimerRef.current);
    },
    [convId],
  );

  /* ── Typing emission (throttled) ───────────────────────── */
  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingEmitRef.current > TYPING_THROTTLE_MS) {
      lastTypingEmitRef.current = now;
      emit("typing", { conversationId: convId, receiverId: otherUser?._id });
    }
    /* Reset stop_typing timer */
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emit("stop_typing", {
        conversationId: convId,
        receiverId: otherUser?._id,
      });
    }, TYPING_TIMEOUT_MS);
  }, [emit, convId, otherUser]);

  /* ── Send message ─────────────────────────────────────── */
  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || sending) return;

    /* Stop typing indicator immediately */
    clearTimeout(typingTimerRef.current);
    emit("stop_typing", { conversationId: convId, receiverId: otherUser?._id });

    try {
      setSending(true);
      const res = await chatService.sendMessage({
        receiverId: otherUser._id,
        message: trimmed,
        listingId: conversation.listingId,
        imageFile: selectedImage,
      });
      const saved = res.data?.message || res.message || res.data;

      /* Add to local state immediately (optimistic) */
      setMessages((ms) => {
        if (ms.some((m) => m._id === saved._id)) return ms;
        return [...ms, saved];
      });

      setText("");
      setSelectedImage(null);

      /* Bubble up to parent (ChatList) to update last message preview */
      if (onMessageSent) onMessageSent(saved);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  /* ── Avatar grouping: show avatar only on first msg in a run ── */
  const isFirstInGroup = (idx) => {
    if (idx === 0) return true;
    const cur = messages[idx];
    const prev = messages[idx - 1];
    const curSender = cur.sender?._id || cur.sender;
    const prevSender = prev.sender?._id || prev.sender;
    return curSender !== prevSender;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background">
        {loading ? (
          <div className="flex justify-center py-10">
            <RiLoader4Line className="animate-spin text-2xl text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-sm">
              No messages yet. Say hello! 👋
            </p>
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
                <img
                  src={otherUser.profilePhoto.url}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {(otherUser?.name || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-1 bg-white border border-border rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
