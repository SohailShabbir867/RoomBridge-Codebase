import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chatService';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine, RiSendPlaneLine, RiLoader4Line,
  RiUserLine, RiMessage3Line, RiSearchLine, RiCheckDoubleLine,
} from 'react-icons/ri';

document.title = 'Messages — RoomBridge';

/* ── Helpers ─────────────────────────────────────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
};

const Avatar = ({ user, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return user?.profilePhoto?.url ? (
    <img src={user.profilePhoto.url} alt={user.name}
         className={`${sz} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${sz} rounded-full bg-primary flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold">{(user?.name || '?')[0].toUpperCase()}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MESSAGES PAGE (shared between owner and seeker layouts)
════════════════════════════════════════════════════════════ */
const MessagesPage = ({ backTo = '/owner/dashboard', roleLabel = 'Owner' }) => {
  const { user } = useSelector(s => s.auth);
  const { on, off, emit } = useSocket();

  const [conversations,  setConversations]  = useState([]);
  const [activeConv,     setActiveConv]     = useState(null);  // conversation object
  const [messages,       setMessages]       = useState([]);
  const [text,           setText]           = useState('');
  const [convLoading,    setConvLoading]    = useState(true);
  const [msgLoading,     setMsgLoading]     = useState(false);
  const [sending,        setSending]        = useState(false);
  const [search,         setSearch]         = useState('');
  const messagesEndRef = useRef(null);

  /* Scroll to bottom of message list */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* ── Load conversations ──────────────────────────────────── */
  useEffect(() => {
    chatService.getConversations()
      .then(res => {
        const convs = res.data?.conversations || res.conversations || (Array.isArray(res.data) ? res.data : []);
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
    chatService.getMessages(convId)
      .then(res => {
        const msgs = Array.isArray(res.data) ? res.data : res.messages || [];
        setMessages(msgs);
        /* Mark as read */
        chatService.markAsRead(convId).catch(() => {});
        /* Update unread count in sidebar */
        setConversations(cs => cs.map(c =>
          c.conversationId === convId ? { ...c, unreadCount: 0 } : c
        ));
      })
      .catch(console.error)
      .finally(() => setMsgLoading(false));
  }, [activeConv]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  /* ── Socket: receive new messages in real-time ───────────── */
  useEffect(() => {
    const handleNewMessage = (msg) => {
      /* If in the active conversation, append the message */
      if (activeConv && msg.conversationId === activeConv.conversationId) {
        setMessages(ms => [...ms, msg]);
        chatService.markAsRead(msg.conversationId).catch(() => {});
      }
      /* Always update the last message in the conversations sidebar */
      setConversations(cs => {
        const idx = cs.findIndex(c => c.conversationId === msg.conversationId);
        if (idx === -1) {
          /* New conversation — reload list */
          chatService.getConversations().then(res => {
            setConversations(res.data?.conversations || res.conversations || (Array.isArray(res.data) ? res.data : []));
          }).catch(() => {});
          return cs;
        }
        const updated = [...cs];
        updated[idx] = {
          ...updated[idx],
          lastMessage: msg,
          unreadCount: activeConv?.conversationId === msg.conversationId
            ? 0
            : (updated[idx].unreadCount || 0) + 1,
        };
        return updated;
      });
    };

    on('new_message', handleNewMessage);
    return () => off('new_message', handleNewMessage);
  }, [on, off, activeConv]);

  /* ── Send message ────────────────────────────────────────── */
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeConv) return;
    try {
      setSending(true);
      const other = activeConv.otherUser;
      const res = await chatService.sendMessage({
        receiverId: other._id,
        message:    trimmed,
        listingId:  activeConv.listingId,
      });
      const saved = res.data?.message || res.message || res.data;
      setMessages(ms => [...ms, saved]);
      setText('');
      /* Emit to socket room for real-time delivery to the other user */
      emit('send_message', saved);
      /* Update sidebar last message */
      setConversations(cs => cs.map(c =>
        c.conversationId === activeConv.conversationId
          ? { ...c, lastMessage: saved }
          : c
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  /* ── Filter conversations by search ─────────────────────── */
  const filteredConvs = conversations.filter(c =>
    !search || (c.otherUser?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to={backTo}
              className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary transition-colors">
          <RiArrowLeftLine className="text-xl" />
        </Link>
        <div>
          <h1 className="font-bold text-primary">Messages</h1>
          <p className="text-text-secondary text-xs">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden max-h-[calc(100vh-73px)]">

        {/* ── Conversations sidebar ── */}
        <aside className={`w-full sm:w-80 border-r border-border bg-white flex flex-col shrink-0
                           ${activeConv ? 'hidden sm:flex' : 'flex'}`}>
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 py-2 text-sm"
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
                  {search ? 'No conversations match your search.' : 'No messages yet.'}
                </p>
              </div>
            ) : (
              filteredConvs.map(conv => {
                const isActive = activeConv?.conversationId === conv.conversationId;
                const isOwn    = conv.lastMessage?.sender === user?._id;
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors
                                border-b border-border/50 hover:bg-background
                                ${isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    <Avatar user={conv.otherUser} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-primary truncate">
                          {conv.otherUser?.name || 'User'}
                        </p>
                        <span className="text-xs text-text-secondary shrink-0 ml-2">
                          {formatTime(conv.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary truncate max-w-[160px]">
                          {isOwn ? 'You: ' : ''}{conv.lastMessage?.message || 'No messages yet'}
                        </p>
                        {(conv.unreadCount || 0) > 0 && (
                          <span className="ml-2 bg-primary text-white text-[10px] font-bold
                                           w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
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
        <div className={`flex-1 flex flex-col ${activeConv ? 'flex' : 'hidden sm:flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center flex-col">
              <RiMessage3Line className="text-6xl text-border mb-4" />
              <p className="text-primary font-semibold text-lg mb-1">Select a conversation</p>
              <p className="text-text-secondary text-sm">Choose a chat from the sidebar to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-border px-5 py-3 flex items-center gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="sm:hidden p-1 rounded text-text-secondary hover:text-primary"
                  aria-label="Back to conversations"
                >
                  <RiArrowLeftLine />
                </button>
                <Avatar user={activeConv.otherUser} />
                <div>
                  <p className="font-semibold text-primary text-sm">{activeConv.otherUser?.name || 'User'}</p>
                  {activeConv.listingTitle && (
                    <p className="text-xs text-text-secondary truncate max-w-[200px]">
                      re: {activeConv.listingTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
                {msgLoading ? (
                  <div className="flex justify-center py-8">
                    <RiLoader4Line className="animate-spin text-2xl text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary text-sm">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = (msg.sender?._id || msg.sender) === user?._id;
                    return (
                      <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && <Avatar user={activeConv.otherUser} size="sm" />}
                        <div className={`max-w-[70%] ml-2 ${isMine ? 'ml-0 mr-0' : ''}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                          ${isMine
                                            ? 'bg-primary text-white rounded-br-sm ml-auto'
                                            : 'bg-white border border-border text-primary rounded-bl-sm'}`}>
                            {msg.message}
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
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
              <form onSubmit={handleSend}
                    className="bg-white border-t border-border px-4 py-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                  className="flex-1 input py-2.5 text-sm"
                  aria-label="Message input"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="flex items-center justify-center gap-2 bg-primary text-white
                             px-4 py-2.5 rounded-btn hover:bg-secondary transition-colors
                             disabled:opacity-60 shrink-0"
                  aria-label="Send message"
                >
                  {sending
                    ? <RiLoader4Line className="animate-spin" />
                    : <RiSendPlaneLine />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Owner-specific wrapper ──────────────────────────────────── */
const OwnerMessages = () => (
  <MessagesPage backTo="/owner/dashboard" roleLabel="Owner" />
);

export default OwnerMessages;
