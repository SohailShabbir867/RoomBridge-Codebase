import React, { useRef, useEffect, useMemo } from "react";
import {
  RiSendPlaneLine,
  RiLoader4Line,
  RiImageAddLine,
  RiCloseCircleLine,
  RiLockLine,
} from "react-icons/ri";
import toast from "react-hot-toast";

/* Same palette used across ChatInput.jsx / CommunityPage.jsx so the new
   component feels native to the rest of RoomBridge, not bolted on. */
const DK = "#012D1D";
const ACC = "#FFAB69";
const CR = "#F7F4EF";

/*
  CommunityChatInput — same shape as ChatInput.jsx but adds a `canSend`
  prop. When canSend is false (private community + non-admin viewer), the
  whole composer renders as a locked banner instead of an editable input —
  this is the "view-only" experience for private communities.
*/
const CommunityChatInput = ({
  value,
  onChange,
  onSend,
  selectedImage = null,
  onImageSelect,
  onImageClear,
  sending = false,
  disabled = false,
  canSend = true,
  placeholder = "Message the community…",
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedImagePreview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : ""),
    [selectedImage],
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview);
    };
  }, [selectedImagePreview]);

  if (!canSend) {
    return (
      <div
        className="flex items-center gap-2 border-t px-4 py-4 text-sm font-medium"
        style={{ backgroundColor: "#FFF", borderColor: "#E8E2D9", color: "#9CA3AF" }}
      >
        <RiLockLine className="text-base shrink-0" />
        This is a private community. Only the admin can post here.
      </div>
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || selectedImage) && !sending && !disabled) onSend(e);
    }
  };

  return (
    <form
      onSubmit={onSend}
      className="flex flex-col gap-2 border-t px-4 py-3"
      style={{ backgroundColor: "#FFF", borderColor: "#E8E2D9" }}
    >
      {selectedImagePreview && (
        <div
          className="relative w-24 h-20 rounded-xl border overflow-hidden"
          style={{ borderColor: "#E8E2D9" }}
        >
          <img src={selectedImagePreview} alt="Selected" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onImageClear}
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full"
            aria-label="Remove selected image"
          >
            <RiCloseCircleLine className="text-lg" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size > 10 * 1024 * 1024) {
              toast.error("Image size should be less than 10MB");
              e.target.value = "";
              return;
            }
            onImageSelect?.(file || null);
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          aria-label="Attach image"
          className="flex items-center justify-center w-9 h-9 rounded-full border transition-all disabled:opacity-50 shrink-0 mb-0.5"
          style={{ borderColor: "#E8E2D9", color: "#9CA3AF" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = ACC;
            e.currentTarget.style.color = ACC;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E8E2D9";
            e.currentTarget.style.color = "#9CA3AF";
          }}
        >
          <RiImageAddLine className="text-base" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          aria-label="Community message input"
          className="flex-1 resize-none rounded-2xl border px-4 py-2.5 text-sm
                     outline-none transition-all overflow-hidden disabled:opacity-60"
          style={{ backgroundColor: CR, borderColor: "#E8E2D9", color: DK, minHeight: 40, maxHeight: 120 }}
          onFocus={(e) => {
            e.target.style.borderColor = DK;
            e.target.style.boxShadow = `0 0 0 2px ${DK}20`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E8E2D9";
            e.target.style.boxShadow = "none";
          }}
        />

        <button
          type="submit"
          disabled={(!value.trim() && !selectedImage) || sending || disabled}
          aria-label="Send message"
          className="flex items-center justify-center w-9 h-9 rounded-full text-white
                     transition-all disabled:opacity-50 shrink-0 mb-0.5 hover:opacity-85"
          style={{ backgroundColor: DK }}
        >
          {sending ? (
            <RiLoader4Line className="animate-spin text-sm" />
          ) : (
            <RiSendPlaneLine className="text-sm" />
          )}
        </button>
      </div>
    </form>
  );
};

export default CommunityChatInput;
