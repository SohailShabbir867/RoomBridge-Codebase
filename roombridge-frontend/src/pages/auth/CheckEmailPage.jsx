import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../../components/common/Logo";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  RiMailCheckLine,
  RiMailSendLine,
  RiLoader4Line,
  RiArrowLeftLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import studentAvatar from "../../assets/student_avatar.png";

document.title = "Verify Your Email — RoomBridge";

const CheckEmailPage = () => {
  const location = useLocation();
  const email = location.state?.email || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("No email address found. Please register again.");
      return;
    }
    try {
      setResending(true);
      await api.post("/auth/resend-verification", { email });
      toast.success("Verification email resent! Check your inbox.");
      setResent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col justify-between bg-[#F5F0E6] p-4 sm:p-6 md:p-8 font-sans">
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
        <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] sm:min-h-[640px]">

          {/* ── Left brand panel ── */}
          <div className="md:col-span-5 bg-[#FFA26B] p-8 lg:p-12 flex flex-col justify-between text-[#012D1D]">
            <div>
              <Logo className="mb-8" />
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold leading-[1.15] tracking-tight">
                One step <br /> away!
              </h1>
              <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#012D1D]/75 mt-4 max-w-[280px] leading-relaxed">
                Verify your email to unlock your personalized RoomBridge dashboard.
              </p>
            </div>

            <div className="w-44 h-44 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full bg-[#FFEED7] mx-auto flex items-center justify-center overflow-hidden border border-amber-100/50 mt-8 md:mt-0 shadow-inner">
              <img src={studentAvatar} alt="Student Illustration" className="w-[90%] h-[90%] object-contain" />
            </div>
          </div>

          {/* ── Right content panel ── */}
          <div className="md:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">

            {/* Icon */}
            <div className="w-16 h-16 bg-[#FFA26B]/15 rounded-2xl flex items-center justify-center mb-6">
              <RiMailCheckLine className="text-[#E7864B] text-4xl" />
            </div>

            <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
              Check Your Email
            </h2>

            <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-6">
              We've sent a verification link to:
            </p>

            {email && (
              <div className="mb-6 bg-[#F9F7F2] px-5 py-3 rounded-2xl border border-gray-100/50">
                <span className="text-sm font-bold text-[#012D1D] break-all">{email}</span>
              </div>
            )}

            <div className="bg-[#FFA26B]/10 rounded-2xl p-5 text-xs text-gray-600 mb-8">
              <p className="font-extrabold text-[#012D1D] uppercase tracking-wider text-[10px] mb-2.5">
                What to do next:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 font-medium">
                <li>Open the email from RoomBridge</li>
                <li>Click the "Verify Email" button in the email</li>
                <li>Return here and log in to your account</li>
              </ol>
              <p className="mt-3 text-[10px] text-gray-400 font-semibold">
                The link expires in <strong className="text-[#012D1D]">24 hours</strong>.
              </p>
            </div>

            {/* Resend */}
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-[#012D1D]/20 bg-[#F9F7F2] text-[#012D1D] text-xs sm:text-sm font-bold hover:bg-[#012D1D] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {resending ? (
                <><RiLoader4Line className="animate-spin" /> Sending…</>
              ) : resent ? (
                <><RiCheckboxCircleLine className="text-emerald-500" /> Email Sent!</>
              ) : (
                <><RiMailSendLine /> Resend Verification Email</>
              )}
            </button>

            {/* Back to Login */}
            <div className="mt-4 border-t border-gray-100 pt-6">
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

export default CheckEmailPage;
