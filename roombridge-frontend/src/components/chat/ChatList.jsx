import React from 'react';
import { useSelector } from 'react-redux';
import { RiSearchLine, RiMessage3Line, RiLoader4Line } from 'react-icons/ri';

/*
  ChatList — sidebar list of conversations.
  Props:
    conversations:  array of conversation objects from GET /messages/conversations
    activeConvId:   string (conversationId currently open)
    onSelect:       (conversation) => void
    loading:        bool
    search:         string
    onSearch:       (val: string) => void
*/

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  }
  if (now - d < 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString('en-PK', { weekday: 'short' });
  }
  return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
};

const ConvAvatar = ({ user }) =>
  user?.profilePhoto?.url ? (
    <img src={user.profilePhoto.url} alt={user.name}
         className="w-11 h-11 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
      <span className="text-white font-bold text-base">
        {(user?.name || '?')[0].toUpperCase()}
      </span>
    </div>
  );

const ChatList = ({
  conversations = [],
  activeConvId,
  onSelect,
  loading     = false,
  search      = '',
  onSearch,
}) => {
  const { user } = useSelector(s => s.auth);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      {onSearch && (
        <div className="p-3 border-b border-border">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-sm" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={e => onSearch(e.target.value)}
              className="w-full input pl-8 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* List body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <RiLoader4Line className="animate-spin text-2xl text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <RiMessage3Line className="text-4xl text-border mb-3" />
            <p className="text-text-secondary text-sm">
              {search ? 'No conversations match your search.' : 'No conversations yet.'}
            </p>
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.conversationId === activeConvId;
            const isOwn    = (conv.lastMessage?.sender?._id || conv.lastMessage?.sender) === user?._id;
            const unread   = conv.unreadCount || 0;

            return (
              <button
                key={conv.conversationId}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                            border-b border-border/50 hover:bg-background
                            ${isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
              >
                <ConvAvatar user={conv.otherUser} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-primary' : 'font-semibold text-primary'}`}>
                      {conv.otherUser?.name || 'User'}
                    </p>
                    <span className="text-[10px] text-text-secondary shrink-0 ml-2">
                      {formatTime(conv.lastMessage?.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate max-w-[160px]
                                   ${unread > 0 ? 'font-medium text-primary' : 'text-text-secondary'}`}>
                      {isOwn ? 'You: ' : ''}{conv.lastMessage?.message || 'Start a conversation'}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 flex items-center justify-center bg-primary text-white
                                       text-[10px] font-bold rounded-full w-4 h-4 shrink-0">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  {conv.listingTitle && (
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">
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
