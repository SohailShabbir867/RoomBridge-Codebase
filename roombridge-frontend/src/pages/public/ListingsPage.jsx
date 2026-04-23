import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  RiFilterLine,
  RiSearchLine,
  RiMapPin2Line,
  RiHotelLine,
  RiGroupLine,
  RiWifiLine,
  RiTempColdLine,
  RiCarLine,
  RiCloseLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiHeart3Line,
  RiHeart3Fill,
  RiGridLine,
  RiListCheck,
  RiSortAsc,
  RiHome4Line,
  RiLoader4Line,
  RiRefreshLine,
} from "react-icons/ri";
import { CITIES, AMENITIES } from "../../utils/constants";
import listingService from "../../services/listingService";
import toast from "react-hot-toast";

document.title = "Browse Rooms — RoomBridge";

/* Room types — must match Listing.model.js enum: single | shared | apartment */
const ROOM_TYPES = [
  { value: "single", label: "Single Room" },
  { value: "shared", label: "Shared Room" },
  { value: "apartment", label: "Full Apartment" },
];

/*
  Budget filter was bound to filters.budget (a free string)
  and sent as a single query param that the backend doesn't understand.
  Backend supports minRent and maxRent as separate params.
  We keep 'budget' as a local UI selector key and split it when building params.
*/
const PRICE_RANGES = [
  { value: "", label: "Any Budget", min: "", max: "" },
  { value: "0-10000", label: "Under 10,000", min: "0", max: "10000" },
  { value: "10000-20000", label: "10k – 20k", min: "10000", max: "20000" },
  { value: "20000-35000", label: "20k – 35k", min: "20000", max: "35000" },
  { value: "35000-50000", label: "35k – 50k", min: "35000", max: "50000" },
  { value: "50000+", label: "50k+", min: "50000", max: "" },
];

const AMENITY_ICONS = {
  WiFi: RiWifiLine,
  AC: RiTempColdLine,
  Parking: RiCarLine,
  default: RiHotelLine,
};

/* ── ListingCard ────────────────────────────────────────────── */
const ListingCard = ({ listing, view, onToggleSave }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [saved, setSaved] = useState(listing.isSaved || false);
  const [saveLoading, setSaveLoading] = useState(false);
  const isGrid = view === "grid";
  const photo =
    listing.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80";

  const typeMap = {
    single: "Single Room",
    shared: "Shared Room",
    apartment: "Apartment",
  };
  const typeLabel = typeMap[listing.roomType] || listing.roomType || "Room";

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please log in to save listings.");
      return;
    }
    try {
      setSaveLoading(true);
      if (saved) {
        await listingService.unsaveListing(listing._id);
        setSaved(false);
        onToggleSave?.(listing._id, false);
      } else {
        await listingService.saveListing(listing._id);
        setSaved(true);
        onToggleSave?.(listing._id, true);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update saved listings.",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-card border border-border shadow-card
                     hover:shadow-hover transition-all duration-300 group overflow-hidden
                     ${isGrid ? "" : "flex gap-0"}`}
    >
      {/* Image */}
      <div
        className={`relative overflow-hidden ${isGrid ? "w-full" : "w-56 shrink-0"}`}
      >
        <img
          src={photo}
          alt={listing.title}
          className={`object-cover w-full group-hover:scale-105 transition-transform duration-500
                         ${isGrid ? "h-48" : "h-full min-h-[160px]"}`}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80";
          }}
          loading="lazy"
        />
        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saveLoading}
          aria-label={saved ? "Remove from saved" : "Save listing"}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                     flex items-center justify-center shadow-card
                     hover:bg-white transition-all duration-200 disabled:opacity-60"
        >
          {saveLoading ? (
            <RiLoader4Line className="text-sm animate-spin text-primary" />
          ) : saved ? (
            <RiHeart3Fill className="text-error text-base" />
          ) : (
            <RiHeart3Line className="text-text-secondary text-base hover:text-error transition-colors" />
          )}
        </button>
        {/* Type badge */}
        <div
          className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm
                        text-white text-xs font-medium px-2.5 py-1 rounded-full"
        >
          {typeLabel}
        </div>
      </div>

      {/* Info */}
      <Link
        to={`/listings/${listing._id}`}
        className="block p-4 flex-1 min-w-0"
      >
        <h3
          className="font-semibold text-primary text-sm leading-snug line-clamp-2
                       group-hover:text-secondary transition-colors duration-200 mb-1"
        >
          {listing.title}
        </h3>
        <p className="text-text-secondary text-xs flex items-center gap-1 mb-2">
          <RiMapPin2Line className="text-accent shrink-0" />
          {listing.address ? `${listing.address}, ` : ""}
          {listing.city}
        </p>
        {/* Amenities */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(listing.amenities || []).slice(0, 3).map((a) => {
            const Icon = AMENITY_ICONS[a] || AMENITY_ICONS.default;
            return (
              <Icon
                key={a}
                className="text-text-secondary text-sm"
                title={a}
                aria-label={a}
              />
            );
          })}
          {listing.genderPreference && listing.genderPreference !== "any" && (
            <span className="flex items-center gap-1 text-xs text-secondary font-medium">
              <RiGroupLine />{" "}
              {listing.genderPreference === "male"
                ? "Male only"
                : "Female only"}
            </span>
          )}
        </div>
        {/* Price — listing.rent (not listing.price) */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              PKR {(listing.rent || 0).toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary">/month</span>
          </div>
          <span
            className="text-xs font-semibold text-secondary border border-secondary/30
                           px-2.5 py-1 rounded-full hover:bg-secondary hover:text-white
                           transition-all duration-200"
          >
            View →
          </span>
        </div>
      </Link>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   LISTINGS PAGE
════════════════════════════════════════════════════════════ */
const ListingsPage = () => {
  const [searchParams] = useSearchParams();

  const [view, setView] = useState("grid");
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const PER_PAGE = 9;

  /* Debounce search input */
  const searchDebounceRef = useRef(null);

  /*
    All filter keys now match the backend query param names.
    - 'type' → 'roomType'
    - 'budget' kept for UI display; split to minRent/maxRent when building API params
    - 'sort' → 'sortBy'
  */
  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    roomType: searchParams.get("roomType") || "",
    budget: "", // UI-only selector
    amenities: [],
    sortBy: "newest",
    search: "",
  });

  const handleFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setFilters((f) => ({ ...f, search: val }));
    /* Debounce API calls while user is typing */
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setPage(1), 500);
  };

  const handleAmenityToggle = (amenity) =>
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }));

  const clearFilters = () => {
    setFilters({
      city: "",
      roomType: "",
      budget: "",
      amenities: [],
      sortBy: "newest",
      search: "",
    });
    setPage(1);
  };

  /* ── Fetch listings from API ───────────────────────────────── */
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: PER_PAGE };
      if (filters.city) params.city = filters.city;
      /*
        filter key is now 'roomType' (not 'type')
      */
      if (filters.roomType) params.roomType = filters.roomType;
      if (filters.search) params.search = filters.search;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.amenities.length)
        params.amenities = filters.amenities.join(",");
      /*
        'budget' is a UI-only range string. Split into minRent/maxRent.
      */
      if (filters.budget) {
        const range = PRICE_RANGES.find((r) => r.value === filters.budget);
        if (range?.min) params.minRent = range.min;
        if (range?.max) params.maxRent = range.max;
      }

      const res = await listingService.getListings(params);
      /*
        backend returns { success, listings, pagination }
        Original code used res.data (undefined) and res.pagination?.total.
        Fix: read res.listings (or fall back to res.data for flexibility).
      */
      setListings(
        Array.isArray(res.listings)
          ? res.listings
          : Array.isArray(res.data)
            ? res.data
            : [],
      );
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load listings.";
      setError(msg);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  /* Cleanup debounce on unmount */
  useEffect(() => () => clearTimeout(searchDebounceRef.current), []);

  /*
    'filtered' was referenced as an undefined variable (ReferenceError crash).
    Replaced with the actual 'total' count from API response.
    was checking filters.budget — now correctly checks filters.budget too.
  */
  const activeFilterCount =
    [filters.city, filters.roomType, filters.budget].filter(Boolean).length +
    filters.amenities.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-border sticky top-16 z-30">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4
                        flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Search input with debounce */}
            <div className="relative flex-1 max-w-sm">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              <input
                type="text"
                placeholder="Search rooms…"
                value={filters.search}
                onChange={handleSearchChange}
                aria-label="Search listings"
                className="input pl-9 py-2.5 text-sm"
              />
              {filters.search && (
                <button
                  onClick={() => {
                    handleFilter("search", "");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                  aria-label="Clear search"
                >
                  <RiCloseLine />
                </button>
              )}
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((s) => !s)}
              aria-pressed={showFilters}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg
                          border transition-all duration-200
                          ${
                            showFilters
                              ? "border-primary bg-primary text-white"
                              : "border-border text-primary hover:border-primary"
                          }`}
            >
              <RiFilterLine />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className="ml-1 bg-accent text-primary text-xs font-bold
                                  w-4 h-4 rounded-full flex items-center justify-center"
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Results count + view toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-text-secondary hidden sm:block">
              {loading
                ? "…"
                : `${total.toLocaleString()} room${total !== 1 ? "s" : ""} found`}
            </span>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={`p-2.5 transition-colors ${view === "grid" ? "bg-primary text-white" : "text-text-secondary hover:text-primary"}`}
              >
                <RiGridLine className="text-base" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={`p-2.5 transition-colors ${view === "list" ? "bg-primary text-white" : "text-text-secondary hover:text-primary"}`}
              >
                <RiListCheck className="text-base" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* ── Filters sidebar ── */}
          {showFilters && (
            <aside
              className="w-64 shrink-0 hidden lg:block"
              aria-label="Listing filters"
            >
              <div className="bg-white rounded-card border border-border p-5 sticky top-36">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-primary">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-error hover:text-red-700 flex items-center gap-1"
                    >
                      <RiCloseLine /> Clear all
                    </button>
                  )}
                </div>

                {/* City */}
                <div className="mb-5">
                  <label className="label" htmlFor="filter-city">
                    City
                  </label>
                  <div className="relative">
                    <RiMapPin2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                    <select
                      id="filter-city"
                      value={filters.city}
                      onChange={(e) => handleFilter("city", e.target.value)}
                      className="input pl-9 py-2.5 appearance-none text-sm"
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

                {/* Room Type
                  radio buttons now bind to filters.roomType (not filters.type).
                  ROOM_TYPES values now match backend enum.
                */}
                <div className="mb-5">
                  <label className="label">Room Type</label>
                  <div className="space-y-2">
                    {ROOM_TYPES.map(({ value, label }) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="roomType"
                          value={value}
                          checked={filters.roomType === value}
                          onChange={() =>
                            handleFilter(
                              "roomType",
                              filters.roomType === value ? "" : value,
                            )
                          }
                          className="accent-primary"
                        />
                        <span className="text-sm text-primary group-hover:text-secondary transition-colors">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Budget
                  was binding to filters.budget but sending it as a raw
                  string query param. Now just a UI selector; fetchListings splits it.
                */}
                <div className="mb-5">
                  <label className="label" htmlFor="filter-budget">
                    Budget (PKR/month)
                  </label>
                  <select
                    id="filter-budget"
                    value={filters.budget}
                    onChange={(e) => handleFilter("budget", e.target.value)}
                    className="input py-2.5 text-sm appearance-none"
                  >
                    {PRICE_RANGES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amenities */}
                <div>
                  <label className="label">Amenities</label>
                  <div className="space-y-2">
                    {AMENITIES.slice(0, 6).map((amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.amenities.includes(amenity)}
                          onChange={() => handleAmenityToggle(amenity)}
                          className="accent-primary"
                        />
                        <span className="text-sm text-primary">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4">
              {/* was referencing undefined 'filtered.length' — use total */}
              <p className="text-sm text-text-secondary lg:hidden">
                {total.toLocaleString()} room{total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <RiSortAsc className="text-text-secondary" aria-hidden="true" />
                {/* was reading filters.sort (undefined) — corrected to filters.sortBy */}
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilter("sortBy", e.target.value)}
                  aria-label="Sort listings"
                  className="text-sm text-primary border border-border rounded-lg px-3 py-1.5
                                   outline-none focus:border-primary transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-error text-sm mb-4">{error}</p>
                <button
                  onClick={fetchListings}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RiRefreshLine /> Try again
                </button>
              </div>
            )}

            {/* Loading state */}
            {!error && loading && (
              <div className="flex items-center justify-center py-20">
                <RiLoader4Line
                  className="animate-spin text-4xl text-primary"
                  aria-label="Loading listings"
                />
              </div>
            )}

            {/* Empty state */}
            {!error && !loading && listings.length === 0 && (
              <div className="text-center py-20">
                <RiHome4Line
                  className="text-5xl text-border mx-auto mb-4"
                  aria-hidden="true"
                />
                <h3 className="text-xl font-bold text-primary mb-2">
                  No Rooms Found
                </h3>
                <p className="text-text-secondary mb-5">
                  {activeFilterCount > 0
                    ? "Try adjusting your filters to see more results."
                    : "No listings available right now. Check back soon!"}
                </p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="btn-secondary">
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Listing grid/list */}
            {!error && !loading && listings.length > 0 && (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                    : "flex flex-col gap-4"
                }
              >
                {listings.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    view={view}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div
                className="flex items-center justify-center gap-2 mt-10"
                role="navigation"
                aria-label="Pagination"
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                  className="p-2 rounded-lg border border-border text-text-secondary
                                   hover:border-primary hover:text-primary transition-all
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RiArrowLeftLine />
                </button>

                {/* Show at most 5 page buttons */}
                {(() => {
                  const pages = [];
                  const start = Math.max(1, page - 2);
                  const end = Math.min(totalPages, start + 4);
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={page === p ? "page" : undefined}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200
                                        ${
                                          page === p
                                            ? "bg-primary text-white shadow-card"
                                            : "border border-border text-text-secondary hover:border-primary hover:text-primary"
                                        }`}
                    >
                      {p}
                    </button>
                  ));
                })()}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                  className="p-2 rounded-lg border border-border text-text-secondary
                                   hover:border-primary hover:text-primary transition-all
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RiArrowRightLine />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsPage;
