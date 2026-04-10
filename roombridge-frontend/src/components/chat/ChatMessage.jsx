import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiCheckDoubleLine, RiCheckLine } from 'react-icons/ri';

/*
  ChatMessage — single message bubble.
  Props:
    message: {
      _id, sender (id or { _id, name, profilePhoto }), message, createdAt, read
    }
    otherUser: { _id, name, profilePhoto }   — the other participant
    showAvatar: bool                         — show avatar for grouped messages
*/

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-PK', {
    hour:   '2-digit',
    minute: '2-digit',
  });
};

const ChatMessage = ({ message, otherUser, showAvatar = true }) => {
  const { user } = useSelector(s => s.auth);
  const senderId = message.sender?._id || message.sender;
  const isMine   = senderId === user?._id;

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar — only for other person's messages */}
      {!isMine && (
        <div className="w-7 h-7 shrink-0 mb-0.5">
          {showAvatar ? (
            otherUser?.profilePhoto?.url ? (
              <img src={otherUser.profilePhoto.url} alt={otherUser.name}
                   className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {(otherUser?.name || '?')[0].toUpperCase()}
                </span>
              </div>
            )
          ) : (
            <div className="w-7 h-7" /> /* placeholder to keep alignment */
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words
                        ${isMine
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-white border border-border text-primary rounded-bl-sm shadow-sm'}`}>
          {message.message}
        </div>
        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-text-secondary">{formatTime(message.createdAt)}</span>
          {isMine && (
            message.read
              ? <RiCheckDoubleLine className="text-[10px] text-secondary" title="Read" />
              : <RiCheckLine      className="text-[10px] text-text-secondary" title="Sent" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
