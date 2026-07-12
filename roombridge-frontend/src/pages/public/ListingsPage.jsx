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
  RiHome4Line,
  RiLoader4Line,
  RiRefreshLine,
  RiStarFill,
  RiShieldCheckLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiCoinsLine,
  RiBuilding3Line,
  RiVipCrownLine,
} from "react-icons/ri";
import { CITIES, AMENITIES } from "../../utils/constants";
import listingService from "../../services/listingService";
import toast from "react-hot-toast";
import { useSEO } from "../../hooks/useSEO";

/* ─── Design tokens (match Figma) ──────────────────────────── */
const C = {
  darkGreen: "#012D1D",
  btnBrown:  "#8E4E14",
  accent:    "#FFAB69",
  cream:     "#F7F4EF",
  promise:   "#F0EDE9",
  white:     "#FFFFFF",
};

/* Room types — must match Listing.model.js enum: single | shared | apartment */
const ROOM_TYPES = [
  { value: "single", label: "Single Room" },
  { value: "shared", label: "Shared Room" },
  { value: "apartment", label: "Full Apartment" },
];

/* Price ranges */
const PRICE_RANGES = [
  { value: "", label: "Any Budget", min: "", max: "" },
  { value: "0-5000", label: "Under 5,000 (Economy)", min: "0", max: "5000" },
  { value: "5000-10000", label: "5,000 – 10,000 (Standard)", min: "5000", max: "10000" },
  { value: "10000-20000", label: "10,000 – 20,000 (Premium)", min: "10000", max: "20000" },
  { value: "20000+", label: "20,000+ (Luxury)", min: "20000", max: "" },
];

/* ── ListingCard ────────────────────────────────────────────── */
const ListingCard = ({ listing, view, onToggleSave }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [saved, setSaved] = useState(listing.isSaved || false);
  const [saveLoading, setSaveLoading] = useState(false);
  const isGrid = view === "grid";
  const photo =
    listing.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80";

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
      className={`bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
        isGrid ? "w-full" : "sm:flex-row sm:h-56"
      }`}
    >
      {/* Image Area */}
      <div
        className={`relative overflow-hidden shrink-0 ${
          isGrid ? "h-56 w-full" : "w-full sm:w-64 h-52 sm:h-auto"
        }`}
      >
        <img
          src={photo}
          alt={listing.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80";
          }}
          loading="lazy"
        />

        {/* Badges overlay on image left */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start pointer-events-none">
          <span className="bg-[#E8F5E9]/95 backdrop-blur-sm text-[#2E7D32] text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
            ✓ Verified
          </span>
          <span className="bg-[#FFF3E0]/95 backdrop-blur-sm text-[#EF6C00] text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {listing.genderPreference === "male"
              ? "BOYS"
              : listing.genderPreference === "female"
              ? "GIRLS"
              : "MIXED"}
          </span>
        </div>

        {/* Save heart button on right top */}
        <button
          onClick={handleSave}
          disabled={saveLoading}
          aria-label={saved ? "Remove from saved" : "Save listing"}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {saveLoading ? (
            <RiLoader4Line className="text-xs animate-spin text-gray-500" />
          ) : saved ? (
            <RiHeart3Fill className="text-red-500 text-sm" />
          ) : (
            <RiHeart3Line className="text-gray-400 hover:text-red-500 transition-colors text-sm" />
          )}
        </button>
      </div>

      {/* Info Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Header Row: Title & Price */}
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="font-extrabold font-serif text-base leading-snug text-[#012D1D] truncate flex-1 hover:text-[#8E4E14] transition-colors">
              <Link to={`/explore/${listing._id}`}>{listing.title}</Link>
            </h3>
            <div className="text-right shrink-0">
              <span className="text-base font-extrabold text-[#8E4E14]">
                PKR {listing.rent?.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-gray-400 block tracking-wider uppercase mt-0.5">
                Per Month
              </span>
            </div>
          </div>

          {/* Location Row */}
          <p className="text-gray-400 text-xs flex items-center gap-1 mb-4 font-light">
            <RiMapPin2Line className="text-gray-400" />
            {listing.address ? `${listing.address}, ` : ""}
            {listing.city}
          </p>

          {/* Horizontal Amenities Icons Row */}
          <div className="flex items-center gap-4 mb-4">
            {["WiFi", "AC", "Laundry", "CCTV"].map((amenityKey) => {
              const matched = (listing.amenities || []).some((a) =>
                a.toLowerCase().includes(amenityKey.toLowerCase())
              );

              const iconMap = {
                WiFi: RiWifiLine,
                AC: RiTempColdLine,
                Laundry: RiHotelLine,
                CCTV: RiShieldCheckLine,
              };
              const Icon = iconMap[amenityKey];

              return (
                <div
                  key={amenityKey}
                  className={`flex flex-col items-center gap-1 text-[9px] font-bold tracking-wide w-10 text-center transition-colors ${
                    matched ? "text-[#012D1D]" : "text-gray-300"
                  }`}
                >
                  <Icon className="text-sm" />
                  <span>{amenityKey}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer: Rating & Action details */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div className="flex items-center text-xs">
            <RiStarFill className="text-amber-500 mr-1" />
            <span className="font-extrabold text-[#012D1D]">{listing.rating || "4.8"}</span>
            <span className="text-gray-400 ml-1 font-light">
              ({listing.reviewsCount || 32} reviews)
            </span>
          </div>

          <Link
            to={`/explore/${listing._id}`}
            className="text-xs font-bold hover:underline transition-all"
            style={{ color: C.btnBrown }}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   LISTINGS PAGE
════════════════════════════════════════════════════════════ */
const ListingsPage = () => {
  useSEO({
    title: "Browse Verified Rooms | RoomBridge Pakistan",
    description: "Explore listings of hostels, shared student flats, and single rooms for rent in Karachi, Lahore, Islamabad, and across Pakistan on roombridge.site.",
    keywords: "student flats, hostel directory, Lahore rooms, Karachi rooms, roombridge.site, roommate finders"
  });

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

  const searchDebounceRef = useRef(null);

  const [filters, setFilters] = useState({
    city:             searchParams.get("city")             || "",
    roomType:         searchParams.get("roomType")         || "",
    genderPreference: searchParams.get("genderPreference") || "",
    budget:           "",
    amenities:        [],
    sortBy:           "newest",
    search:           searchParams.get("search")           || "",
    location:         searchParams.get("location")         || "",
  });

  // Set page title on mount
  React.useEffect(() => { document.title = "Browse Rooms — RoomBridge"; }, []);

  const handleFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setFilters((f) => ({ ...f, search: val }));
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
      city:             "",
      roomType:         "",
      genderPreference: "",
      budget:           "",
      amenities:        [],
      sortBy:           "newest",
      search:           "",
      location:         "",
    });
    setPage(1);
  };

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: PER_PAGE };
      if (filters.city)             params.city             = filters.city;
      if (filters.roomType)         params.roomType         = filters.roomType;
      if (filters.genderPreference) params.genderPreference = filters.genderPreference;
      if (filters.search)           params.search           = filters.search;
      if (filters.location)         params.location         = filters.location;
      if (filters.sortBy)           params.sortBy           = filters.sortBy;
      if (filters.amenities.length) params.amenities        = filters.amenities.join(",");
      if (filters.budget) {
        const range = PRICE_RANGES.find((r) => r.value === filters.budget);
        if (range?.min) params.minRent = range.min;
        if (range?.max) params.maxRent = range.max;
      }

      const res = await listingService.getListings(params);
      setListings(
        Array.isArray(res.listings)
          ? res.listings
          : Array.isArray(res.data)
          ? res.data
          : []
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

  useEffect(() => () => clearTimeout(searchDebounceRef.current), []);

  const activeFilterCount =
    [filters.city, filters.roomType, filters.budget, filters.genderPreference, filters.location]
      .filter(Boolean).length +
    filters.amenities.length;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: C.cream }}>
      {/* ── Page Header / Search Bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[60px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by hostel name, university, area..."
                value={filters.search}
                onChange={handleSearchChange}
                aria-label="Search listings"
                className="w-full bg-[#F5F2EB] border-0 rounded-xl py-2.5 pl-10 pr-8 text-xs font-semibold focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800 placeholder-gray-400/80"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilter("search", "")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <RiCloseLine />
                </button>
              )}
              {/* Hint: university search */}
              {filters.search && (
                <div className="absolute top-full left-0 mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  🎓 Searching across hostels, addresses &amp; nearby universities
                </div>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters((s) => !s)}
              aria-pressed={showFilters}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95"
              style={{
                backgroundColor: showFilters ? C.darkGreen : C.white,
                color: showFilters ? C.white : C.darkGreen,
                borderColor: showFilters ? C.darkGreen : "rgba(0,0,0,0.08)",
              }}
            >
              <RiFilterLine />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className="ml-1 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: showFilters ? C.accent : C.darkGreen,
                    color: showFilters ? C.darkGreen : C.white,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Results count & view toggles */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs font-bold text-gray-400 hidden sm:block">
              {loading ? "..." : `${total} host${total !== 1 ? "els" : "el"} found`}
            </span>
            
            <div className="flex border border-gray-200/80 rounded-xl overflow-hidden shadow-sm bg-white">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={`p-2 transition-colors cursor-pointer ${
                  view === "grid" ? "text-white" : "text-gray-400 hover:text-[#012D1D]"
                }`}
                style={{ backgroundColor: view === "grid" ? C.darkGreen : undefined }}
              >
                <RiGridLine className="text-base" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={`p-2 transition-colors cursor-pointer ${
                  view === "list" ? "text-white" : "text-gray-400 hover:text-[#012D1D]"
                }`}
                style={{ backgroundColor: view === "list" ? C.darkGreen : undefined }}
              >
                <RiListCheck className="text-base" />
              </button>
            </div>
          </div>

        </div>
      </div>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ── Listings Results Grid (now at the top) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mb-16">
          
          {/* ── Filters Sidebar ── */}
          {showFilters && (
            <aside className="col-span-1" aria-label="Listing filters">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 sticky top-36 space-y-6 shadow-sm">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-extrabold font-serif text-lg text-[#012D1D]">Filters</h3>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block">
                      Refine your sanctuary
                    </span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-[10px] font-bold text-red-500 uppercase tracking-wider hover:text-red-700 cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* City Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    City
                  </label>
                  <div className="relative">
                    <RiMapPin2Line className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={filters.city}
                      onChange={(e) => handleFilter("city", e.target.value)}
                      className="w-full bg-[#F5F2EB] border-0 rounded-xl py-3 px-4 pl-10 text-xs font-semibold focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800 appearance-none cursor-pointer"
                    >
                      <option value="">All Cities</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <RiArrowDownSLine className="text-base" />
                    </div>
                  </div>
                </div>



                {/* Location / Area Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Area / Locality
                  </label>
                  <div className="relative">
                    <RiMapPin2Line className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="location-filter"
                      type="text"
                      placeholder="e.g. Johar Town, Model Town"
                      value={filters.location}
                      onChange={(e) => { handleFilter("location", e.target.value); }}
                      className="w-full bg-[#F5F2EB] border-0 rounded-xl py-3 px-4 pl-10 text-xs font-semibold focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800 placeholder-gray-400/80"
                    />
                  </div>
                </div>

                {/* Gender Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Gender
                  </label>
                  <div className="flex gap-2">
                    {[
                      { label: "Boys", value: "male" },
                      { label: "Girls", value: "female" },
                      { label: "Mixed", value: "any" }
                    ].map(({ label, value }) => {
                      const isActive = filters.genderPreference === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleFilter("genderPreference", isActive ? "" : value)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer active:scale-95"
                          style={{
                            backgroundColor: isActive ? C.darkGreen : "#F5F2EB",
                            color: isActive ? C.white : C.darkGreen,
                            borderColor: isActive ? C.darkGreen : "#F5F2EB",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Budget Range
                    </label>
                    <span className="text-[10px] font-extrabold text-[#8E4E14]">PKR 5K - 30K</span>
                  </div>
                  <div className="relative">
                    <select
                      value={filters.budget}
                      onChange={(e) => handleFilter("budget", e.target.value)}
                      className="w-full bg-[#F5F2EB] border-0 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800 appearance-none cursor-pointer"
                    >
                      {PRICE_RANGES.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <RiArrowDownSLine className="text-base" />
                    </div>
                  </div>
                </div>

                {/* Amenities / Facilities */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Facilities
                  </label>
                  <div className="space-y-2.5">
                    {AMENITIES.slice(0, 8).map((amenity) => {
                      const isChecked = filters.amenities.includes(amenity);
                      return (
                        <label
                          key={amenity}
                          className="flex items-center gap-2.5 cursor-pointer group text-xs text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleAmenityToggle(amenity)}
                            className="sr-only"
                          />
                          <div
                            className="w-4 h-4 rounded-md border flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: isChecked ? C.darkGreen : C.white,
                              borderColor: isChecked ? C.darkGreen : "#D1D5DB",
                            }}
                          >
                            {isChecked && <span className="text-[10px] text-white font-bold">✓</span>}
                          </div>
                          <span className="font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                            {amenity}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Room Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROOM_TYPES.map(({ value, label }) => {
                      const isActive = filters.roomType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleFilter("roomType", isActive ? "" : value)}
                          className="py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer active:scale-95"
                          style={{
                            backgroundColor: isActive ? C.darkGreen : "#F5F2EB",
                            color: isActive ? C.white : C.darkGreen,
                            borderColor: isActive ? C.darkGreen : "#F5F2EB",
                          }}
                        >
                          {label.split(" ")[0]}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="py-2.5 px-2 rounded-xl text-xs font-bold border text-center bg-[#F5F2EB] text-[#012D1D] border-[#F5F2EB]"
                    >
                      Dormitory
                    </button>
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Distance (KM)
                  </label>
                  <input
                    type="text"
                    placeholder="Within 5 km of campus"
                    className="w-full bg-[#F5F2EB] border-0 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800 placeholder-gray-400/80"
                  />
                </div>

                {/* Submit / Reset */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={fetchListings}
                    className="w-full text-white font-bold py-3.5 px-6 rounded-xl hover:opacity-95 active:scale-[0.98] transition-all duration-200 text-xs uppercase tracking-wider shadow-md cursor-pointer"
                    style={{ backgroundColor: C.darkGreen }}
                  >
                    Apply Filters
                  </button>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-full text-center text-xs text-gray-400 hover:text-red-500 mt-3 underline font-medium block cursor-pointer"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>

              </div>
            </aside>
          )}

          {/* ── Main Results Content ── */}
          <div className={`${showFilters ? "col-span-1 lg:col-span-3" : "col-span-1 lg:col-span-4"}`}>
            
            {/* Upper Info Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-[28px] font-extrabold font-serif tracking-tight leading-tight" style={{ color: C.darkGreen }}>
                  {filters.university
                    ? `Hostels near ${PAKISTAN_UNIVERSITIES.find(u => u.value === filters.university)?.label || filters.university}`
                    : filters.search
                    ? `Results for "${filters.search}"`
                    : filters.location
                    ? `Hostels in "${filters.location}"`
                    : `Showing ${total} hostel${total !== 1 ? "s" : ""}${filters.city ? ` in ${filters.city}` : ""}`
                  }
                </h1>
                <p className="text-xs text-gray-400 mt-1 font-light">
                  {filters.university
                    ? `${total} curated hostel${total !== 1 ? "s" : ""} found near this university`
                    : filters.search || filters.location
                    ? `${total} result${total !== 1 ? "s" : ""} found — sorted by relevance`
                    : "Curated verified stays across Pakistan"}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-end">
                {/* Sort selector */}
                <div className="relative">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilter("sortBy", e.target.value)}
                    aria-label="Sort listings"
                    id="sort-listings-select"
                    className="text-xs font-semibold text-gray-700 border border-gray-200/80 rounded-xl px-4 py-2.5 pr-8 bg-white outline-none hover:bg-gray-50 cursor-pointer appearance-none"
                  >
                    {/* Relevance option shown when search/university/location filter is active */}
                    {(filters.search || filters.university || filters.location) && (
                      <option value="relevance">Sort: Most Relevant</option>
                    )}
                    <option value="newest">Sort: Newest First</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="price_desc">Price: High → Low</option>
                    <option value="most_viewed">Most Viewed</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <RiArrowDownSLine className="text-base" />
                  </div>
                </div>

                {/* Map View */}
                <Link
                  to="/explore"
                  className="text-xs font-semibold text-gray-700 border border-gray-200/80 rounded-xl px-4 py-2.5 bg-white hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RiMapPin2Line className="text-sm" /> Map View
                </Link>
              </div>
            </div>

            {/* Error handling */}
            {error && (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <p className="text-red-500 text-sm mb-4 font-semibold">{error}</p>
                <button
                  onClick={fetchListings}
                  className="inline-flex items-center justify-center font-bold py-2.5 px-6 rounded-xl border border-gray-200 transition-all hover:bg-gray-50 cursor-pointer text-xs uppercase"
                >
                  <RiRefreshLine className="text-base" /> Try again
                </button>
              </div>
            )}

            {/* Loader */}
            {!error && loading && (
              <div className="flex items-center justify-center py-28 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <RiLoader4Line className="animate-spin text-4xl text-gray-400" aria-label="Loading listings" />
              </div>
            )}

            {/* Empty state */}
            {!error && !loading && listings.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <RiHome4Line className="text-5xl text-gray-300 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Rooms Found</h3>
                <p className="text-gray-400 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                  {activeFilterCount > 0
                    ? "Try adjusting your search query or filters to find matching hostels in your area."
                    : "There are no listings posted at the moment. Please check back later!"}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center font-bold py-3 px-8 rounded-xl
                               text-white text-xs uppercase tracking-wider hover:opacity-95 active:scale-95
                               transition-all cursor-pointer shadow-sm"
                    style={{ backgroundColor: C.darkGreen }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Listings Grid */}
            {!error && !loading && listings.length > 0 && (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                    : "flex flex-col gap-6"
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

            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
              <div
                className="flex items-center justify-center gap-2 mt-12"
                role="navigation"
                aria-label="Pagination"
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                  className="w-10 h-10 rounded-xl border border-gray-200/80 text-gray-500 bg-white
                             hover:border-gray-400 hover:text-gray-700 transition-all flex items-center justify-center
                             disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                >
                  <RiArrowLeftLine />
                </button>

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
                      className={`w-10 h-10 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer active:scale-95 ${
                        page === p
                          ? "text-white shadow-sm"
                          : "border border-gray-200/80 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700"
                      }`}
                      style={{
                        backgroundColor: page === p ? C.darkGreen : undefined,
                      }}
                    >
                      {p}
                    </button>
                  ));
                })()}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                  className="w-10 h-10 rounded-xl border border-gray-200/80 text-gray-500 bg-white
                             hover:border-gray-400 hover:text-gray-700 transition-all flex items-center justify-center
                             disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                >
                  <RiArrowRightLine />
                </button>
              </div>
            )}

          </div>

        </div>

        {/* ── Figma Selectors Section (now at the bottom) ── */}
        <div className="max-w-4xl mx-auto mt-24 space-y-16 border-t border-gray-200/60 pt-16">
          
          {/* Categories: Find Your Type of Hostel */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#8E4E14] text-center">
              Categories
            </p>
            <h2 className="font-serif text-3xl font-black text-[#012D1D] text-center mt-1.5 mb-8">
              Find Your Type of Hostel
            </h2>
            
            <div className="flex flex-col gap-4">
              {[
                {
                  id: "male",
                  title: "Gentlemen's Hostels",
                  desc: "Safe, affordable & comfortable hostels for male students and professionals.",
                  img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000&q=80",
                  overlay: "from-[#012D1D]/90 via-[#012D1D]/75 to-transparent",
                },
                {
                  id: "female",
                  title: "Ladies' Hostels",
                  desc: "Secure and well-managed accommodations exclusively for women.",
                  img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1000&q=80",
                  overlay: "from-[#012D1D]/90 via-[#012D1D]/75 to-transparent",
                },
                {
                  id: "any",
                  title: "Mixed & Private Units",
                  desc: "Flat apartments and co-living spaces with premium amenities.",
                  img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&q=80",
                  overlay: "from-[#6b380f]/90 via-[#6b380f]/75 to-transparent",
                },
              ].map((cat) => {
                const isActive = filters.genderPreference === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleFilter("genderPreference", isActive ? "" : cat.id)}
                    className={`relative h-28 w-full rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.005] active:scale-[0.995] transition-all duration-300 border-2 ${
                      isActive ? "border-[#FFAB69] ring-2 ring-[#FFAB69]/30" : "border-transparent"
                    }`}
                  >
                    {/* Background Image */}
                    <img
                      src={cat.img}
                      alt={cat.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${cat.overlay} flex items-center justify-between px-8 sm:px-12 text-white`} />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-between px-8 sm:px-12 text-white z-10 pointer-events-none">
                      <div>
                        <h3 className="font-serif text-lg sm:text-xl font-extrabold tracking-tight">
                          {cat.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-white/85 font-medium mt-1 max-w-[320px] sm:max-w-md leading-relaxed">
                          {cat.desc}
                        </p>
                      </div>
                      
                      {/* Circle plus/arrow button */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all pointer-events-auto ${
                          isActive
                            ? "bg-white text-[#012D1D] border-white font-bold"
                            : "bg-white/10 text-white border-white/30 hover:bg-white hover:text-[#012D1D]"
                        }`}
                      >
                        {isActive ? <RiCheckLine className="text-sm font-extrabold" /> : "+"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ListingsPage;

