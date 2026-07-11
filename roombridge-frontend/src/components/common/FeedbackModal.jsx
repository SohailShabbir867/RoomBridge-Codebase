import React, { useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  RiCloseLine,
  RiStarFill,
  RiStarLine,
  RiSendPlaneLine,
  RiLoader4Line,
  RiChatSmile3Line,
} from "react-icons/ri";
import feedbackService from "../../services/feedbackService";

/* ── Design tokens ─────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";

const CATEGORIES = [
  { value: "general",         label: "💬 General Feedback" },
  { value: "bug_report",      label: "🐛 Report a Bug / Issue" },
  { value: "feature_request", label: "✨ Feature Request" },
  { value: "other",           label: "📝 Other" },
];

/**
 * FeedbackModal
 * Props:
 *   onClose — called when user dismisses or successfully submits
 */
const FeedbackModal = ({ onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const [rating,   setRating]   = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [category, setCategory] = useState("general");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error("Please select a rating."); return; }
    if (message.trim().length < 10) { toast.error("Please write at least 10 characters."); return; }

    setLoading(true);
    try {
      await feedbackService.submit({ rating, category, message: message.trim() });
      setSubmitted(true);
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(1,45,29,0.45)", backdropFilter: "blur(4px)" }}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #fffdf8 0%, #f7f4ef 100%)",
          border: `1.5px solid ${ACC}55`,
          animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 5, background: `linear-gradient(90deg, ${ACC} 0%, #FFD0A8 100%)` }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between"
          style={{ background: DK }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: ACC + "22" }}>
              <RiChatSmile3Line size={22} style={{ color: ACC }} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight" style={{ color: "#fff" }}>
                Share Your Feedback
              </h2>
              <p className="text-xs mt-0.5" style={{ color: ACC + "cc" }}>
                Help us make RoomBridge better
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "#ffffff99" }}>
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {submitted ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-extrabold text-xl mb-2" style={{ color: DK }}>
                Thank You, {user?.name?.split(" ")[0]}!
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#5a5a5a" }}>
                Your feedback has been received. We've sent a confirmation to your email.
              </p>
              <button onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: DK }}>
                Close
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: DK }}>
                  Overall Rating *
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      {star <= (hovered || rating) ? (
                        <RiStarFill size={32} style={{ color: "#FBBF24" }} />
                      ) : (
                        <RiStarLine size={32} style={{ color: "#d1c4a8" }} />
                      )}
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 self-center text-sm font-semibold"
                      style={{ color: BTN }}>
                      {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: DK }}>
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border"
                      style={{
                        background:   category === cat.value ? DK        : "#fff",
                        color:        category === cat.value ? "#fff"    : DK,
                        borderColor:  category === cat.value ? DK        : "#e0d8ce",
                        boxShadow:    category === cat.value ? "0 2px 8px rgba(1,45,29,0.15)" : "none",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: DK }}>
                  Your Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Tell us what you think, what you love, or what could be improved…"
                  className="w-full rounded-xl border px-4 py-3 text-sm resize-none outline-none transition-all"
                  style={{
                    borderColor:     "#e0d8ce",
                    background:      "#fffdf8",
                    color:           "#1c1c1c",
                    fontFamily:      "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = ACC)}
                  onBlur={(e)  => (e.target.style.borderColor = "#e0d8ce")}
                />
                <div className="text-right text-xs mt-1" style={{ color: "#9a9a9a" }}>
                  {message.length}/1000
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50"
                  style={{ borderColor: "#e0d8ce", color: "#5a5a5a" }}
                >
                  Maybe Later
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${DK} 0%, #024A32 100%)` }}
                >
                  {loading ? (
                    <RiLoader4Line size={16} className="animate-spin" />
                  ) : (
                    <>
                      <RiSendPlaneLine size={16} />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
};

export default FeedbackModal;
