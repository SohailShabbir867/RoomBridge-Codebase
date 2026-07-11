import React, { useCallback, useEffect, useMemo, useState } from "react";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import { RiMessage3Line } from "react-icons/ri";
import toast from "react-hot-toast";
import chatService from "../../services/chatService";
import ChatList from "../../components/chat/ChatList";
import ChatBox from "../../components/chat/ChatBox";

const AdminMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const res = await chatService.getConversations();
        const convs = res.data?.conversations || [];
        setConversations(convs);

        if (!activeConv && convs.length > 0) {
          if (window.innerWidth >= 1024) {
            setActiveConv(convs[0]);
          }
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to load conversations.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) =>
      (conv.otherUser?.name || "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const handleMessageSent = useCallback((savedMessage) => {
    setConversations((prev) => {
      const existing = prev.find(
        (c) => c.conversationId === savedMessage.conversationId,
      );

      if (!existing) return prev;

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
  }, []);

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
      role="admin"
      title="Messages"
      subtitle="Chat with users who contact support"
    >
      <div className="bg-white rounded-card border border-border shadow-card h-[72vh] overflow-hidden">
        {conversations.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center text-center px-6">
            <div>
              <RiMessage3Line className="text-5xl text-border mx-auto mb-4" />
              <p className="text-primary font-semibold">No support chats yet</p>
              <p className="text-sm text-text-secondary mt-1">
                Users can now start chats with admin from their Messages page
                using the support button.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            <div
              className={`lg:col-span-4 border-r border-border h-full ${activeConv ? "hidden lg:block" : "block"}`}
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
            <div className={`lg:col-span-8 h-full min-h-0 flex flex-col ${!activeConv ? "hidden lg:block" : "block"}`}>
              {activeConv ? (
                <ChatBox
                  conversation={activeConv}
                  onMessageSent={handleMessageSent}
                  onUnreadCleared={handleUnreadCleared}
                  onBack={() => setActiveConv(null)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center px-6">
                  <div>
                    <RiMessage3Line className="text-5xl text-border mx-auto mb-4" />
                    <p className="text-primary font-semibold">
                      Select a support conversation
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      Pick a user from the left panel to reply.
                    </p>
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

export default AdminMessages;
