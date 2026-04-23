import React from "react";

/**
 * Loader — spinning indicator
 *
 * Props:
 *   fullScreen  — centers in viewport with semi-transparent overlay (for Suspense)
 *   inline      — minimal, no outer padding (for inside cards/buttons)
 *   size        — 'xs' | 'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *   color       — CSS color string or Tailwind text-* class (default text-primary)
 *   text        — optional label below spinner
 *   className   — extra wrapper classes
 */

const sizeMap = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-9 w-9",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

const Loader = ({
  fullScreen = false,
  inline = false,
  size = "md",
  color = "text-primary",
  text,
  className = "",
}) => {
  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <svg
        className={`animate-spin ${sizeMap[size] ?? sizeMap.md} ${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={text ?? "Loading…"}
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {text && (
        <p className="text-sm text-text-secondary font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center
                   bg-white/80 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        {spinner}
      </div>
    );
  }

  if (inline) {
    return spinner;
  }

  return (
    <div
      className="flex items-center justify-center py-12"
      role="status"
      aria-live="polite"
    >
      {spinner}
    </div>
  );
};

export default Loader;
