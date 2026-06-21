import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Logo from "../../components/common/Logo";
import api from "../../services/api";
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiLoader4Line,
  RiArrowLeftLine,
} from "react-icons/ri";
import studentAvatar from "../../assets/student_avatar.png";

document.title = "Verify Email — RoomBridge";

// Avoid duplicate verification requests for the same token in a single app session.
const requestedVerificationTokens = new Set();

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus]   = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "No verification token found.");

  useEffect(() => {
    if (!token) return;
    if (requestedVerificationTokens.has(token)) return;
    requestedVerificationTokens.add(token);

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(res.data?.message || "Email verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Verification failed. The link may be expired."
        );
      }
    };

    verify();
  }, [token]);

  /* ── Determine left panel copy by status ── */
  const panelCopy = {
    loading: {
      headline: "Verifying your email…",
      sub: "Hold tight while we confirm your account.",
    },
    success: {
      headline: "You're all set!",
      sub: "Your email has been verified. Welcome to RoomBridge.",
    },
    error: {
      headline: "Something went wrong.",
      sub: "The verification link may be expired or already used.",
    },
  }[status];

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col justify-between bg-[#F5F0E6] p-4 sm:p-6 md:p-8 font-sans">
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
        <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] sm:min-h-[640px]">

          {/* ── Left brand panel ── */}
          <div className="md:col-span-5 bg-[#FFA26B] p-8 lg:p-12 flex flex-col justify-between text-[#012D1D]">
            <div>
              <Logo className="mb-8" />
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold leading-[1.15] tracking-tight">
                {panelCopy.headline}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#012D1D]/75 mt-4 max-w-[280px] leading-relaxed">
                {panelCopy.sub}
              </p>
            </div>

            <div className="w-44 h-44 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full bg-[#FFEED7] mx-auto flex items-center justify-center overflow-hidden border border-amber-100/50 mt-8 md:mt-0 shadow-inner">
              <img src={studentAvatar} alt="Student Illustration" className="w-[90%] h-[90%] object-contain" />
            </div>
          </div>

          {/* ── Right status panel ── */}
          <div className="md:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">

            {/* ── Loading ── */}
            {status === "loading" && (
              <>
                <div className="w-16 h-16 bg-[#FFA26B]/15 rounded-2xl flex items-center justify-center mb-6">
                  <RiLoader4Line className="text-[#E7864B] text-4xl animate-spin" />
                </div>
                <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
                  Verifying Your Email…
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                  Please wait while we verify your account. This only takes a moment.
                </p>
              </>
            )}

            {/* ── Success ── */}
            {status === "success" && (
              <>
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  <RiCheckboxCircleLine className="text-emerald-500 text-4xl" />
                </div>
                <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
                  Email Verified! 🎉
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-8">
                  {message}
                </p>

                <Link
                  to="/login"
                  className="inline-block bg-[#012D1D] hover:bg-[#012D1D]/90 active:scale-[0.98] transition-all duration-200 text-white py-4 px-8 rounded-2xl font-bold text-xs sm:text-sm shadow-[0_4px_12px_rgba(1,45,29,0.1)] text-center"
                >
                  Sign In to Your Account →
                </Link>
              </>
            )}

            {/* ── Error ── */}
            {status === "error" && (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                  <RiCloseCircleLine className="text-red-500 text-4xl" />
                </div>
                <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
                  Verification Failed
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-8">
                  {message}
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    to="/register"
                    className="w-full block bg-[#012D1D] hover:bg-[#012D1D]/90 active:scale-[0.98] transition-all duration-200 text-white py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-[0_4px_12px_rgba(1,45,29,0.1)] text-center"
                  >
                    Register Again →
                  </Link>
                  <Link
                    to="/login"
                    className="w-full block border border-gray-200 bg-[#F9F7F2] hover:border-[#012D1D] text-[#012D1D] py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 text-center"
                  >
                    Back to Login
                  </Link>
                </div>
              </>
            )}

            {/* Back link */}
            {status !== "loading" && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#012D1D] hover:text-[#FFA569] font-bold transition-colors"
                >
                  <RiArrowLeftLine className="text-base" /> Back to Login
                </Link>
              </div>
            )}
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

export default VerifyEmailPage;
