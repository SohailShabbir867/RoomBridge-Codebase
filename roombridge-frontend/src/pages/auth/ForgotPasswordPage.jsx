import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/common/Logo";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import {
  RiMailLine,
  RiArrowLeftLine,
  RiSendPlaneLine,
  RiCheckboxCircleLine,
  RiRefreshLine,
  RiAtLine,
} from "react-icons/ri";
import studentAvatar from "../../assets/student_avatar.png";

document.title = "Forgot Password — RoomBridge";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      setError("");
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
      toast.success("Password reset link sent!");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to send reset email. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setError("");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col justify-between bg-[#F5F0E6] p-4 sm:p-6 md:p-8 font-sans">
      {/* Spacer / Container to center the card */}
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
        <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] sm:min-h-[640px]">
          
          {/* ── Left side (Branding Panel) ── */}
          <div className="md:col-span-5 bg-[#FFA26B] p-8 lg:p-12 flex flex-col justify-between text-[#012D1D]">
            <div>
              <Logo className="mb-8" />
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold leading-[1.15] tracking-tight">
                Reset your <br /> password.
              </h1>
              <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#012D1D]/75 mt-4 max-w-[280px] leading-relaxed">
                We'll help you get back to your dashboard in no time.
              </p>
            </div>
            
            <div className="w-44 h-44 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full bg-[#FFEED7] mx-auto flex items-center justify-center overflow-hidden border border-amber-100/50 mt-8 md:mt-0 shadow-inner">
              <img
                src={studentAvatar}
                alt="Student Illustration"
                className="w-[90%] h-[90%] object-contain"
              />
            </div>
          </div>

          {/* ── Right side (Form Panel) ── */}
          <div className="md:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
            {!sent ? (
              /* ── Step 1: Enter email ─────────────────────── */
              <>
                {/* Title & Subtitle */}
                <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
                  Trouble Logging In?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-8">
                  Enter your email address and we'll send you a recovery link.
                </p>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label
                      className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2"
                      htmlFor="fp-email"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <RiAtLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                      <input
                        id="fp-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`w-full pl-12 pr-4 py-3.5 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${
                          error ? "ring-2 ring-red-500/50" : ""
                        }`}
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-xs mt-1.5 font-semibold" role="alert">
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#012D1D] hover:bg-[#012D1D]/90 active:scale-[0.98] transition-all duration-200 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm shadow-[0_4px_12px_rgba(1,45,29,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-busy={loading}
                  >
                    {loading ? (
                      "Sending link..."
                    ) : (
                      <>
                        <RiSendPlaneLine className="text-sm" /> Send Reset Link
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ── Step 2: Success state ───────────────────── */
              <div className="text-left">
                <div className="w-16 h-16 bg-[#FFA26B]/15 rounded-2xl flex items-center justify-center mb-6">
                  <RiCheckboxCircleLine className="text-[#E7864B] text-4xl" />
                </div>
                
                <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
                  Check Your Inbox!
                </h2>
                
                <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-6">
                  We have sent a secure password reset link to:
                </p>
                
                <div className="mb-6 bg-[#F9F7F2] px-5 py-3 rounded-2xl border border-gray-100/50">
                  <span className="text-sm font-bold text-[#012D1D] break-all">{email}</span>
                </div>

                <div className="bg-[#FFA26B]/10 rounded-2xl p-5 text-xs text-gray-600 space-y-2.5 mb-8">
                  <p className="font-extrabold text-[#012D1D] uppercase tracking-wider text-[10px]">
                    Next Steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 font-medium">
                    <li>Open the email sent by RoomBridge</li>
                    <li>Click the validation button/link</li>
                    <li>Create your new password</li>
                  </ol>
                </div>

                <p className="text-xs text-gray-400 font-medium">
                  Didn't receive the email? Check spam, or{" "}
                  <button
                    onClick={handleReset}
                    className="text-[#FFA569] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <RiRefreshLine className="text-xs" /> try again
                  </button>
                </p>
              </div>
            )}

            {/* Back to Login */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#012D1D] hover:text-[#FFA569] font-bold transition-colors"
              >
                <RiArrowLeftLine className="text-base" /> Back to Login
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ── Page Footer ── */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-widest py-4 pointer-events-auto">
        <p>© {new Date().getFullYear()} ROOMBRIDGE, THE CURATED SANCTUARY FOR STUDENTS.</p>
        <div className="flex gap-5">
          <Link to="/privacy-policy" className="hover:text-[#FFA569] transition-colors">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:text-[#FFA569] transition-colors">Terms of Service</Link>
          <Link to="/contact" className="hover:text-[#FFA569] transition-colors">Help Center</Link>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
