import React from "react";
import { Link } from "react-router-dom";

/**
 * RoomBridge Brand Logo Component
 * Combines a custom SVG logo mark (house roof + bridge deck + bridge arch) with text branding.
 *
 * @param {string} className - Optional container classes
 * @param {string} textClassName - Optional text style overrides
 * @param {boolean} isDarkBg - Adapt colors for dark background contexts (e.g., sidebars)
 * @param {function} onClick - Optional click handler (e.g., to close mobile menu)
 */
const Logo = ({
  className = "",
  textClassName = "",
  isDarkBg = false,
  onClick,
}) => {
  const darkGreen = "#012D1D";
  const accentBrown = "#8E4E14";

  return (
    <Link
      to="/"
      onClick={onClick}
      className={`flex items-center gap-2 group inline-flex select-none ${className}`}
    >
      {/* Brand Icon */}
      <div className="relative flex items-center justify-center shrink-0 w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-105">
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* House Base (green) with Arch Cutout */}
          <path
            d="M6 14H26V27H20A4 4 0 0012 27H6Z"
            fill={isDarkBg ? accentBrown : darkGreen}
            className="transition-colors duration-200"
          />
          {/* House Roof (green) with slight overhang */}
          <path
            d="M16 4L4 14H28Z"
            fill={isDarkBg ? accentBrown : darkGreen}
            className="transition-colors duration-200"
          />
          {/* Circular attic window (white) */}
          <circle
            cx="16"
            cy="10"
            r="1.5"
            fill="#FFFFFF"
          />
          {/* Bridge Deck Line (brown flat horizontal bar) */}
          <rect
            x="3"
            y="17"
            width="26"
            height="2"
            fill={isDarkBg ? darkGreen : accentBrown}
            className="transition-colors duration-200"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <span
        className={`font-serif font-extrabold tracking-tight transition-colors duration-200 ${
          isDarkBg
            ? "text-white text-base sm:text-lg"
            : "text-lg sm:text-xl"
        } ${textClassName}`}
        style={!isDarkBg ? { color: darkGreen } : undefined}
      >
        Room<span style={{ color: accentBrown }}>Bridge</span>
      </span>
    </Link>
  );
};

export default Logo;
