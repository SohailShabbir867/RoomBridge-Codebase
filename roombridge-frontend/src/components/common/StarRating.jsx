import React, { useState } from 'react';
import { RiStarFill, RiStarHalfFill, RiStarLine } from 'react-icons/ri';

/**
 * StarRating
 *
 * Props:
 *   rating      — current value (0–5, supports halves: 4.5)
 *   maxStars    — total stars to display (default 5)
 *   size        — 'sm' | 'md' | 'lg'  (default 'md')
 *   interactive — if true, clicking/hovering selects a rating
 *   onChange    — called with new numeric value when interactive
 *   showValue   — show the numeric label next to stars (default true)
 *   label       — accessibility label prefix (default 'star')
 *   className   — extra wrapper classes
 */
const sizeMap = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

const valueSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const StarRating = ({
  rating      = 0,
  maxStars    = 5,
  size        = 'md',
  interactive = false,
  onChange,
  showValue   = true,
  label       = 'star',
  className   = '',
}) => {
  const [hovered, setHovered] = useState(null);

  /* Displayed value: hovered (while hovering in interactive mode) or actual rating */
  const displayed = hovered !== null ? hovered : Number(rating) || 0;
  const iconClass = `${sizeMap[size] ?? sizeMap.md}`;

  const getIcon = (index) => {
    const threshold = index + 1;
    if (displayed >= threshold)        return RiStarFill;       // full
    if (displayed >= threshold - 0.5)  return RiStarHalfFill;  // half
    return RiStarLine;                                          // empty
  };

  const getColor = (index) => {
    return displayed >= index + 0.5 ? 'text-warning' : 'text-border';
  };

  const handleClick = (value) => {
    if (!interactive) return;
    /*
      BUG FIX: clicking the same value again de-selects (sets to 0).
      This lets the user clear their rating.
    */
    onChange?.(Number(rating) === value ? 0 : value);
  };

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? 'Rating selector' : `Rating: ${Number(rating).toFixed(1)} out of ${maxStars}`}
    >
      <div className="flex items-center gap-0.5">
        {[...Array(maxStars)].map((_, i) => {
          const Icon  = getIcon(i);
          const value = i + 1;
          return (
            <button
              key={i}
              type="button"
              role={interactive ? 'radio' : undefined}
              aria-checked={interactive ? Number(rating) === value : undefined}
              aria-label={`${value} ${label}${value !== 1 ? 's' : ''}`}
              disabled={!interactive}
              onMouseEnter={() => interactive && setHovered(value)}
              onMouseLeave={() => interactive && setHovered(null)}
              onClick={() => handleClick(value)}
              className={[
                iconClass,
                getColor(i),
                'transition-colors duration-150',
                interactive
                  ? 'cursor-pointer hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning'
                  : 'cursor-default pointer-events-none',
              ].join(' ')}
            >
              <Icon />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className={`font-semibold text-text-secondary ml-1 ${valueSizeMap[size] ?? valueSizeMap.md}`}>
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
