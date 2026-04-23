import React from "react";
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
} from "react-icons/ri";

/*
  All 4 team entries had name 'Rahid Ali ' — identical names
  were used as React keys, causing duplicate key warnings and
  potential rendering bugs. Assign distinct names & roles.
*/
const TEAM = [
  {
    name: "Arslaan Khan",
    role: "CEO & Co-founder",
    bio: "Full-stack developer with 3+ years in MERN. Architect of RoomBridge.",
  },
  {
    name: "Fatima Noor",
    role: "CTO",
    bio: "Backend engineer specialising in Node.js, MongoDB, and scalable APIs.",
  },
  {
    name: "Bilal Ahmed",
    role: "Lead Designer",
    bio: "UI/UX designer focused on accessible, beautiful product experiences.",
  },
  {
    name: "Sana Malik",
    role: "Product Manager",
    bio: "Shapes strategy and roadmap. Passionate about Pakistan's housing market.",
  },
];

const VALUES = [
  {
    icon: RiShieldCheckLine,
    title: "Trust First",
    desc: "Every listing is verified. Every owner is screened. Safety is our top priority.",
  },
  {
    icon: RiGroupLine,
    title: "Community",
    desc: "We build lasting connections between roommates, not just transactions.",
  },
  {
    icon: RiHeartLine,
    title: "Inclusivity",
    desc: "Rooms for everyone — students, families, working professionals.",
  },
  {
    icon: RiSearchLine,
    title: "Transparency",
    desc: "No hidden fees. What you see is what you pay.",
  },
];

const MILESTONES = [
  { year: "2022", event: "RoomBridge founded in Islamabad" },
  {
    year: "2023",
    event: "Launched in Karachi & Lahore. 1,000 listings milestone",
  },
  { year: "2024", event: "Expanded to 10 cities. 5,000+ active tenants" },
  {
    year: "2025",
    event: "12,000 listings nationwide. Roommate matching goes live",
  },
];

const AboutPage = () => (
  <div className="min-h-screen">
    {/* ── Hero ─────────────────────────────────────────── */}
    <section className="bg-primary py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      <div className="relative max-w-3xl mx-auto">
        <div
          className="inline-flex items-center gap-2 bg-white/10 text-accent
                        px-4 py-1.5 rounded-full text-sm font-medium mb-5 border border-white/20"
        >
          <RiBuildingLine /> Our Story
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Building Pakistan's Most <span className="text-accent">Trusted</span>{" "}
          Room Rental Platform
        </h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto">
          We started RoomBridge because finding a safe, affordable room in
          Pakistan's cities was unnecessarily hard. We're changing that — city
          by city.
        </p>
      </div>
    </section>

    {/* ── Stats ──────────────────────────────────────────── */}
    <section className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { value: "12,000+", label: "Rooms Listed" },
            { value: "8,500+", label: "Happy Tenants" },
            { value: "25+", label: "Cities" },
            { value: "4.8★", label: "Avg Rating" },
          ].map(({ value, label }) => (
            <div key={label} className="py-8 px-6 text-center">
              <p className="text-3xl font-bold text-primary">{value}</p>
              <p className="text-sm text-text-secondary mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Mission ──────────────────────────────────────── */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold text-primary mb-4">Our Mission</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Every year, millions of Pakistanis move to new cities for study and
            work. The process of finding a safe, affordable room through
            classifieds is stressful, time-consuming, and risky.
          </p>
          <p className="text-text-secondary leading-relaxed mb-6">
            RoomBridge is on a mission to make room hunting as easy as booking a
            flight — with verified listings, smart roommate matching, and secure
            in-app communication.
          </p>
          <div className="flex flex-col gap-3">
            {[
              "Verify every listing",
              "Enable safe communication",
              "Make room hunting effortless",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-primary font-medium"
              >
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <RiArrowRightLine className="text-success text-xs" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-card border border-border p-5
                            hover:shadow-hover transition-shadow duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="text-primary text-lg" />
              </div>
              <h3 className="font-bold text-primary text-sm mb-1">{title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── How it works ─────────────────────────────────── */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-3">
            How RoomBridge Works
          </h2>
          <p className="text-text-secondary">
            Your journey from search to move-in
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: "1",
              icon: RiSearchLine,
              title: "Search",
              desc: "Use our filters to find rooms by city, budget, and amenities.",
            },
            {
              num: "2",
              icon: RiGroupLine,
              title: "Match",
              desc: "Get matched with compatible roommates using our smart algorithm.",
            },
            {
              num: "3",
              icon: RiHome4Line,
              title: "Move In",
              desc: "Confirm your booking, sign the agreement, and move in with confidence.",
            },
          ].map(({ num, icon: Icon, title, desc }) => (
            <div
              key={num}
              className="text-center p-6 bg-background rounded-card border border-border
                                      hover:shadow-hover transition-shadow duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
                <Icon className="text-white text-xl" />
              </div>
              <span className="text-xs font-bold text-accent tracking-widest block mb-2">
                STEP {num}
              </span>
              <h3 className="font-bold text-primary mb-2">{title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Journey / Timeline ───────────────────────────── */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-10 text-center">
          Our Journey
        </h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-8">
            {MILESTONES.map(({ year, event }) => (
              <div key={year} className="flex items-start gap-5 pl-10 relative">
                <div
                  className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary text-white
                                flex items-center justify-center text-xs font-bold z-10 shrink-0"
                >
                  <RiStarFill className="text-accent text-xs" />
                </div>
                <div>
                  <span className="text-accent font-bold text-sm">{year}</span>
                  <p className="text-primary font-medium mt-0.5">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── Team ─────────────────────────────────────────── */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-3">
            Meet the Team
          </h2>
          <p className="text-text-secondary">
            The people building Pakistan's housing future
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map(({ name, role, bio }) => (
            /* key is now 'role' — guaranteed unique after fix above */
            <div
              key={role}
              className="text-center p-6 bg-background rounded-card border border-border
                            hover:shadow-hover transition-shadow duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">{name[0]}</span>
              </div>
              <h3 className="font-bold text-primary mb-1">{name}</h3>
              <p className="text-secondary text-xs font-semibold mb-2">
                {role}
              </p>
              <p className="text-text-secondary text-xs leading-relaxed">
                {bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ──────────────────────────────────────────── */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-4">
          Join the <span className="text-accent">RoomBridge</span> Community
        </h2>
        <p className="text-white/70 mb-8">
          Whether you're looking for a room or listing one, we're here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/listings"
            className="inline-flex items-center justify-center gap-2 bg-accent text-primary
                           font-semibold px-8 py-3.5 rounded-btn hover:bg-white transition-all duration-200"
          >
            <RiSearchLine /> Browse Rooms
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border border-white/30
                           text-white font-semibold px-8 py-3.5 rounded-btn
                           hover:bg-white/10 transition-all duration-200"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default AboutPage;
