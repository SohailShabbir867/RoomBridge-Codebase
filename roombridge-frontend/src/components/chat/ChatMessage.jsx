import React from "react";
import { useSelector } from "react-redux";
import { RiCheckDoubleLine, RiCheckLine } from "react-icons/ri";

const DK  = "#012D1D";
const ACC = "#FFAB69";

/*
  ChatMessage — single message bubble.
  Props:
    message: { _id, sender, message, createdAt, read }
    otherUser: { _id, name, profilePhoto }
    showAvatar: bool
    onImageClick: (url) => void
*/

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
};

const ChatMessage = ({ message, otherUser, showAvatar = true, onImageClick }) => {
  const { user }   = useSelector((s) => s.auth);
  const senderId   = message.sender?._id || message.sender;
  const isMine     = senderId === user?._id;
  const hasImage   = message.messageType === "image" && Boolean(message.image?.url);
  const hasCaption = message.message && message.message !== "Image";

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar — other person only */}
      {!isMine && (
        <div className="w-7 h-7 shrink-0 mb-0.5">
          {showAvatar ? (
            otherUser?.profilePhoto?.url ? (
              <img src={otherUser.profilePhoto.url} alt={otherUser.name}
                className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                style={{ backgroundColor: DK }}>
                {(otherUser?.name || "?")[0].toUpperCase()}
              </div>
            )
          ) : (
            <div className="w-7 h-7" /> /* placeholder */
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[72%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        <div
          className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-sm"
          style={
            isMine
              ? {
                  backgroundColor: DK,
                  color: "#FFF",
                  borderBottomRightRadius: "4px",
                }
              : {
                  backgroundColor: "#FFFFFF",
                  color: DK,
                  border: "1px solid #E8E2D9",
                  borderBottomLeftRadius: "4px",
                }
          }
        >
          {hasImage && (
            <button type="button" onClick={() => onImageClick?.(message.image.url)}
              className="block w-full">
              <img src={message.image.url} alt="Shared in chat"
                className="rounded-xl max-h-72 w-full object-cover cursor-zoom-in" />
            </button>
          )}
          {hasCaption && <p className={hasImage ? "mt-2" : ""}>{message.message}</p>}
          {!hasImage && !hasCaption && <p>{message.message}</p>}
        </div>

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-gray-400">{formatTime(message.createdAt)}</span>
          {isMine && (
            message.read
              ? <RiCheckDoubleLine className="text-[11px]" style={{ color: ACC }} title="Read" />
              : <RiCheckLine className="text-[11px] text-gray-400" title="Sent" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
