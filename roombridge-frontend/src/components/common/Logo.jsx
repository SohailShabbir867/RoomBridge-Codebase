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
      className={`flex items-center gap-2 group.inline-flex select-none ${className}`}
    >
      {/* Brand Icon */}
      <div className="relative flex items-center justify-center shrink-0 w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-105">
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* House outline with a circular window cut out of the attic */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 4L5 13.5V26a1 1 0 001 1h4a6 6 0 0112 0h4a1 1 0 001-1V13.5L16 4z M16 9a2 2 0 100 4 2 2 0 000-4z"
            fill={isDarkBg ? accentBrown : darkGreen}
            className="transition-colors duration-200"
          />
          {/* Bridge arch support */}
          <path
            d="M10 27a6 6 0 0112 0"
            stroke={isDarkBg ? darkGreen : accentBrown}
            strokeWidth="2"
            fill="none"
            className="transition-colors duration-200"
          />
          {/* Bridge horizontal deck line */}
          <path
            d="M3 18.5h26"
            stroke={isDarkBg ? darkGreen : accentBrown}
            strokeWidth="2.5"
            strokeLinecap="round"
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
