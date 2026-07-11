import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiBuildingLine,
  RiGroupLine,
  RiShieldCheckLine,
  RiStarFill,
  RiArrowRightLine,
  RiHeartLine,
  RiHome4Line,
  RiSearchLine,
  RiMapPin2Line,
  RiPhoneLine,
  RiAddLine,
  RiSubtractLine,
  RiCheckboxCircleLine,
  RiCompass3Line,
  RiChat3Line,
} from "react-icons/ri";

document.title = "How It Works — RoomBridge";

/* ─── Design tokens (match Figma) ──────────────────────────── */
const C = {
  darkGreen: "#012D1D",
  btnBrown:  "#8E4E14",
  accent:    "#FFAB69",
  cream:     "#F7F4EF",
  promise:   "#F0EDE9",
  white:     "#FFFFFF",
};

/* ─── Original content (unchanged) ─────────────────────────── */
const TEAM = [
  { name: "Sohail Shabbir ", role: "CEO & Co-founder",  bio: "Full-stack developer with 3+ years in MERN. Architect of RoomBridge." },
  { name: "Sohail Shabbir ",  role: "CTO",               bio: "Backend engineer specialising in Node.js, MongoDB, and scalable APIs." },
  { name: "Radif Fiaz",  role: "Frontend Developer & UI/UX Designer",     bio: "Frontend developer and UI/UX designer focused on accessible, beautiful product experiences." },
  { name: "Sohail Shabbir",   role: "Product Manager",   bio: "Shapes strategy and roadmap. Passionate about Pakistan's housing market." },
];

const VALUES = [
  { icon: RiShieldCheckLine, title: "Trust First",  desc: "Every listing is verified. Every owner is screened. Safety is our top priority." },
  { icon: RiGroupLine,       title: "Community",    desc: "We build lasting connections between roommates, not just transactions." },
  { icon: RiHeartLine,       title: "Inclusivity",  desc: "Rooms for everyone — students, families, working professionals." },
  { icon: RiSearchLine,      title: "Transparency", desc: "No hidden fees. What you see is what you pay." },
];

const MILESTONES = [
  { year: "2022", event: "RoomBridge founded in Islamabad" },
  { year: "2023", event: "Launched in Karachi & Lahore. 1,000 listings milestone" },
  { year: "2024", event: "Expanded to 10 cities. 5,000+ active tenants" },
  { year: "2025", event: "12,000 listings nationwide. Roommate matching goes live" },
];

const STEPS = [
  {
    num: "01",
    icon: RiSearchLine,
    title: "Search Your City",
    desc: "Use our filters to find rooms by city, budget, and amenities. Browse thousands of verified listings instantly.",
    color: "#E8F5E9",
    iconBg: "#C8E6C9",
  },
  {
    num: "02",
    icon: RiCompass3Line,
    title: "Compare Hostels",
    desc: "Get matched with compatible roommates using our smart algorithm based on lifestyle, budget, and preferences.",
    color: "#FFF3E0",
    iconBg: "#FFE0B2",
  },
  {
    num: "03",
    icon: RiChat3Line,
    title: "Contact Directly",
    desc: "Confirm your booking, sign the agreement, and move in with confidence. Direct chat with owners — no middlemen.",
    color: "#E3F2FD",
    iconBg: "#BBDEFB",
  },
];

const FAQS = [
  { q: "Is RoomBridge free to use?",             a: "Yes! Searching and browsing listings is completely free. Owners pay a small fee to list, but seekers always browse for free." },
  { q: "How to book a hostel/room/flat?",        a: "Browse listings, select your preferred room, and send a booking request directly to the owner through our platform." },
  { q: "Can I modify or cancel my stay?",        a: "Modification and cancellation policies are set by individual owners. Always check the listing terms before booking." },
  { q: "How long can I stay for admission?",     a: "Stay duration is flexible — weekly, monthly, or semester-long stays are all available depending on the listing." },
  { q: "What if I have a problem with my hostel?", a: "Our 24/7 support team is ready to help. You can also submit a report through the platform for quick resolution." },
  { q: "Do we accept customizations?",           a: "For special requirements, contact the hostel owner directly or reach out to our support team for assistance." },
];

const STATS = [
  { value: "1,200+",  label: "Verified Hostels" },
  { value: "10,000+", label: "Happy Tenants" },
  { value: "40+",     label: "Cities Covered" },
  { value: "4.8★",    label: "Average Rating" },
];

/* ─── FAQ Accordion ────────────────────────────────────────── */
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 px-1 text-left
                   group transition-colors duration-150"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: open ? C.btnBrown : `${C.darkGreen}10` }}
          >
            <RiCheckboxCircleLine
              className="text-sm"
              style={{ color: open ? C.white : C.darkGreen }}
            />
          </div>
          <span
            className="font-semibold text-[15px] leading-snug"
            style={{ color: C.darkGreen }}
          >
            {q}
          </span>
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0
                     transition-all duration-200"
          style={{
            backgroundColor: open ? C.btnBrown : `${C.darkGreen}08`,
          }}
        >
          {open
            ? <RiSubtractLine className="text-white text-sm" />
            : <RiAddLine className="text-sm" style={{ color: C.darkGreen }} />}
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? "200px" : "0px",
          opacity: open ? 1 : 0,
        }}
      >
        <p className="text-gray-500 text-sm leading-relaxed pl-10 pr-4 pb-5">
          {a}
        </p>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   ABOUT / HOW IT WORKS PAGE
════════════════════════════════════════════════════════════════ */
const AboutPage = () => (
  <div className="min-h-screen" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

    {/* ─────────────────────────────────────────────────────────
        HERO
    ───────────────────────────────────────────────────────── */}
    <section
      className="relative overflow-hidden text-center"
      style={{ backgroundColor: C.darkGreen }}
    >
      {/* decorative blurs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.07]"
           style={{ backgroundColor: C.accent }} aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-[100px] opacity-[0.08]"
           style={{ backgroundColor: C.btnBrown }} aria-hidden="true" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px]
                     font-bold uppercase tracking-wider mb-7 border border-white/15"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: C.accent }}
        >
          <RiBuildingLine className="text-sm" />
          RoomBridge Premium
        </div>

        <h1
          className="text-[2.5rem] sm:text-[3.2rem] lg:text-[3.8rem] font-extrabold text-white
                     leading-[1.1] tracking-tight mb-5"
        >
          How <span style={{ color: C.accent }}>RoomBridge</span> Works
        </h1>

        <p className="text-white/55 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-10">
          Find or list a hostel in minutes — no agents, no commissions, no confusion.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 text-white font-semibold
                       text-sm px-7 py-3.5 rounded-xl border border-white/25
                       hover:bg-white/10 transition-all duration-200"
          >
            Contact Us
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 text-white font-semibold
                       text-sm px-7 py-3.5 rounded-xl hover:opacity-90 active:scale-[0.97]
                       transition-all duration-200 shadow-lg"
            style={{ backgroundColor: C.btnBrown }}
          >
            Register Now
          </Link>
        </div>
      </div>
    </section>

    {/* ─────────────────────────────────────────────────────────
        3-STEP PROCESS
    ───────────────────────────────────────────────────────── */}
    <section className="py-20 sm:py-24 px-5 sm:px-8" style={{ backgroundColor: C.cream }}>
      <div className="max-w-6xl mx-auto">
        {/* section header */}
        <div className="mb-14">
          <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: C.btnBrown }} />
          <h2
            className="text-2xl sm:text-3xl lg:text-[2.1rem] font-bold leading-tight"
            style={{ color: C.darkGreen }}
          >
            Finding your hostel in 3 simple steps
          </h2>
        </div>

        {/* cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ num, icon: Icon, title, desc, color, iconBg }) => (
            <div
              key={num}
              className="bg-white rounded-3xl p-7 shadow-sm hover:shadow-lg
                         transition-all duration-300 flex flex-col"
            >
              {/* step badge */}
              <span
                className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3"
                style={{ color: C.btnBrown }}
              >
                Step {num}
              </span>

              <h3 className="text-lg font-bold mb-2" style={{ color: C.darkGreen }}>
                {title}
              </h3>

              <p className="text-gray-500 text-[13px] leading-relaxed flex-1">
                {desc}
              </p>

              {/* visual indicator */}
              <div
                className="mt-6 h-24 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: iconBg }}
                >
                  <Icon className="text-2xl" style={{ color: C.darkGreen }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2.5 text-white font-semibold text-sm
                       px-8 py-3.5 rounded-xl hover:opacity-90 active:scale-[0.97]
                       transition-all duration-200 shadow-md"
            style={{ backgroundColor: C.btnBrown }}
          >
            Get Started — It's Free <RiArrowRightLine />
          </Link>
        </div>
      </div>
    </section>



    {/* ─────────────────────────────────────────────────────────
        MISSION + VALUES
    ───────────────────────────────────────────────────────── */}
    <section className="py-20 sm:py-24 px-5 sm:px-8" style={{ backgroundColor: C.promise }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* left — text */}
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4"
            style={{ color: C.btnBrown }}
          >
            Our Mission
          </p>
          <h2
            className="text-[1.75rem] sm:text-3xl font-bold leading-tight mb-5"
            style={{ color: C.darkGreen }}
          >
            Building Pakistan's Most{" "}
            <span style={{ color: C.btnBrown }}>Trusted</span>{" "}
            Room Rental Platform
          </h2>
          <p className="text-gray-600 text-[15px] leading-[1.75] mb-4">
            Every year, millions of Pakistanis move to new cities for study and
            work. The process of finding a safe, affordable room through
            classifieds is stressful, time-consuming, and risky.
          </p>
          <p className="text-gray-600 text-[15px] leading-[1.75] mb-8">
            RoomBridge is on a mission to make room hunting as easy as booking a
            flight — with verified listings, smart roommate matching, and secure
            in-app communication.
          </p>
          <div className="flex flex-col gap-4">
            {["Verify every listing", "Enable safe communication", "Make room hunting effortless"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${C.darkGreen}12` }}
                >
                  <RiCheckboxCircleLine className="text-xs" style={{ color: C.darkGreen }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: C.darkGreen }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* right — values grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md
                         transition-shadow duration-200 border border-gray-50"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${C.btnBrown}12` }}
              >
                <Icon className="text-xl" style={{ color: C.btnBrown }} />
              </div>
              <h3 className="font-bold text-[15px] mb-1.5" style={{ color: C.darkGreen }}>
                {title}
              </h3>
              <p className="text-gray-500 text-[13px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ─────────────────────────────────────────────────────────
        FAQ
    ───────────────────────────────────────────────────────── */}
    <section className="py-20 sm:py-24 px-5 sm:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="text-center mb-14">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: C.btnBrown }}
          >
            FAQ
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: C.darkGreen }}>
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-[15px] max-w-md mx-auto">
            Can't find what you're looking for? Reach out to our friendly support team.
          </p>
        </div>

        {/* 2-col FAQ grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
          {/* left column */}
          <div className="bg-gray-50/60 rounded-2xl px-5">
            {FAQS.filter((_, i) => i % 2 === 0).map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
          {/* right column */}
          <div className="bg-gray-50/60 rounded-2xl px-5 mt-4 md:mt-0">
            {FAQS.filter((_, i) => i % 2 !== 0).map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ─────────────────────────────────────────────────────────
        JOURNEY TIMELINE
    ───────────────────────────────────────────────────────── */}
    <section className="py-20 sm:py-24 px-5 sm:px-8" style={{ backgroundColor: C.cream }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: C.btnBrown }}
          >
            Timeline
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: C.darkGreen }}>
            Our Journey
          </h2>
        </div>

        <div className="relative">
          {/* vertical line */}
          <div
            className="absolute left-[15px] top-2 bottom-2 w-px"
            style={{ backgroundColor: `${C.darkGreen}15` }}
          />
          <div className="space-y-6">
            {MILESTONES.map(({ year, event }) => (
              <div key={year} className="flex items-start gap-5 relative pl-12">
                {/* dot */}
                <div
                  className="absolute left-0 top-4 w-[30px] h-[30px] rounded-full flex items-center
                             justify-center z-10 shadow-md"
                  style={{ backgroundColor: C.darkGreen }}
                >
                  <RiStarFill className="text-[10px]" style={{ color: C.accent }} />
                </div>
                {/* card */}
                <div className="bg-white rounded-2xl px-6 py-5 shadow-sm flex-1 border border-gray-100">
                  <span className="text-xs font-bold" style={{ color: C.btnBrown }}>
                    {year}
                  </span>
                  <p className="text-sm font-medium mt-1" style={{ color: C.darkGreen }}>
                    {event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ─────────────────────────────────────────────────────────
        TEAM
    ───────────────────────────────────────────────────────── */}
    <section className="py-20 sm:py-24 px-5 sm:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: C.btnBrown }}
          >
            The People
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: C.darkGreen }}>
            Meet the Team
          </h2>
          <p className="text-gray-400 text-[15px]">
            The people building Pakistan's housing future
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map(({ name, role, bio }) => (
            <div
              key={role}
              className="text-center p-7 rounded-3xl border border-gray-100
                         hover:shadow-lg transition-all duration-300 group"
              style={{ backgroundColor: C.cream }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5
                           shadow-md group-hover:shadow-lg transition-shadow duration-300"
                style={{ backgroundColor: C.darkGreen }}
              >
                <span className="text-white text-xl font-bold">{name[0]}</span>
              </div>
              <h3 className="font-bold text-[15px] mb-1" style={{ color: C.darkGreen }}>
                {name}
              </h3>
              <span
                className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full mb-3"
                style={{ backgroundColor: `${C.btnBrown}15`, color: C.btnBrown }}
              >
                {role}
              </span>
              <p className="text-gray-500 text-[13px] leading-relaxed">{bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ─────────────────────────────────────────────────────────
        CTA
    ───────────────────────────────────────────────────────── */}
    <section
      className="relative overflow-hidden py-20 sm:py-24 px-5 sm:px-8 text-center"
      style={{ backgroundColor: C.darkGreen }}
    >
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-[0.06]"
           style={{ backgroundColor: C.accent }} aria-hidden="true" />

      <div className="relative max-w-2xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px]
                     font-bold uppercase tracking-wider mb-6 border border-white/15"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: C.accent }}
        >
          <RiGroupLine className="text-sm" />
          Join the Community
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
          Join the{" "}
          <span style={{ color: C.accent }}>RoomBridge</span>{" "}
          Community
        </h2>
        <p className="text-white/50 text-base mb-10 leading-relaxed max-w-lg mx-auto">
          Whether you're looking for a room or listing one, we're here to help.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/explore"
            className="inline-flex items-center justify-center gap-2 text-white font-semibold
                       text-sm px-8 py-3.5 rounded-xl hover:opacity-90 active:scale-[0.97]
                       transition-all duration-200 shadow-lg"
            style={{ backgroundColor: C.btnBrown }}
          >
            <RiSearchLine /> Browse Rooms
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 text-white font-semibold
                       text-sm border border-white/25 px-8 py-3.5 rounded-xl
                       hover:bg-white/10 transition-all duration-200"
          >
            Contact Us <RiArrowRightLine />
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default AboutPage;
