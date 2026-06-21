import React, { useRef, useEffect, useMemo } from "react";
import {
  RiSendPlaneLine,
  RiLoader4Line,
  RiImageAddLine,
  RiCloseCircleLine,
} from "react-icons/ri";

const DK  = "#012D1D";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

/*
  ChatInput — message composition area.
  Props: value, onChange, onSend, onTyping, selectedImage, onImageSelect,
         onImageClear, sending, disabled, placeholder
*/
const ChatInput = ({
  value,
  onChange,
  onSend,
  onTyping,
  selectedImage = null,
  onImageSelect,
  onImageClear,
  sending   = false,
  disabled  = false,
  placeholder = "Type a message…",
}) => {
  const textareaRef          = useRef(null);
  const fileInputRef         = useRef(null);
  const selectedImagePreview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : ""),
    [selectedImage],
  );

  /* Auto-resize the textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  useEffect(() => {
    return () => { if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview); };
  }, [selectedImagePreview]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || selectedImage) && !sending && !disabled) onSend(e);
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    if (onTyping) onTyping();
  };

  return (
    <form
      onSubmit={onSend}
      className="flex flex-col gap-2 border-t px-4 py-3"
      style={{ backgroundColor: "#FFF", borderColor: "#E8E2D9" }}
    >
      {/* Image preview */}
      {selectedImagePreview && (
        <div className="relative w-24 h-20 rounded-xl border overflow-hidden" style={{ borderColor: "#E8E2D9" }}>
          <img src={selectedImagePreview} alt="Selected" className="w-full h-full object-cover" />
          <button type="button" onClick={onImageClear}
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full"
            aria-label="Remove selected image">
            <RiCloseCircleLine className="text-lg" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden" onChange={(e) => onImageSelect?.(e.target.files?.[0] || null)} />

        {/* Attach image button */}
        <button type="button" onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending} aria-label="Attach image"
          className="flex items-center justify-center w-9 h-9 rounded-full border transition-all disabled:opacity-50 shrink-0 mb-0.5"
          style={{ borderColor: "#E8E2D9", color: "#9CA3AF" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACC; e.currentTarget.style.color = ACC; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E2D9"; e.currentTarget.style.color = "#9CA3AF"; }}>
          <RiImageAddLine className="text-base" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          aria-label="Message input"
          className="flex-1 resize-none rounded-2xl border px-4 py-2.5 text-sm
                     outline-none transition-all overflow-hidden disabled:opacity-60"
          style={{
            backgroundColor: CR,
            borderColor: "#E8E2D9",
            color: DK,
            minHeight: 40,
            maxHeight: 120,
          }}
          onFocus={(e) => { e.target.style.borderColor = DK; e.target.style.boxShadow = `0 0 0 2px ${DK}20`; }}
          onBlur={(e)  => { e.target.style.borderColor = "#E8E2D9"; e.target.style.boxShadow = "none"; }}
        />

        {/* Send button */}
        <button type="submit"
          disabled={(!value.trim() && !selectedImage) || sending || disabled}
          aria-label="Send message"
          className="flex items-center justify-center w-9 h-9 rounded-full text-white
                     transition-all disabled:opacity-50 shrink-0 mb-0.5 hover:opacity-85"
          style={{ backgroundColor: DK }}>
          {sending
            ? <RiLoader4Line className="animate-spin text-sm" />
            : <RiSendPlaneLine className="text-sm" />}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
