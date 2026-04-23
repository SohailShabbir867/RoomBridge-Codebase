import React, { useRef, useEffect, useMemo } from "react";
import {
  RiSendPlaneLine,
  RiLoader4Line,
  RiImageAddLine,
  RiCloseCircleLine,
} from "react-icons/ri";

/*
  ChatInput — message composition area with:
    - Send on Enter (Shift+Enter for newline)
    - Typing indicator emission (calls onTyping)
    - Auto-resize textarea
    - Disabled while sending

  Props:
    value:      string
    onChange:   (val: string) => void
    onSend:     (e: Event) => void
    onTyping:   () => void             — called while the user is typing
    sending:    bool
    disabled:   bool
    placeholder: string
*/

const ChatInput = ({
  value,
  onChange,
  onSend,
  onTyping,
  selectedImage = null,
  onImageSelect,
  onImageClear,
  sending = false,
  disabled = false,
  placeholder = "Type a message…",
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedImagePreview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : ""),
    [selectedImage],
  );

  /* Auto-resize the textarea as content grows (max 5 rows) */
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

  const handleKeyDown = (e) => {
    /*
      Send on Enter (without Shift).
      Shift+Enter inserts a newline.
      The old stub had no keyboard handler at all.
    */
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || selectedImage) && !sending && !disabled) {
        onSend(e);
      }
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    /* Emit typing indicator to parent (throttled there) */
    if (onTyping) onTyping();
  };

  return (
    <form
      onSubmit={onSend}
      className="flex flex-col gap-2 bg-white border-t border-border px-4 py-3"
    >
      {selectedImagePreview && (
        <div className="relative w-28 h-20 rounded-lg border border-border overflow-hidden">
          <img
            src={selectedImagePreview}
            alt="Selected"
            className="w-full h-full object-cover"
          />
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
          onChange={(e) => onImageSelect?.(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          aria-label="Attach image"
          className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-text-secondary hover:text-primary hover:border-primary transition-colors disabled:opacity-50 shrink-0 mb-0.5"
        >
          <RiImageAddLine className="text-lg" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          aria-label="Message input"
          className="flex-1 resize-none rounded-input border border-border bg-background
                   px-3 py-2 text-sm text-primary placeholder:text-text-secondary
                   focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                   disabled:opacity-60 transition-all duration-150 overflow-hidden"
          style={{ minHeight: 40, maxHeight: 120 }}
        />
        <button
          type="submit"
          disabled={(!value.trim() && !selectedImage) || sending || disabled}
          aria-label="Send message"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white
                   hover:bg-secondary transition-colors disabled:opacity-50 shrink-0 mb-0.5"
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

export default ChatInput;
