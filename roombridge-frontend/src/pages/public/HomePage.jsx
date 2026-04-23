import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RiSearchLine,
  RiMapPin2Line,
  RiBuilding4Line,
  RiGroupLine,
  RiShieldCheckLine,
  RiStarFill,
  RiArrowRightLine,
  RiHome4Line,
  RiCheckLine,
  RiArrowRightSLine,
  RiLoader4Line,
} from "react-icons/ri";
import { CITIES } from "../../utils/constants";
import listingService from "../../services/listingService";
import karachi from "../../assets/images/cities/qaid.jpg";
import lahore from "../../assets/images/cities/lahore.jpg";
import islamabad from "../../assets/images/cities/islamabad.jpg";
import rawalpindi from "../../assets/images/cities/rawalpindi.jpg";
import peshawar from "../../assets/images/cities/peshawar.jpg";
import multan from "../../assets/images/cities/multan.jpg";

document.title = "RoomBridge — Pakistan's #1 Room Rental Platform";

/* ── Static data ──────────────────────────────────────────────── */
const STATS = [
  { value: "12,000+", label: "Rooms Listed" },
  { value: "8,500+", label: "Happy Tenants" },
  { value: "25+", label: "Cities Covered" },
  { value: "4.8★", label: "Average Rating" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: RiSearchLine,
    title: "Search Rooms",
    desc: "Browse thousands of verified rooms filtered by city, budget, and amenities.",
  },
  {
    step: "02",
    icon: RiGroupLine,
    title: "Match Roommates",
    desc: "Our smart algorithm matches you with compatible roommates based on lifestyle preferences.",
  },
  {
    step: "03",
    icon: RiHome4Line,
    title: "Connect & Book",
    desc: "Chat with owners, schedule visits, and confirm your booking — all in one place.",
  },
  {
    step: "04",
    icon: RiCheckLine,
    title: "Move In!",
    desc: "Move into your verified room with confidence. RoomBridge has you covered.",
  },
];

const FEATURED_CITIES = [
  {
    name: "Karachi",
    rooms: "3,240",
    img: karachi,
  },
  {
    name: "Lahore",
    rooms: "2,890",
    img: lahore,
  },
  {
    name: "Islamabad",
    rooms: "1,540",
    img: islamabad,
  },
  {
    name: "Rawalpindi",
    rooms: "980",
    img: rawalpindi,
  },
  {
    name: "Peshawar",
    rooms: "620",
    img: peshawar,
  },
  {
    name: "Multan",
    rooms: "450",
    img: multan,
  },
];

const TESTIMONIALS = [
  {
    name: "Rashid Ali",
    city: "Karachi",
    role: "Seeker",
    rating: 5,
    text: "Found my perfect room in 2 days! The roommate matching feature is genius.",
  },
  {
    name: "Rashid Ali",
    city: "Lahore",
    role: "Owner",
    rating: 5,
    text: "Listed my room and got 5 serious inquiries the same day. Amazing platform!",
  },
  {
    name: "Rahid Ali",
    city: "Islamabad",
    role: "Seeker",
    rating: 5,
    text: "The compatibility score really works. My roommate and I get along perfectly!",
  },
];

/*
  Budget range → minRent / maxRent query params.
  HomePage was sending ?budget=0-10000 which the backend doesn't
  understand. Backend expects minRent and maxRent as separate params.
*/
const BUDGET_OPTIONS = [
  { value: "", label: "Any Budget", min: "", max: "" },
  { value: "0-10000", label: "Under 10,000", min: "0", max: "10000" },
  { value: "10000-20000", label: "10k – 20k", min: "10000", max: "20000" },
  { value: "20000-35000", label: "20k – 35k", min: "20000", max: "35000" },
  { value: "35000-50000", label: "35k – 50k", min: "35000", max: "50000" },
  { value: "50000+", label: "Above 50k", min: "50000", max: "" },
];

/* ── ListingCard for featured section ────────────────────────── */
const FeaturedListingCard = ({ listing }) => {
  const photo =
    listing.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80";
  const typeMap = {
    single: "Single Room",
    shared: "Shared Room",
    apartment: "Apartment",
  };

  return (
    <Link
      to={`/listings/${listing._id}`}
      className="group bg-white rounded-card border border-border shadow-card
                     hover:shadow-hover transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative overflow-hidden">
        <img
          src={photo}
          alt={listing.title}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80";
          }}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div
          className="absolute top-3 left-3 bg-primary/90 text-white text-xs font-medium
                         px-2.5 py-1 rounded-full backdrop-blur-sm"
        >
          {typeMap[listing.roomType] || listing.roomType || "Room"}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3
          className="font-semibold text-primary text-sm leading-snug line-clamp-2
                       group-hover:text-secondary transition-colors mb-1"
        >
          {listing.title}
        </h3>
        <p className="text-text-secondary text-xs flex items-center gap-1 mb-3">
          <RiMapPin2Line className="text-accent shrink-0" />
          {listing.address ? `${listing.address}, ` : ""}
          {listing.city}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              PKR {(listing.rent || 0).toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary">/month</span>
          </div>
          <span
            className="text-xs font-semibold text-secondary border border-secondary/30
                           px-2.5 py-1 rounded-full group-hover:bg-secondary group-hover:text-white
                           transition-all duration-200"
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ city: "", roomType: "", budget: "" });

  /* ── Featured listings from real API ────────────────────────── */
  const [featuredListings, setFeaturedListings] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const loadFeatured = useCallback(async () => {
    try {
      setFeaturedLoading(true);
      const res = await listingService.getListings({
        limit: 6,
        sortBy: "newest",
      });
      /*
        backend returns { success, listings, pagination }
        not { data }. Read res.listings directly.
      */
      setFeaturedListings(
        Array.isArray(res.data) ? res.data : (res.listings ?? []),
      );
    } catch {
      setFeaturedListings([]); // silently fail — page still works without featured
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  /* ── Hero search ─────────────────────────────────────────────── */
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.city) params.set("city", search.city);
    /*
      was sending ?type= but backend filter param is roomType.
      Now correctly sends roomType.
    */
    if (search.roomType) params.set("roomType", search.roomType);
    /*
      was sending ?budget=0-10000 (string range) — backend
      doesn't understand that. Now we split the range into minRent/maxRent.
    */
    if (search.budget) {
      const opt = BUDGET_OPTIONS.find((o) => o.value === search.budget);
      if (opt?.min) params.set("minRent", opt.min);
      if (opt?.max) params.set("maxRent", opt.max);
    }
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* ════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="relative bg-primary overflow-hidden">
        {/* Background decorative circles */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 bg-white/10 text-accent px-4 py-1.5
                            rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 border border-white/20"
            >
              <RiStarFill className="text-xs" /> Pakistan's #1 Room Rental
              Platform
            </div>

            <h1 className="text-[2.15rem] sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-5">
              Find Your <span className="text-accent">Perfect Room</span>
              <br className="hidden sm:block" />
              <span className="text-white/85">and the Right Roommate</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg md:text-xl mb-7 sm:mb-10 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
              Browse thousands of verified rooms across Pakistan. Smart roommate
              matching based on your lifestyle, budget, and preferences.
            </p>

            {/* Search box */}
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-2xl shadow-hover p-2.5 sm:p-3
                             flex flex-col sm:flex-row gap-2.5 sm:gap-2 max-w-2xl mx-auto"
            >
              {/* City */}
              <div className="flex-1 relative">
                <RiMapPin2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <select
                  value={search.city}
                  aria-label="Select city"
                  onChange={(e) =>
                    setSearch((s) => ({ ...s, city: e.target.value }))
                  }
                  className="w-full min-h-11 pl-9 pr-3 py-3 sm:py-3 text-sm text-primary bg-transparent
                             outline-none sm:border-r border-border appearance-none cursor-pointer"
                >
                  <option value="">All Cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type — was binding to search.type, now search.roomType */}
              <div className="flex-1 relative">
                <RiBuilding4Line className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <select
                  value={search.roomType}
                  aria-label="Select room type"
                  onChange={(e) =>
                    setSearch((s) => ({ ...s, roomType: e.target.value }))
                  }
                  className="w-full min-h-11 pl-9 pr-3 py-3 sm:py-3 text-sm text-primary bg-transparent
                             outline-none sm:border-r border-border appearance-none cursor-pointer"
                >
                  <option value="">Any Type</option>
                  {/* values now match backend Listing.model.js enum */}
                  <option value="single">Single Room</option>
                  <option value="shared">Shared Room</option>
                  <option value="apartment">Full Apartment</option>
                </select>
              </div>

              {/* Budget — binds to search.budget (the range string).
                  handleSearch splits it into minRent/maxRent before navigation. */}
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs font-bold">
                  ₨
                </span>
                <select
                  value={search.budget}
                  aria-label="Select budget range"
                  onChange={(e) =>
                    setSearch((s) => ({ ...s, budget: e.target.value }))
                  }
                  className="w-full min-h-11 pl-9 pr-3 py-3 sm:py-3 text-sm text-primary bg-transparent
                             outline-none appearance-none cursor-pointer"
                >
                  {BUDGET_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-primary text-white
                                 font-semibold text-sm px-6 py-3 min-h-11 sm:py-3 rounded-xl
                                 hover:bg-secondary transition-all duration-200 shrink-0"
              >
                <RiSearchLine /> Search
              </button>
            </form>

            {/* Quick city tags */}
            <div className="mt-4 sm:mt-5 overflow-x-auto pb-1">
              <div className="flex min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center gap-2 px-1 sm:px-0">
                {[
                  "Karachi",
                  "Lahore",
                  "Islamabad",
                  "Rawalpindi",
                  "Peshawar",
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() => navigate(`/listings?city=${c}`)}
                    className="text-sm sm:text-xs font-medium text-white/75 border border-white/25
                                   px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-full hover:bg-white/10 hover:text-white
                                   transition-all duration-200"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {STATS.map(({ value, label }) => (
              <div key={label} className="py-8 px-6 text-center">
                <p className="text-3xl font-bold text-primary">{value}</p>
                <p className="text-sm text-text-secondary mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURED LISTINGS (from real API)
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                Latest Listings
              </h2>
              <p className="text-text-secondary">
                Freshly posted rooms across Pakistan
              </p>
            </div>
            <Link
              to="/listings"
              className="hidden sm:inline-flex items-center gap-1.5 text-secondary font-semibold
                             hover:text-primary transition-colors text-sm shrink-0"
            >
              View all <RiArrowRightLine />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="flex items-center justify-center py-20">
              <RiLoader4Line
                className="animate-spin text-4xl text-primary"
                aria-label="Loading listings"
              />
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((l) => (
                <FeaturedListingCard key={l._id} listing={l} />
              ))}
            </div>
          ) : (
            /* Empty state — show static placeholder cards instead of blank */
            <div className="text-center py-16">
              <RiHome4Line className="text-5xl text-border mx-auto mb-4" />
              <p className="text-text-secondary">
                No listings yet. Be the first to post!
              </p>
              <Link
                to="/register"
                className="btn-primary mt-4 inline-flex gap-2"
              >
                Post a Room
              </Link>
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 text-secondary font-semibold
                             hover:text-primary transition-colors duration-200"
            >
              View all rooms <RiArrowRightLine />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          BROWSE BY CITY
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Browse by City
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Rooms available across all major cities of Pakistan
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {FEATURED_CITIES.map(({ name, rooms, img }) => (
              <Link
                key={name}
                to={`/listings?city=${name}`}
                className="relative group overflow-hidden rounded-card shadow-card
                               hover:shadow-hover transition-all duration-300"
              >
                <img
                  src={img}
                  alt={name}
                  className="w-full h-44 object-cover group-hover:scale-105
                                transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/90 via-primary/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-lg leading-tight">
                    {name}
                  </p>
                  <p className="text-accent text-sm">{rooms} rooms</p>
                </div>
                <div
                  className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm
                                text-white text-xs px-2.5 py-1 rounded-full border border-white/20
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                flex items-center gap-1"
                >
                  View <RiArrowRightSLine />
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 text-secondary font-semibold
                             hover:text-primary transition-colors duration-200"
            >
              View all cities <RiArrowRightLine />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              How RoomBridge Works
            </h2>
            <p className="text-text-secondary text-lg">
              Find your room in 4 simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className="relative text-center group">
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-8 left-1/2 w-full h-px
                                  bg-linear-to-r from-accent to-transparent"
                    aria-hidden="true"
                  />
                )}
                <div className="relative inline-flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4
                                  group-hover:bg-primary group-hover:text-white transition-all duration-300
                                  border-2 border-transparent group-hover:border-primary"
                  >
                    <Icon className="text-2xl text-primary group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-bold text-accent tracking-widest mb-2">
                    {step}
                  </span>
                  <h3 className="font-bold text-primary text-lg mb-2">
                    {title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          ROOMMATE MATCHING PROMO
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary rounded-2xl overflow-hidden relative">
            <div
              className="absolute -top-10 -right-10 w-64 h-64 bg-accent/10 rounded-full blur-2xl"
              aria-hidden="true"
            />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-10 lg:p-14">
                <div
                  className="inline-flex items-center gap-2 bg-accent/20 text-accent
                                px-3 py-1.5 rounded-full text-xs font-semibold mb-5 border border-accent/30"
                >
                  <RiGroupLine /> Smart Roommate Matching
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  Find Roommates Who{" "}
                  <span className="text-accent">Actually Match</span> Your
                  Lifestyle
                </h2>
                <p className="text-white/70 text-base mb-8 leading-relaxed">
                  Answer a few questions about your sleep schedule, cleanliness
                  habits, and social preferences. Our AI engine will find your
                  top matches — with a compatibility score.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 bg-accent text-primary
                                   font-semibold px-6 py-3 rounded-btn hover:bg-white transition-all duration-200"
                  >
                    <RiGroupLine /> Find My Match
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center justify-center gap-2 border border-white/30
                                   text-white font-semibold px-6 py-3 rounded-btn
                                   hover:bg-white/10 transition-all duration-200"
                  >
                    Learn More <RiArrowRightLine />
                  </Link>
                </div>
              </div>

              {/* Right: compatibility score visual */}
              <div className="relative hidden lg:flex items-center justify-center p-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-72 border border-white/20">
                  <p className="text-white/70 text-sm mb-3">
                    Compatibility Score
                  </p>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-5xl font-bold text-white">87</span>
                    <span className="text-accent text-xl font-semibold mb-1">
                      / 100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full mb-5">
                    <div
                      className="h-2 bg-accent rounded-full"
                      style={{ width: "87%" }}
                    />
                  </div>
                  {[
                    { label: "Sleep Schedule", pct: 90 },
                    { label: "Cleanliness", pct: 85 },
                    { label: "Social Habits", pct: 80 },
                    { label: "Budget Range", pct: 95 },
                  ].map(({ label, pct }) => (
                    <div key={label} className="flex items-center gap-3 mb-2.5">
                      <p className="text-white/65 text-xs w-28 shrink-0">
                        {label}
                      </p>
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full">
                        <div
                          className="h-1.5 bg-accent/70 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-white/65 text-xs w-7 text-right">
                        {pct}%
                      </span>
                    </div>
                  ))}
                  <div className="mt-4 flex items-center gap-2 bg-success/20 rounded-lg px-3 py-2">
                    <RiCheckLine className="text-success shrink-0" />
                    <p className="text-success text-xs font-semibold">
                      Excellent Match!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Loved by Thousands
            </h2>
            <p className="text-text-secondary text-lg">
              What our members say about RoomBridge
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, city, role, rating, text }, index) => (
              <div
                key={`${name}-${city}-${role}-${index}`}
                className="bg-white rounded-card p-6 border border-border
                              hover:shadow-hover transition-shadow duration-300"
              >
                <div
                  className="flex mb-3"
                  aria-label={`${rating} out of 5 stars`}
                >
                  {[...Array(rating)].map((_, i) => (
                    <RiStarFill
                      key={i}
                      className="text-warning text-sm"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-5 italic">
                  "{text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">
                      {name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{name}</p>
                    <p className="text-text-secondary text-xs">
                      {role} · {city}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your{" "}
            <span className="text-accent">Perfect Room?</span>
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Join over 8,500 happy tenants who found their home through
            RoomBridge.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/listings"
              className="inline-flex items-center justify-center gap-2 bg-accent text-primary
                             font-semibold px-8 py-3.5 rounded-btn hover:bg-white
                             transition-all duration-200 shadow-card hover:shadow-hover"
            >
              <RiSearchLine /> Browse Rooms
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 border border-white/30
                             text-white font-semibold px-8 py-3.5 rounded-btn
                             hover:bg-white/10 transition-all duration-200"
            >
              <RiHome4Line /> List Your Room
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
