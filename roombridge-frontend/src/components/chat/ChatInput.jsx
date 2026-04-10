import React, { useRef, useEffect } from 'react';
import { RiSendPlaneLine, RiLoader4Line } from 'react-icons/ri';

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
  sending    = false,
  disabled   = false,
  placeholder = 'Type a message…',
}) => {
  const textareaRef = useRef(null);

  /* Auto-resize the textarea as content grows (max 5 rows) */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    /*
      BUG FIX: Send on Enter (without Shift).
      Shift+Enter inserts a newline.
      The old stub had no keyboard handler at all.
    */
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !sending && !disabled) {
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
      className="flex items-end gap-2 bg-white border-t border-border px-4 py-3"
    >
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
        disabled={!value.trim() || sending || disabled}
        aria-label="Send message"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white
                   hover:bg-secondary transition-colors disabled:opacity-50 shrink-0 mb-0.5"
      >
        {sending
          ? <RiLoader4Line className="animate-spin text-sm" />
          : <RiSendPlaneLine className="text-sm" />}
      </button>
    </form>
  );
};

export default ChatInput;
