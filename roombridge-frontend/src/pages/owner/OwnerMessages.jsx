import React, { useCallback, useEffect, useMemo, useState } from "react";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import { RiMessage3Line, RiCustomerService2Line } from "react-icons/ri";
import toast from "react-hot-toast";
import chatService from "../../services/chatService";
import ChatList from "../../components/chat/ChatList";
import ChatBox from "../../components/chat/ChatBox";

document.title = "Messages — RoomBridge";

const DK  = "#012D1D";
const ACC = "#FFAB69";

const OwnerMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);

  /* ── Load conversations ──────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res   = await chatService.getConversations();
        const convs =
          res.data?.conversations ||
          res.conversations       ||
          (Array.isArray(res.data) ? res.data : []);
        setConversations(convs);
        /* Auto-select first conversation if nothing is active */
        if (!activeConv && convs.length > 0) {
          setActiveConv(convs[0]);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Filtered list ───────────────────────────────────── */
  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) =>
      (conv.otherUser?.name || "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  /* ── Open admin support chat ─────────────────────────── */
  const openSupportChat = useCallback(async () => {
    try {
      const res   = await chatService.getSupportAdmin();
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
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to connect to admin support.");
    }
  }, [conversations]);

  /* ── Callbacks for ChatBox ───────────────────────────── */
  const handleMessageSent = useCallback((savedMessage) => {
    setConversations((prev) => {
      const existing = prev.find(
        (c) => c.conversationId === savedMessage.conversationId,
      );

      /* Brand-new conversation — add it to the top */
      if (!existing) {
        const newConv = {
          conversationId: savedMessage.conversationId,
          otherUser: activeConv?.otherUser,
          lastMessage: savedMessage,
          unreadCount: 0,
        };
        return [newConv, ...prev];
      }

      const updated = prev.map((c) =>
        c.conversationId === savedMessage.conversationId
          ? { ...c, lastMessage: savedMessage }
          : c,
      );
      updated.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || 0) -
          new Date(a.lastMessage?.createdAt || 0),
      );
      return updated;
    });

    /* Update activeConv.conversationId when it was null (first message) */
    if (!activeConv?.conversationId && savedMessage.conversationId) {
      setActiveConv((prev) => ({ ...prev, conversationId: savedMessage.conversationId }));
    }
  }, [activeConv]);

  const handleUnreadCleared = useCallback((convId) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.conversationId !== convId || c.unreadCount === 0) return c;
        return { ...c, unreadCount: 0 };
      }),
    );
  }, []);

  return (
    <RoleDashboardLayout
      role="owner"
      title="Messages"
      subtitle="Chat with seekers and contact admin support"
    >
      {/* Support chat shortcut button */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={openSupportChat}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: DK }}
        >
          <RiCustomerService2Line className="text-base" />
          Chat Admin Support
        </button>
      </div>

      <div
        className="bg-white rounded-2xl border overflow-hidden shadow-sm"
        style={{ borderColor: "#E8E2D9", height: "72vh" }}
      >
        {conversations.length === 0 && !loading ? (
          /* ── Empty state ───────────────────────────────── */
          <div className="h-full flex items-center justify-center text-center px-6">
            <div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                style={{ backgroundColor: `${DK}0D` }}
              >
                <RiMessage3Line className="text-3xl" style={{ color: DK }} />
              </div>
              <p className="font-bold text-base" style={{ color: DK }}>
                No messages yet
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Messages from seekers about your listings will appear here.
              </p>
              <button
                type="button"
                onClick={openSupportChat}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: DK }}
              >
                <RiCustomerService2Line />
                Contact Admin Support
              </button>
            </div>
          </div>
        ) : (
          /* ── Two-panel chat layout ─────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* Sidebar */}
            <div
              className="lg:col-span-4 border-r"
              style={{ borderColor: "#E8E2D9" }}
            >
              <ChatList
                conversations={filteredConversations}
                activeConvId={activeConv?.conversationId}
                onSelect={setActiveConv}
                loading={loading}
                search={search}
                onSearch={setSearch}
              />
            </div>

            {/* Chat area */}
            <div className="lg:col-span-8 h-full">
              {activeConv ? (
                <ChatBox
                  conversation={activeConv}
                  onMessageSent={handleMessageSent}
                  onUnreadCleared={handleUnreadCleared}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center px-6">
                  <div>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                      style={{ backgroundColor: `${DK}0D` }}
                    >
                      <RiMessage3Line className="text-3xl" style={{ color: DK }} />
                    </div>
                    <p className="font-bold text-base" style={{ color: DK }}>
                      Select a conversation
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Pick a chat from the left panel to start messaging.
                    </p>
                    <button
                      type="button"
                      onClick={openSupportChat}
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                      style={{
                        border: `1.5px solid ${DK}`,
                        color: DK,
                        backgroundColor: "transparent",
                      }}
                    >
                      <RiCustomerService2Line />
                      Chat Admin Support
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default OwnerMessages;
