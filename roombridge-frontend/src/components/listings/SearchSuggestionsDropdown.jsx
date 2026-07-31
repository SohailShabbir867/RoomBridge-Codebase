import React from "react";
import {
  RiSearchLine,
  RiMapPin2Line,
  RiBuilding3Line,
  RiHome4Line,
  RiCompass3Line,
  RiLoader4Line,
  RiArrowRightUpLine,
} from "react-icons/ri";

/**
 * High-performance, accessible search suggestion dropdown component
 * Matching Google-style real-time autocomplete suggestions with category icons.
 */
const SearchSuggestionsDropdown = ({
  suggestions = [],
  query = "",
  onSelectSuggestion,
  activeIndex = -1,
  setActiveIndex,
  isLoading = false,
  onSearchSubmit,
}) => {
  if (!query || (!isLoading && suggestions.length === 0)) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case "city":
        return <RiMapPin2Line className="text-emerald-600 text-sm shrink-0" />;
      case "university":
        return <RiBuilding3Line className="text-amber-600 text-sm shrink-0" />;
      case "hostel":
        return <RiHome4Line className="text-indigo-600 text-sm shrink-0" />;
      case "area":
        return <RiCompass3Line className="text-rose-500 text-sm shrink-0" />;
      case "category":
        return <RiHome4Line className="text-purple-600 text-sm shrink-0" />;
      case "combination":
        return <RiCompass3Line className="text-teal-600 text-sm shrink-0" />;
      default:
        return <RiSearchLine className="text-gray-400 text-sm shrink-0" />;
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case "city":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "university":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "hostel":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
      case "area":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "category":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      case "combination":
        return "bg-teal-50 text-teal-700 border-teal-200/60";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const highlightMatch = (text, matchQuery) => {
    if (!matchQuery || !text) return text;
    const parts = text.split(new RegExp(`(${matchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === matchQuery.toLowerCase() ? (
            <span key={i} className="font-extrabold text-[#012D1D] underline decoration-[#8E4E14]/40 decoration-2">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-1.5 text-left transition-all animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ boxShadow: "0 20px 40px -15px rgba(1, 45, 29, 0.12)" }}
    >
      {/* Small Header status line */}
      <div className="px-3.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100/70">
        <span>Suggestions for &ldquo;{query}&rdquo;</span>
        {isLoading && <RiLoader4Line className="animate-spin text-[#8E4E14] text-xs" />}
      </div>

      {/* Suggestions List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50/50">
        {suggestions.map((item, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <div
              key={`${item.type}-${item.text}-${idx}`}
              onClick={() => onSelectSuggestion(item)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 ${
                isSelected
                  ? "bg-[#F7F4EF] border-l-4 border-[#8E4E14] pl-2.5"
                  : "hover:bg-gray-50/80 border-l-4 border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-gray-100/80 flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-gray-800 truncate">
                    {highlightMatch(item.text, query)}
                  </div>
                  {item.subtext && (
                    <div className="text-[10px] text-gray-400 truncate mt-0.5">
                      {item.subtext}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getBadgeStyle(
                    item.type
                  )}`}
                >
                  {item.type}
                </span>
                <RiArrowRightUpLine className="text-gray-300 text-xs hidden sm:block" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct Search Option Footer */}
      <div
        onClick={() => onSearchSubmit?.(query)}
        className="mt-1 px-3.5 py-2.5 bg-gray-50/70 hover:bg-[#F7F4EF] border-t border-gray-100 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5 text-xs text-[#012D1D] font-bold">
          <RiSearchLine className="text-[#8E4E14]" />
          <span>Search all results for &ldquo;{query}&rdquo;</span>
        </div>
        <span className="text-[10px] text-gray-400 font-semibold bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
          Press ↵ Enter
        </span>
      </div>
    </div>
  );
};

export default SearchSuggestionsDropdown;
