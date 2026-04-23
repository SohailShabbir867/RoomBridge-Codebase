import React, { useState } from "react";
import {
  RiSearchLine,
  RiMapPin2Line,
  RiMoneyDollarCircleLine,
  RiHome4Line,
  RiFilterLine,
  RiCloseLine,
  RiRefreshLine,
} from "react-icons/ri";
import { CITIES, ROOM_TYPES } from "../../utils/constants";

/*
  ListingFilters — search & filter panel for ListingsPage.

  Props:
    filters: {
      search, city, roomType, minRent, maxRent,
      genderPreference, furnished, sortBy
    }
    onChange: (updatedFilters) => void   — called on any filter change
    onReset:  () => void                 — clear all filters
    loading:  bool

  Design: controlled component — parent owns state.
  No internal state needed (all values flow from props).
  This keeps the URL-sync logic in ListingsPage simple.
*/

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "rent_asc", label: "Rent: Low → High" },
  { value: "rent_desc", label: "Rent: High → Low" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Any Gender" },
  { value: "any", label: "Any" },
  { value: "male", label: "Male Only" },
  { value: "female", label: "Female Only" },
];

const ListingFilters = ({ filters = {}, onChange, onReset }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handle = (key, val) => {
    if (onChange) onChange({ ...filters, [key]: val });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.city ||
    filters.roomType ||
    filters.minRent ||
    filters.maxRent ||
    filters.genderPreference ||
    filters.furnished
  );

  const renderFilterContent = () => (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="label" htmlFor="lf-search">
          Search
        </label>
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            id="lf-search"
            type="text"
            placeholder="Title, area, city…"
            value={filters.search || ""}
            onChange={(e) => handle("search", e.target.value)}
            className="input pl-9"
          />
          {filters.search && (
            <button
              onClick={() => handle("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
            >
              <RiCloseLine />
            </button>
          )}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="label" htmlFor="lf-city">
          City
        </label>
        <div className="relative">
          <RiMapPin2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <select
            id="lf-city"
            value={filters.city || ""}
            onChange={(e) => handle("city", e.target.value)}
            className="input pl-9 appearance-none"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Room Type */}
      <div>
        <label className="label" htmlFor="lf-roomType">
          Room Type
        </label>
        <div className="relative">
          <RiHome4Line className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <select
            id="lf-roomType"
            value={filters.roomType || ""}
            onChange={(e) => handle("roomType", e.target.value)}
            className="input pl-9 appearance-none"
          >
            <option value="">All Types</option>
            {ROOM_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rent range */}
      <div>
        <label className="label">Rent Range (PKR/mo)</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <RiMoneyDollarCircleLine className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-sm" />
            <input
              type="number"
              placeholder="Min"
              min={0}
              value={filters.minRent || ""}
              onChange={(e) => handle("minRent", e.target.value)}
              className="input pl-7 text-sm"
              aria-label="Minimum rent"
            />
          </div>
          <div className="relative flex-1">
            <RiMoneyDollarCircleLine className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-sm" />
            <input
              type="number"
              placeholder="Max"
              min={0}
              value={filters.maxRent || ""}
              onChange={(e) => handle("maxRent", e.target.value)}
              className="input pl-7 text-sm"
              aria-label="Maximum rent"
            />
          </div>
        </div>
      </div>

      {/* Gender preference */}
      <div>
        <label className="label" htmlFor="lf-gender">
          Gender Preference
        </label>
        <select
          id="lf-gender"
          value={filters.genderPreference || ""}
          onChange={(e) => handle("genderPreference", e.target.value)}
          className="input"
        >
          {GENDER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Furnished toggle */}
      <label
        className="flex items-center gap-3 p-3 bg-background rounded-input border border-border
                         cursor-pointer select-none hover:border-primary transition-colors"
      >
        <input
          type="checkbox"
          checked={!!filters.furnished}
          onChange={(e) => handle("furnished", e.target.checked || "")}
          className="accent-primary w-4 h-4"
        />
        <span className="text-sm text-primary">Furnished rooms only</span>
      </label>

      {/* Sort */}
      <div>
        <label className="label" htmlFor="lf-sort">
          Sort By
        </label>
        <select
          id="lf-sort"
          value={filters.sortBy || "newest"}
          onChange={(e) => handle("sortBy", e.target.value)}
          className="input"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Reset */}
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-btn
                           border border-error/30 text-error text-sm hover:bg-error/5 transition-colors"
        >
          <RiRefreshLine /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-card border border-border shadow-card p-5 sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <RiFilterLine className="text-secondary" /> Filters
            </h3>
            {hasActiveFilters && (
              <span className="text-xs bg-primary text-white px-1.5 rounded-full font-bold">
                {
                  [
                    filters.search,
                    filters.city,
                    filters.roomType,
                    filters.minRent,
                    filters.maxRent,
                    filters.genderPreference,
                    filters.furnished,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </div>
          {renderFilterContent()}
        </div>
      </div>

      {/* ── Mobile: floating button + drawer ─────────── */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-primary text-white
                     px-4 py-3 rounded-full shadow-hover text-sm font-medium"
          aria-label="Open filters"
        >
          <RiFilterLine />
          Filters
          {hasActiveFilters && (
            <span className="bg-white text-primary text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {
                [
                  filters.search,
                  filters.city,
                  filters.roomType,
                  filters.minRent,
                  filters.maxRent,
                  filters.genderPreference,
                  filters.furnished,
                ].filter(Boolean).length
              }
            </span>
          )}
        </button>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed right-0 top-0 bottom-0 z-50 w-80 max-w-full bg-white shadow-hover
                         flex flex-col transition-transform duration-300
                         ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <RiFilterLine className="text-secondary" /> Filters
            </h3>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close filters"
              className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary"
            >
              <RiCloseLine className="text-xl" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {renderFilterContent()}
          </div>
          <div className="p-4 border-t border-border">
            <button
              onClick={() => setMobileOpen(false)}
              className="w-full btn-primary justify-center"
            >
              Show Results
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListingFilters;
