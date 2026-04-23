import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSocket } from "../../context/SocketContext";
import chatService from "../../services/chatService";
import ImageLightbox from "../../components/chat/ImageLightbox";
import toast from "react-hot-toast";
import {
  RiArrowLeftLine,
  RiSendPlaneLine,
  RiLoader4Line,
  RiUserLine,
  RiMessage3Line,
  RiSearchLine,
  RiCheckDoubleLine,
  RiImageAddLine,
  RiCloseCircleLine,
  RiCustomerService2Line,
} from "react-icons/ri";

document.title = "Messages — RoomBridge";

/* ── Helpers ─────────────────────────────────────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
};

const Avatar = ({ user, size = "md" }) => {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return user?.profilePhoto?.url ? (
    <img
      src={user.profilePhoto.url}
      alt={user.name}
      className={`${sz} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div
      className={`${sz} rounded-full bg-primary flex items-center justify-center shrink-0`}
    >
      <span className="text-white font-bold">
        {(user?.name || "?")[0].toUpperCase()}
      </span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MESSAGES PAGE (shared between owner and seeker layouts)
════════════════════════════════════════════════════════════ */
const MessagesPage = ({ backTo = "/owner/dashboard" }) => {
  const { user } = useSelector((s) => s.auth);
  const { on, off } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null); // conversation object
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [lightboxImageUrl, setLightboxImageUrl] = useState("");
  const [convLoading, setConvLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  /* Scroll to bottom of message list */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const openSupportChat = useCallback(async () => {
    try {
      const res = await chatService.getSupportAdmin();
      const admin = res.data?.admin || res.admin;
      if (!admin?._id) {
        toast.error("Support admin not available right now.");
        return;
      }

      const existing = conversations.find((c) => c.otherUser?._id === admin._id);
      if (existing) {
        setActiveConv(existing);
        return;
      }

      setActiveConv({
        conversationId: null,
        otherUser: admin,
        unreadCount: 0,
        lastMessage: null,
      });
      setMessages([]);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Unable to connect to admin support.",
      );
    }
  }, [conversations]);

  /* ── Load conversations ──────────────────────────────────── */
  useEffect(() => {
    chatService
      .getConversations()
      .then((res) => {
        const convs =
          res.data?.conversations ||
          res.conversations ||
          (Array.isArray(res.data) ? res.data : []);
        setConversations(convs);
      })
      .catch(console.error)
      .finally(() => setConvLoading(false));
  }, []);

  /* ── Load messages for the active conversation ───────────── */
  useEffect(() => {
    if (!activeConv) return;
    const convId = activeConv.conversationId;
    setMsgLoading(true);
    setMessages([]);
    chatService
      .getMessages(convId)
      .then((res) => {
        const msgs = Array.isArray(res.data) ? res.data : res.messages || [];
        setMessages(msgs);
        /* Mark as read */
        chatService.markAsRead(convId).catch(() => {});
        /* Update unread count in sidebar */
        setConversations((cs) =>
          cs.map((c) =>
            c.conversationId === convId ? { ...c, unreadCount: 0 } : c,
          ),
        );
      })
      .catch(console.error)
      .finally(() => setMsgLoading(false));
  }, [activeConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setSelectedImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  /* ── Socket: receive new messages in real-time ───────────── */
  useEffect(() => {
    const handleNewMessage = (msg) => {
      /* If in the active conversation, append the message */
      if (activeConv && msg.conversationId === activeConv.conversationId) {
        setMessages((ms) => [...ms, msg]);
        chatService.markAsRead(msg.conversationId).catch(() => {});
      }
      /* Always update the last message in the conversations sidebar */
      setConversations((cs) => {
        const idx = cs.findIndex(
          (c) => c.conversationId === msg.conversationId,
        );
        if (idx === -1) {
          /* New conversation — reload list */
          chatService
            .getConversations()
            .then((res) => {
              setConversations(
                res.data?.conversations ||
                  res.conversations ||
                  (Array.isArray(res.data) ? res.data : []),
              );
            })
            .catch(() => {});
          return cs;
        }
        const updated = [...cs];
        updated[idx] = {
          ...updated[idx],
          lastMessage: msg,
          unreadCount:
            activeConv?.conversationId === msg.conversationId
              ? 0
              : (updated[idx].unreadCount || 0) + 1,
        };
        return updated;
      });
    };

    on("new_message", handleNewMessage);
    return () => off("new_message", handleNewMessage);
  }, [on, off, activeConv]);

  /* ── Send message ────────────────────────────────────────── */
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || !activeConv) return;
    try {
      setSending(true);
      const other = activeConv.otherUser;
      const res = await chatService.sendMessage({
        receiverId: other._id,
        message: trimmed,
        listingId: activeConv.listingId,
        imageFile: selectedImage,
      });
      const saved = res.data?.message || res.message || res.data;
      setMessages((ms) => [...ms, saved]);
      setText("");
      setSelectedImage(null);
      /* Update sidebar last message */
      setConversations((cs) =>
        cs.map((c) =>
          c.conversationId === activeConv.conversationId
            ? { ...c, lastMessage: saved }
            : c,
        ),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  /* ── Filter conversations by search ─────────────────────── */
  const filteredConvs = conversations.filter(
    (c) =>
      !search ||
      (c.otherUser?.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
        <Link
          to={backTo}
          className="p-2.5 rounded-lg hover:bg-background text-text-secondary hover:text-primary transition-colors"
        >
          <RiArrowLeftLine className="text-xl" />
        </Link>
        <div>
          <h1 className="font-bold text-primary">Messages</h1>
          <p className="text-text-secondary text-xs">
            {conversations.length} conversation
            {conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openSupportChat}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-btn border border-border text-xs font-semibold text-primary hover:bg-background"
        >
          <RiCustomerService2Line className="text-sm" />
          Chat Support
        </button>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Conversations sidebar ── */}
        <aside
          className={`w-full sm:w-80 border-r border-border bg-white flex flex-col shrink-0
                           ${activeConv ? "hidden sm:flex" : "flex"}`}
        >
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="flex justify-center py-8">
                <RiLoader4Line className="animate-spin text-2xl text-primary" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <RiMessage3Line className="text-4xl text-border mx-auto mb-3" />
                <p className="text-text-secondary text-sm">
                  {search
                    ? "No conversations match your search."
                    : "No messages yet."}
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const isActive =
                  activeConv?.conversationId === conv.conversationId;
                const isOwn = conv.lastMessage?.sender === user?._id;
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full min-h-16 flex items-center gap-3 p-3 sm:p-4 text-left transition-colors
                                border-b border-border/50 hover:bg-background
                                ${isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <Avatar user={conv.otherUser} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-primary truncate">
                          {conv.otherUser?.name || "User"}
                        </p>
                        <span className="text-xs text-text-secondary shrink-0 ml-2">
                          {formatTime(conv.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary truncate max-w-40">
                          {isOwn ? "You: " : ""}
                          {conv.lastMessage?.message || "No messages yet"}
                        </p>
                        {(conv.unreadCount || 0) > 0 && (
                          <span
                            className="ml-2 bg-primary text-white text-[10px] font-bold
                                           w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          >
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat area ── */}
        <div
          className={`flex-1 min-h-0 flex flex-col ${activeConv ? "flex" : "hidden sm:flex"}`}
        >
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center flex-col">
              <RiMessage3Line className="text-6xl text-border mb-4" />
              <p className="text-primary font-semibold text-lg mb-1">
                Select a conversation
              </p>
              <p className="text-text-secondary text-sm">
                Choose a chat from the sidebar to start messaging
              </p>
              <button
                type="button"
                onClick={openSupportChat}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-btn border border-border text-primary text-sm hover:bg-white"
              >
                <RiCustomerService2Line />
                Chat Admin Support
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-border px-3 sm:px-5 py-3 flex items-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="sm:hidden p-2 rounded text-text-secondary hover:text-primary"
                  aria-label="Back to conversations"
                >
                  <RiArrowLeftLine className="text-lg" />
                </button>
                <Avatar user={activeConv.otherUser} />
                <div className="min-w-0">
                  <p className="font-semibold text-primary text-sm">
                    {activeConv.otherUser?.name || "User"}
                  </p>
                  {activeConv.listingTitle && (
                    <p className="text-xs text-text-secondary truncate max-w-50">
                      re: {activeConv.listingTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-background">
                {msgLoading ? (
                  <div className="flex justify-center py-8">
                    <RiLoader4Line className="animate-spin text-2xl text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary text-sm">
                      No messages yet. Say hello! 👋
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine =
                      (msg.sender?._id || msg.sender) === user?._id;
                    const isImageMessage =
                      msg.messageType === "image" && Boolean(msg.image?.url);
                    const hasCaption = msg.message && msg.message !== "Image";

                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!isMine && (
                          <Avatar user={activeConv.otherUser} size="sm" />
                        )}
                        <div
                          className={`max-w-[85%] sm:max-w-[72%] ml-2 ${isMine ? "ml-0 mr-0" : ""}`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                          whitespace-pre-wrap wrap-anywhere
                                          ${
                                            isMine
                                              ? "bg-primary text-white rounded-br-sm ml-auto"
                                              : "bg-white border border-border text-primary rounded-bl-sm"
                                          }`}
                          >
                            {isImageMessage && (
                              <button
                                type="button"
                                onClick={() => setLightboxImageUrl(msg.image.url)}
                                className="block w-full"
                              >
                                <img
                                  src={msg.image.url}
                                  alt="Shared in chat"
                                  className="rounded-xl max-h-72 w-full object-cover cursor-zoom-in"
                                />
                              </button>
                            )}
                            {hasCaption && (
                              <p className={isImageMessage ? "mt-2" : ""}>
                                {msg.message}
                              </p>
                            )}
                            {!isImageMessage && !hasCaption && <p>{msg.message}</p>}
                          </div>
                          <div
                            className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <span className="text-[10px] text-text-secondary">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isMine && msg.read && (
                              <RiCheckDoubleLine className="text-[10px] text-secondary" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSend}
                className="bg-white border-t border-border px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2"
              >
                {selectedImagePreview && (
                  <div className="relative w-24 h-20 rounded-lg border border-border overflow-hidden">
                    <img
                      src={selectedImagePreview}
                      alt="Selected"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full"
                      aria-label="Remove selected image"
                    >
                      <RiCloseCircleLine className="text-lg" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center justify-center border border-border text-text-secondary
                               min-w-11 min-h-11 px-3 py-2.5 rounded-btn hover:text-primary hover:border-primary transition-colors shrink-0"
                    aria-label="Attach image"
                  >
                    <RiImageAddLine />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) handleSend(e);
                    }}
                    className="flex-1 input min-h-11 py-2.5 text-sm"
                    aria-label="Message input"
                  />
                  <button
                    type="submit"
                    disabled={(!text.trim() && !selectedImage) || sending}
                    className="flex items-center justify-center gap-2 bg-primary text-white
                               min-w-11 min-h-11 px-3.5 sm:px-4 py-2.5 rounded-btn hover:bg-secondary transition-colors
                               disabled:opacity-60 shrink-0"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <RiLoader4Line className="animate-spin" />
                    ) : (
                      <RiSendPlaneLine />
                    )}
                  </button>
                </div>
              </form>

              <ImageLightbox
                isOpen={Boolean(lightboxImageUrl)}
                imageUrl={lightboxImageUrl}
                onClose={() => setLightboxImageUrl("")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Owner-specific wrapper ──────────────────────────────────── */
const OwnerMessages = () => <MessagesPage backTo="/owner/dashboard" />;

export default OwnerMessages;
