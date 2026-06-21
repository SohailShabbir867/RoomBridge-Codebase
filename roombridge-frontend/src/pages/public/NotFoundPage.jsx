import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RiHome4Line,
  RiSearchLine,
  RiArrowLeftLine,
  RiCompassLine,
  RiMapPin2Line,
} from "react-icons/ri";

document.title = "404 — Page Not Found | RoomBridge";

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
  darkGreen: "#012D1D",
  btnPrimary: "#8E4E14",
  promise: "#F0EDE9",
  white: "#FFFFFF",
};

const QUICK_LINKS = [
  { label: "Home",        to: "/",        icon: RiHome4Line },
  { label: "Browse Rooms",to: "/explore", icon: RiSearchLine },
  { label: "About Us",    to: "/about",   icon: RiCompassLine },
  { label: "Contact",     to: "/contact", icon: RiMapPin2Line },
];

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [dots, setDots] = useState("");

  /* Animated ellipsis for the subtitle */
  useEffect(() => {
    const id = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: C.promise }}
    >
      {/* ── Top bar ────────────────────────────────────────────── */}
      <div
        className="w-full py-4 px-6 flex items-center gap-3 border-b border-black/10"
        style={{ backgroundColor: C.darkGreen }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-white font-black text-lg tracking-tight"
        >
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ backgroundColor: C.btnPrimary }}
          >
            R
          </span>
          RoomBridge
        </Link>
      </div>

      {/* ── Main content ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">

        {/* Floating 404 illustration */}
        <div className="relative mb-10 select-none" aria-hidden="true">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: C.btnPrimary, transform: "scale(1.4)" }}
          />

          {/* Main number */}
          <div
            className="relative flex items-center justify-center gap-3"
            style={{ animation: "float 4s ease-in-out infinite" }}
          >
            <span
              className="text-[10rem] sm:text-[14rem] font-black leading-none"
              style={{
                color: C.darkGreen,
                fontFamily: "serif",
                opacity: 0.08,
                userSelect: "none",
              }}
            >
              404
            </span>
          </div>

          {/* House icon overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2.5rem] flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: C.darkGreen }}
            >
              <RiHome4Line className="text-6xl sm:text-7xl text-white opacity-90" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5"
          style={{ backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary }}
        >
          Error 404
        </div>

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight"
          style={{ color: C.darkGreen, fontFamily: "serif" }}
        >
          Room Not Found
        </h1>

        <p className="text-gray-500 text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed">
          Looks like this page packed up and moved out
          <span className="text-gray-300">{dots}</span>
          <br />
          Let's get you back to finding your perfect room.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-2xl
                       hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md text-sm"
            style={{ backgroundColor: C.btnPrimary }}
          >
            <RiHome4Line /> Go to Homepage
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-2xl border-2
                       hover:opacity-80 active:scale-95 transition-all duration-200 text-sm"
            style={{ borderColor: C.darkGreen, color: C.darkGreen }}
          >
            <RiSearchLine /> Browse Rooms
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 font-semibold px-6 py-3.5 rounded-2xl
                       text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            <RiArrowLeftLine /> Go Back
          </button>
        </div>

        {/* Quick nav */}
        <div
          className="w-full max-w-md rounded-3xl border border-black/10 overflow-hidden"
          style={{ backgroundColor: C.white }}
        >
          <p
            className="px-6 py-4 text-xs font-bold uppercase tracking-widest border-b border-black/5"
            style={{ color: C.btnPrimary }}
          >
            Quick Links
          </p>
          <div className="divide-y divide-black/5">
            {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-6 py-4 text-sm font-semibold
                           hover:opacity-75 transition-opacity"
                style={{ color: C.darkGreen }}
              >
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${C.darkGreen}0f` }}
                >
                  <Icon className="text-base" style={{ color: C.darkGreen }} />
                </span>
                {label}
                <span className="ml-auto text-gray-300">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer strip ───────────────────────────────────────── */}
      <div
        className="w-full py-5 text-center text-xs text-white/50"
        style={{ backgroundColor: C.darkGreen }}
      >
        © {new Date().getFullYear()} RoomBridge — Pakistan's #1 Room Rental Platform
      </div>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
