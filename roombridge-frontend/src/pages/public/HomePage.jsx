import React, { useState, useEffect, useCallback, useRef } from "react";
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
  RiVerifiedBadgeLine,
  RiTimeLine,
  RiPhoneLine,
  RiCoinsLine,
  RiArrowDownSLine,
} from "react-icons/ri";
import { CITIES } from "../../utils/constants";
import listingService from "../../services/listingService";
import karachi from "../../assets/images/cities/qaid.jpg";
import lahore from "../../assets/images/cities/lahore.jpg";
import islamabad from "../../assets/images/cities/islamabad.jpg";
import rawalpindi from "../../assets/images/cities/rawalpindi.jpg";
import peshawar from "../../assets/images/cities/peshawar.jpg";
import multan from "../../assets/images/cities/multan.jpg";
import pakistanMap from "../../assets/images/pakistan_map.png";

document.title = "RoomBridge — Pakistan's #1 Room Rental Platform";

/* ─── Design tokens (Figma) ──────────────────────────────────── */
const C = {
  darkGreen:   "#012D1D",
  btnPrimary:  "#8E4E14",
  btnDark:     "#783D01",
  promise:     "#F0EDE9",
  hostelBg:    "#FFAB69",
  footerHead:  "#FBBF24",
  white:       "#FFFFFF",
};

/* ── Static data ──────────────────────────────────────────────── */
const STATS = [
  { value: "12,000+", label: "Rooms Listed" },
  { value: "8,500+",  label: "Happy Tenants" },
  { value: "25+",     label: "Cities Covered" },
  { value: "4.8★",   label: "Average Rating" },
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
  { name: "Lahore",      rooms: "2,890", img: lahore },
  { name: "Karachi",     rooms: "3,240", img: karachi },
  { name: "Islamabad",   rooms: "1,540", img: islamabad },
  { name: "Rawalpindi",  rooms: "980",   img: rawalpindi },
  { name: "Peshawar",    rooms: "620",   img: peshawar },
  { name: "Multan",      rooms: "450",   img: multan },
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
    name: "Amna Raza",
    city: "Lahore",
    role: "Owner",
    rating: 5,
    text: "Listed my room and got 5 serious inquiries the same day. Amazing platform!",
  },
  {
    name: "Bilal Khan",
    city: "Islamabad",
    role: "Seeker",
    rating: 5,
    text: "The compatibility score really works. My roommate and I get along perfectly!",
  },
];

const BUDGET_OPTIONS = [
  { value: "",           label: "Any Budget", min: "", max: "" },
  { value: "0-10000",    label: "Under 10,000",  min: "0",     max: "10000" },
  { value: "10000-20000",label: "10k – 20k",     min: "10000", max: "20000" },
  { value: "20000-35000",label: "20k – 35k",     min: "20000", max: "35000" },
  { value: "35000-50000",label: "35k – 50k",     min: "35000", max: "50000" },
  { value: "50000+",     label: "Above 50k",     min: "50000", max: "" },
];

const PROMISE_ITEMS = [
  {
    icon: RiVerifiedBadgeLine,
    title: "Verified Listings",
    desc: "Every room is manually reviewed before it goes live on our platform.",
  },
  {
    icon: RiShieldCheckLine,
    title: "Safe & Secure",
    desc: "Your personal data and transactions are protected end-to-end.",
  },
  {
    icon: RiTimeLine,
    title: "24/7 Support",
    desc: "Our support team is always ready to help whenever you need us.",
  },
  {
    icon: RiPhoneLine,
    title: "Easy Communication",
    desc: "Message owners directly inside the app — no middlemen, no hassle.",
  },
];

/* ── Featured Listing Card ───────────────────────────────────── */
const FeaturedListingCard = ({ listing }) => {
  const photo =
    listing.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80";
  const typeMap = {
    single:    "Single Room",
    shared:    "Shared Room",
    apartment: "Apartment",
  };

  return (
    <Link
      to={`/explore/${listing._id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm
                 hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100"
    >
      <div className="relative overflow-hidden h-48">
        <img
          src={photo}
          alt={listing.title}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80";
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div
          className="absolute top-3 left-3 text-white text-xs font-semibold
                     px-3 py-1 rounded-full"
          style={{ backgroundColor: C.darkGreen }}
        >
          {typeMap[listing.roomType] || listing.roomType || "Room"}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1"
            style={{ color: C.darkGreen }}>
          {listing.title}
        </h3>
        <p className="text-gray-500 text-xs flex items-center gap-1 mb-3">
          <RiMapPin2Line className="shrink-0" style={{ color: C.btnPrimary }} />
          {listing.address ? `${listing.address}, ` : ""}{listing.city}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-base font-bold" style={{ color: C.darkGreen }}>
              PKR {(listing.rent || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">/month</span>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full border
                       group-hover:text-white transition-all duration-200"
            style={{
              borderColor: C.btnPrimary,
              color: C.btnPrimary,
            }}
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
};

/* ════════════════════════════════════════════════════════════
   HOME PAGE
════════════════════════════════════════════════════════════ */
const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ city: "", genderPreference: "", budget: "" });
  const [featuredListings, setFeaturedListings] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null); // 'city' | 'gender' | 'budget' | null
  const cityRef = useRef(null);
  const genderRef = useRef(null);
  const budgetRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (cityRef.current && cityRef.current.contains(event.target)) ||
        (genderRef.current && genderRef.current.contains(event.target)) ||
        (budgetRef.current && budgetRef.current.contains(event.target))
      ) {
        return;
      }
      setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const loadFeatured = useCallback(async () => {
    try {
      setFeaturedLoading(true);
      const res = await listingService.getListings({ limit: 4, sortBy: "newest" });
      setFeaturedListings(
        Array.isArray(res.data) ? res.data : (res.listings ?? [])
      );
    } catch {
      setFeaturedListings([]);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.city) params.set("city", search.city);
    if (search.genderPreference) params.set("genderPreference", search.genderPreference);
    if (search.budget) {
      const opt = BUDGET_OPTIONS.find((o) => o.value === search.budget);
      if (opt?.min) params.set("minRent", opt.min);
      if (opt?.max) params.set("maxRent", opt.max);
    }
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.white }}>

      {/* ════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-no-repeat bg-center bg-cover"
        style={{
          backgroundColor: C.darkGreen,
          backgroundImage: `url(${pakistanMap})`,
        }}
      >
        {/* Subtle decorative blobs */}
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: C.btnPrimary }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: C.hostelBg }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center">

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[68px] font-black text-white font-serif leading-[1.1] mb-6">
              Ghar se door,<br />magar mehfooz.
            </h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
              Find verified hostels near your university, anywhere in Pakistan. The curated sanctuary for your academic journey.
            </p>

            {/* Search Box */}
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-[28px] shadow-2xl p-3.5 flex flex-col lg:flex-row gap-3.5 max-w-4xl mx-auto items-stretch lg:items-center"
            >
              {/* City Custom Dropdown */}
              <div className="flex-1 relative" ref={cityRef}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "city" ? null : "city")}
                  className="w-full flex items-center gap-2.5 px-4.5 py-3 bg-[#F5F2EB] rounded-[18px] min-h-[52px] text-left transition-all hover:bg-[#ebdcc8]/20"
                >
                  <RiMapPin2Line className="text-[#012D1D] text-lg shrink-0" />
                  <span className="text-xs font-bold text-[#012D1D] flex-1 truncate">
                    {search.city || "City or University Area"}
                  </span>
                  <RiArrowDownSLine className={`text-gray-500 text-base transition-transform duration-200 ${openDropdown === "city" ? "rotate-180" : ""}`} />
                </button>

                {openDropdown === "city" && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-[20px] shadow-2xl border border-gray-100/80 overflow-hidden z-50 p-2 space-y-0.5 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSearch((s) => ({ ...s, city: "" }));
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
                        !search.city
                          ? "bg-[#012D1D] text-white"
                          : "text-gray-700 hover:bg-[#F5F2EB] hover:text-[#012D1D]"
                      }`}
                    >
                      City or University Area
                    </button>
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSearch((s) => ({ ...s, city: c }));
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
                          search.city === c
                            ? "bg-[#012D1D] text-white"
                            : "text-gray-700 hover:bg-[#F5F2EB] hover:text-[#012D1D]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Gender Custom Dropdown */}
              <div className="flex-1 relative" ref={genderRef}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "gender" ? null : "gender")}
                  className="w-full flex items-center gap-2.5 px-4.5 py-3 bg-[#F5F2EB] rounded-[18px] min-h-[52px] text-left transition-all hover:bg-[#ebdcc8]/20"
                >
                  <RiGroupLine className="text-[#012D1D] text-lg shrink-0" />
                  <span className="text-xs font-bold text-[#012D1D] flex-1 truncate">
                    {search.genderPreference === "male"
                      ? "Boys"
                      : search.genderPreference === "female"
                      ? "Girls"
                      : search.genderPreference === "any"
                      ? "Mixed"
                      : "Gender"}
                  </span>
                  <RiArrowDownSLine className={`text-gray-500 text-base transition-transform duration-200 ${openDropdown === "gender" ? "rotate-180" : ""}`} />
                </button>

                {openDropdown === "gender" && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-[20px] shadow-2xl border border-gray-100 overflow-hidden z-50 p-2 space-y-0.5">
                    {[
                      { label: "Gender", value: "" },
                      { label: "Boys", value: "male" },
                      { label: "Girls", value: "female" },
                      { label: "Mixed", value: "any" }
                    ].map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => {
                          setSearch((s) => ({ ...s, genderPreference: g.value }));
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
                          search.genderPreference === g.value
                            ? "bg-[#012D1D] text-white"
                            : "text-gray-700 hover:bg-[#F5F2EB] hover:text-[#012D1D]"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget Custom Dropdown */}
              <div className="flex-1 relative" ref={budgetRef}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "budget" ? null : "budget")}
                  className="w-full flex items-center gap-2.5 px-4.5 py-3 bg-[#F5F2EB] rounded-[18px] min-h-[52px] text-left transition-all hover:bg-[#ebdcc8]/20"
                >
                  <RiCoinsLine className="text-[#012D1D] text-lg shrink-0" />
                  <span className="text-xs font-bold text-[#012D1D] flex-1 truncate">
                    {BUDGET_OPTIONS.find((o) => o.value === search.budget)?.label || "Budget"}
                  </span>
                  <RiArrowDownSLine className={`text-gray-500 text-base transition-transform duration-200 ${openDropdown === "budget" ? "rotate-180" : ""}`} />
                </button>

                {openDropdown === "budget" && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-[20px] shadow-2xl border border-gray-100 overflow-hidden z-50 p-2 space-y-0.5 max-h-60 overflow-y-auto">
                    {[
                      { label: "Budget", value: "" },
                      ...BUDGET_OPTIONS.slice(1)
                    ].map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => {
                          setSearch((s) => ({ ...s, budget: b.value }));
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
                          search.budget === b.value
                            ? "bg-[#012D1D] text-white"
                            : "text-gray-700 hover:bg-[#F5F2EB] hover:text-[#012D1D]"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="text-white font-bold text-sm px-8 py-3.5 min-h-[52px] rounded-[18px]
                           hover:opacity-95 active:scale-95 transition-all duration-200 shrink-0
                           flex items-center justify-center gap-2 shadow-md cursor-pointer"
                style={{ backgroundColor: C.btnPrimary }}
              >
                <RiSearchLine /> Search Hostels
              </button>
            </form>

            {/* Quick city tags */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar"].map((c) => (
                <button
                  key={c}
                  onClick={() => navigate(`/explore?city=${c}`)}
                  className="text-xs font-medium text-white/65 border border-white/20
                             px-3.5 py-1.5 rounded-full hover:text-white
                             hover:border-white/50 transition-all duration-200 cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {STATS.map(({ value, label }) => (
              <div key={label} className="py-8 px-6 text-center group">
                <p
                  className="text-3xl font-bold transition-colors duration-200"
                  style={{ color: C.darkGreen }}
                >
                  {value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
         {/* ════════════════════════════════════════════════════════
          HANDPICKED RECOMMENDATIONS (Featured Listings)
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: C.btnPrimary }}
              >
                Featured
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold"
                style={{ color: C.darkGreen }}
              >
                Handpicked Recommendations
              </h2>
              <p className="text-gray-500 mt-2">
                Freshly posted, verified rooms across Pakistan
              </p>
            </div>
            <Link
              to="/explore"
              className="hidden sm:inline-flex items-center gap-1.5 font-semibold
                         hover:opacity-75 transition-opacity text-sm shrink-0"
              style={{ color: C.btnPrimary }}
            >
              View all <RiArrowRightLine />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="flex items-center justify-center py-20">
              <RiLoader4Line
                className="animate-spin text-4xl"
                style={{ color: C.btnPrimary }}
                aria-label="Loading listings"
              />
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredListings.map((l) => (
                <FeaturedListingCard key={l._id} listing={l} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <RiHome4Line className="text-5xl text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">
                No listings yet. Be the first to post!
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-white font-semibold
                           px-6 py-2.5 rounded-lg mt-4 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: C.btnPrimary }}
              >
                Post a Room
              </Link>
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 font-semibold
                         hover:opacity-75 transition-opacity"
              style={{ color: C.btnPrimary }}
            >
              View all rooms <RiArrowRightLine />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS — "Simple. Secure. Station First."
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: C.btnPrimary }}
            >
              The Process
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ color: C.darkGreen }}
            >
              Simple. Secure. Station First.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Find your room in 4 straightforward steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className="relative text-center group">
                {/* Connector */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-8 left-1/2 w-full h-px opacity-20"
                    style={{
                      background: `linear-gradient(to right, ${C.btnPrimary}, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                )}
                <div className="relative inline-flex flex-col items-center">
                  {/* Icon circle */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                               transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${C.btnPrimary}18`, border: `2px solid ${C.btnPrimary}30` }}
                  >
                    <Icon
                      className="text-2xl transition-colors"
                      style={{ color: C.btnPrimary }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold tracking-widest mb-2"
                    style={{ color: C.btnPrimary }}
                  >
                    {step}
                  </span>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ color: C.darkGreen }}
                  >
                    {title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

 

   

      {/* ════════════════════════════════════════════════════════
          DESIGNED FOR PEACE OF MIND  (beige bg)
      ════════════════════════════════════════════════════════ */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: C.promise }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: image collage / illustration */}
            <div className="relative">
              <div
                className="rounded-3xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: C.darkGreen }}
              >
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80"
                  alt="Happy roommates"
                  className="w-full h-80 lg:h-96 object-cover opacity-80 mix-blend-luminosity"
                  loading="lazy"
                />
                {/* Floating stat card */}
                <div
                  className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-5 shadow-xl"
                  style={{ minWidth: "160px" }}
                >
                  <p
                    className="text-3xl font-bold"
                    style={{ color: C.darkGreen }}
                  >
                    8,500+
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Happy Tenants</p>
                  <div className="flex gap-0.5 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <RiStarFill key={i} className="text-yellow-400 text-sm" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: content */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: C.btnPrimary }}
              >
                Our Promise
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4 leading-tight"
                style={{ color: C.darkGreen }}
              >
                Designed for{" "}
                <span style={{ color: C.btnPrimary }}>Peace of Mind</span>
              </h2>
              <p className="text-gray-600 text-base mb-8 leading-relaxed">
                We know how stressful it is to find a room away from home.
                RoomBridge is built from the ground up to make your search
                safe, simple, and stress-free.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {PROMISE_ITEMS.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="bg-white rounded-2xl p-5 shadow-sm
                               hover:shadow-md transition-shadow duration-200"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${C.btnPrimary}18` }}
                    >
                      <Icon style={{ color: C.btnPrimary }} className="text-lg" />
                    </div>
                    <h3
                      className="font-bold text-sm mb-1"
                      style={{ color: C.darkGreen }}
                    >
                      {title}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center gap-2 text-white
                             font-semibold px-6 py-3 rounded-xl
                             hover:opacity-90 active:scale-95 transition-all duration-200"
                  style={{ backgroundColor: C.btnPrimary }}
                >
                  <RiSearchLine /> Browse Rooms
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 font-semibold
                             px-6 py-3 rounded-xl border-2 hover:bg-white
                             transition-all duration-200"
                  style={{ borderColor: C.btnPrimary, color: C.btnPrimary }}
                >
                  Learn More <RiArrowRightLine />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: C.btnPrimary }}
            >
              Reviews
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ color: C.darkGreen }}
            >
              Loved by Thousands
            </h2>
            <p className="text-gray-500 text-lg">
              What our members say about RoomBridge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, city, role, rating, text }, index) => (
              <div
                key={`${name}-${city}-${index}`}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100
                           hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex mb-4" aria-label={`${rating} out of 5 stars`}>
                  {[...Array(rating)].map((_, i) => (
                    <RiStarFill key={i} className="text-yellow-400 text-sm" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                  "{text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: C.darkGreen }}
                  >
                    <span className="text-white text-sm font-bold">{name[0]}</span>
                  </div>
                  <div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: C.darkGreen }}
                    >
                      {name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {role} · {city}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
};

export default HomePage;
