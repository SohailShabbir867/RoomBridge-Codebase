import React from "react";
import { useSelector } from "react-redux";
import { RiSearchLine, RiMessage3Line, RiLoader4Line } from "react-icons/ri";

const DK  = "#012D1D";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

/*
  ChatList — sidebar list of conversations.
  Props:
    conversations, activeConvId, onSelect, loading, search, onSearch
*/

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d   = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
  if (now - d < 7 * 24 * 60 * 60 * 1000)
    return d.toLocaleDateString("en-PK", { weekday: "short" });
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
};

const ConvAvatar = ({ user }) =>
  user?.profilePhoto?.url ? (
    <img src={user.profilePhoto.url} alt={user.name}
      className="w-11 h-11 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base text-white shrink-0"
      style={{ backgroundColor: DK }}>
      {(user?.name || "?")[0].toUpperCase()}
    </div>
  );

const ChatList = ({
  conversations = [],
  activeConvId,
  onSelect,
  loading  = false,
  search   = "",
  onSearch,
}) => {
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#FFF" }}>

      {/* Search bar */}
      {onSearch && (
        <div className="p-3 border-b" style={{ borderColor: "#E8E2D9" }}>
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full rounded-xl pl-8 pr-3 py-2 text-sm outline-none transition-all"
              style={{
                backgroundColor: CR,
                border: "1px solid #E8E2D9",
                color: DK,
              }}
              onFocus={(e) => { e.target.style.borderColor = DK; }}
              onBlur={(e)  => { e.target.style.borderColor = "#E8E2D9"; }}
            />
          </div>
        </div>
      )}

      {/* List body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <RiLoader4Line className="animate-spin text-2xl" style={{ color: DK }} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <RiMessage3Line className="text-4xl text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              {search ? "No conversations match your search." : "No conversations yet."}
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.conversationId === activeConvId;
            const isOwn    = (conv.lastMessage?.sender?._id || conv.lastMessage?.sender) === user?._id;
            const unread   = conv.unreadCount || 0;

            return (
              <button
                key={conv.conversationId}
                onClick={() => onSelect(conv)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-b"
                style={{
                  borderColor:     "#F3EFE9",
                  backgroundColor: isActive ? `${DK}08` : "transparent",
                  borderLeft:      isActive ? `3px solid ${DK}` : "3px solid transparent",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = `${DK}05`; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <div className="relative">
                  <ConvAvatar user={conv.otherUser} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center
                                     text-[9px] font-black rounded-full text-white"
                      style={{ backgroundColor: ACC }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-bold truncate" style={{ color: DK }}>
                      {conv.otherUser?.name || "User"}
                    </p>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {formatTime(conv.lastMessage?.createdAt)}
                    </span>
                  </div>

                  <p className={`text-xs truncate max-w-[160px] ${unread > 0 ? "font-semibold" : "text-gray-400"}`}
                    style={{ color: unread > 0 ? DK : undefined }}>
                    {isOwn ? "You: " : ""}
                    {conv.lastMessage?.message || "Start a conversation"}
                  </p>

                  {conv.listingTitle && (
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      re: {conv.listingTitle}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
