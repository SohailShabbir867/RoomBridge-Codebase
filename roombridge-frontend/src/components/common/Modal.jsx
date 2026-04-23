import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { RiCloseLine } from "react-icons/ri";

/**
 * Modal — accessible dialog with ESC close, outside-click close, focus trap.
 *
 * Props:
 *   isOpen         — boolean
 *   onClose        — callback function
 *   title          — string heading (optional)
 *   size           — 'sm' | 'md' | 'lg' | 'xl' | 'full'  (default 'md')
 *   children       — body content
 *   footer         — footer JSX node (optional)
 *   closeOnOverlay — close when clicking backdrop  (default true)
 *   showClose      — show × button in header       (default true)
 *   className      — extra classes on the inner panel
 */

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full mx-4",
};

/* Focusable elements inside the modal for focus-trap */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const Modal = ({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  footer,
  closeOnOverlay = true,
  showClose = true,
  className = "",
}) => {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null); // element that opened the modal (to restore focus)

  /* ── Escape key close ────────────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }

      /* ── Focus trap ─────────────────────────────────────────── */
      if (e.key === "Tab" && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)];
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          /* Shift+Tab: if on first element, wrap to last */
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          /* Tab: if on last element, wrap to first */
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    /* Save currently focused element to restore on close */
    triggerRef.current = document.activeElement;

    /* Lock body scroll */
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    document.addEventListener("keydown", handleKeyDown);

    /* Move focus into the modal on open */
    requestAnimationFrame(() => {
      if (!panelRef.current) return;
      const firstFocusable = panelRef.current.querySelector(FOCUSABLE);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        panelRef.current.focus();
      }
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      /* Restore body scroll */
      const savedY = parseInt(document.body.style.top || "0", 10);
      document.body.style.overflow = "";
      document.body.style.top = "";
      document.body.style.position = "";
      document.body.style.width = "";
      window.scrollTo(0, Math.abs(savedY));

      /* Restore focus to the element that opened the modal */
      triggerRef.current?.focus?.();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  /* ── Backdrop click — only fires when clicking the exact overlay ─ */
  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === overlayRef.current) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-primary/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={panelRef}
        tabIndex={-1} /* make panel focusable as a fallback */
        className={`relative w-full ${sizeMap[size] ?? sizeMap.md} bg-white
                    rounded-card shadow-hover animate-scale-in
                    flex flex-col max-h-[90vh] outline-none ${className}`}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-primary"
              >
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-lg text-text-secondary
                           hover:bg-background hover:text-primary
                           transition-colors duration-150"
                aria-label="Close modal"
                type="button"
              >
                <RiCloseLine className="text-xl" />
              </button>
            )}
          </div>
        )}

        {/* ── Body (scrollable) ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* ── Footer ──────────────────────────────────────────── */}
        {footer && (
          <div className="px-6 py-4 border-t border-border shrink-0 bg-background rounded-b-card">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
