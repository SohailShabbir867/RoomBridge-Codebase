import React from "react";
import { Link } from "react-router-dom";
import {
  RiBuildingLine,
  RiGroupLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiHeartLine,
  RiCompass3Line,
  RiMapPin2Line,
  RiCheckboxCircleLine,
  RiStarFill,
} from "react-icons/ri";
// imporing image from the assets images folder 
import sohailImage from "../../assets/images/sohail.jpg";
import radifImage from "../../assets/images/radif.jpg";
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

const AboutUsPage = () => {
  useSEO({
    title: "About Us | RoomBridge Pakistan",
    description: "Learn more about RoomBridge, Pakistan's curated room rental and roommate matching platform connecting students and owners on roombridge.site.",
    keywords: "about roombridge, rental team, student housing Pakistan, roombridge.site"
  });
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: C.cream }}>
      
      {/* ─── Hero Section ───────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8 text-white"
        style={{ backgroundColor: C.darkGreen }}
      >
        {/* Radial ambient lighting */}
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06]"
          style={{ backgroundColor: C.accent }}
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: C.accent }}
            >
              About Us
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-tight font-serif">
              We built RoomBridge because we've{" "}
              <span className="italic font-normal" style={{ color: C.accent }}>
                been there.
              </span>
            </h1>
            <p className="text-white/75 text-sm md:text-base leading-relaxed font-light">
              Finding safe, affordable, and roommate-friendly housing should be easy.
              Yet, for thousands of students and young professionals across Pakistan,
              it remains a struggle. So we built the solution.
            </p>
            <div>
              <a
                href="#team"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-8 transition-all"
                style={{ color: C.accent }}
              >
                Meet the team below <span className="animate-bounce">↓</span>
              </a>
            </div>
          </div>

          {/* Right Column: Premium Image Grid (2x2) */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            
            {/* Image 1: Students Studying */}
            <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80"
                alt="Students working"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Image 2: Hostel Dorm Interior */}
            <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80"
                alt="Cozy room"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Accent Card: Map Your Nest */}
            <div
              className="rounded-2xl p-6 flex flex-col justify-between shadow-lg text-white aspect-[4/3]"
              style={{ backgroundColor: C.btnBrown }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <RiMapPin2Line className="text-xl" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">Map Your Nest</h3>
                <p className="text-[10px] text-white/70 mt-1 font-light">
                  Find the perfect room in seconds.
                </p>
              </div>
            </div>

            {/* Image 4: Architecture facade */}
            <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80"
                alt="Hostel building facade"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ─── Mission Quote Section ──────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center" style={{ backgroundColor: C.cream }}>
        <div className="max-w-4xl mx-auto relative py-4">
          {/* Large decorative quotes background */}
          <div
            className="absolute -top-6 left-0 text-8xl font-serif opacity-[0.04] select-none"
            style={{ color: C.darkGreen }}
          >
            “
          </div>
          <p
            className="text-lg sm:text-2xl font-serif italic leading-relaxed px-8"
            style={{ color: C.darkGreen }}
          >
            "Our mission is to make hostel hunting stress-free for every student in Pakistan —
            one verified listing at a time."
          </p>
          <div
            className="absolute -bottom-12 right-0 text-8xl font-serif opacity-[0.04] select-none"
            style={{ color: C.darkGreen }}
          >
            ”
          </div>
        </div>
      </section>

      {/* ─── The Problems We Solve ──────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-14">
            <h2
              className="text-3xl font-extrabold tracking-tight font-serif"
              style={{ color: C.darkGreen }}
            >
              The Problems We Solve
            </h2>
            <p className="text-sm text-gray-400 mt-2 font-light">
              How RoomBridge bridges the gap between seekers and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left: Problems List (Col span 7) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Problem 1 */}
              <div className="bg-[#FFF8F8] border border-[#FFEBEE] rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] flex items-center justify-center shrink-0 text-[#C62828] font-bold text-sm">
                  01
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#C62828] mb-1">
                    Lack of Trust
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Fake listings, misleading photos, and unverified owners make search risky and unsafe for students.
                  </p>
                </div>
              </div>

              {/* Problem 2 */}
              <div className="bg-[#FFF8F8] border border-[#FFEBEE] rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] flex items-center justify-center shrink-0 text-[#C62828] font-bold text-sm">
                  02
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#C62828] mb-1">
                    Hidden Costs
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Surprise brokerage commission fees, hidden service costs, and arbitrary security deposits.
                  </p>
                </div>
              </div>

              {/* Problem 3 */}
              <div className="bg-[#FFF8F8] border border-[#FFEBEE] rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] flex items-center justify-center shrink-0 text-[#C62828] font-bold text-sm">
                  03
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#C62828] mb-1">
                    Roommate Friction
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Moving in with strangers who have completely incompatible study hours, habits, and lifestyles.
                  </p>
                </div>
              </div>

              {/* Problem 4 */}
              <div className="bg-[#FFF8F8] border border-[#FFEBEE] rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] flex items-center justify-center shrink-0 text-[#C62828] font-bold text-sm">
                  04
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#C62828] mb-1">
                    Safety Concerns
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Hostels located in unsafe neighborhoods with poor security measures, gates, or lock systems.
                  </p>
                </div>
              </div>

            </div>

            {/* Right: The Solution Card (Col span 5) */}
            <div
              className="lg:col-span-5 rounded-[24px] p-8 text-white flex flex-col justify-between shadow-sm relative overflow-hidden"
              style={{ backgroundColor: C.darkGreen }}
            >
              {/* Decorative accent blur */}
              <div
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[100px] opacity-[0.1]"
                style={{ backgroundColor: C.accent }}
              />

              <div className="relative space-y-6">
                <h3 className="text-2xl font-extrabold font-serif tracking-tight">
                  The RoomBridge Way
                </h3>
                <p className="text-xs text-white/70 leading-relaxed font-light">
                  We've redesigned the hostel search flow by placing transparency and user safety first.
                </p>

                <div className="space-y-4 pt-2">
                  {[
                    "100% Verified Physical Listings",
                    "Direct Chat Contact with Owners",
                    "Smart Lifestyle Compatibility Matching",
                    "Safe, Accessible & Handpicked Locations",
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-xs"
                        style={{ backgroundColor: C.btnBrown }}
                      >
                        ✓
                      </div>
                      <span className="text-xs font-semibold text-white/90">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 relative z-10">
                <Link
                  to="/explore"
                  className="w-full inline-flex items-center justify-center gap-2 text-white font-bold
                             text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl hover:opacity-95
                             active:scale-[0.98] transition-all cursor-pointer"
                  style={{ backgroundColor: C.btnBrown }}
                >
                  Start Exploring <RiArrowRightLine />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Stats Bar Section ──────────────────────────────────── */}
      <section
        className="py-12 px-4 sm:px-6 lg:px-8 text-center text-white"
        style={{ backgroundColor: C.darkGreen }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold font-serif" style={{ color: C.accent }}>
              1,200+
            </p>
            <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1 font-semibold">
              Verified Hostels
            </p>
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-extrabold font-serif" style={{ color: C.accent }}>
              40+
            </p>
            <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1 font-semibold">
              Cities Covered
            </p>
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-extrabold font-serif" style={{ color: C.accent }}>
              10,000+
            </p>
            <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1 font-semibold">
              Happy Tenants
            </p>
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-extrabold font-serif" style={{ color: C.accent }}>
              24/7
            </p>
            <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1 font-semibold">
              Dedicated Support
            </p>
          </div>

        </div>
      </section>

      {/* ─── The People Behind RoomBridge ───────────────────────── */}
      <section id="team" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-extrabold tracking-tight font-serif"
              style={{ color: C.darkGreen }}
            >
              The People Behind RoomBridge
            </h2>
            <p className="text-sm text-gray-400 mt-2 font-light">
              Meet the founders and builders of Pakistan's premiere housing network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Founder 1 */}
            <div className="text-center space-y-4">
              <div className="w-36 h-36 rounded-full overflow-hidden mx-auto shadow-md border-4 border-[#F7F4EF]">
                <img
                  src={sohailImage}
                  alt="Sohail Shabbir"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-base" style={{ color: C.darkGreen }}>
                 Sohail Shabbir
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: C.btnBrown }}>
                  CEO & Co-founder
                </p>
              </div>
              <p className="text-xs text-gray-500 italic px-4 font-light leading-relaxed">
                "Build the platform I wish I had as a freshman."
              </p>
            </div>

            {/* Founder 2 */}
            <div className="text-center space-y-4">
              <div className="w-36 h-36 rounded-full overflow-hidden mx-auto shadow-md border-4 border-[#F7F4EF]">
                <img
                  src={sohailImage}
                  alt="Sohail Shabbir"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-base" style={{ color: C.darkGreen }}>
                 Sohail Shabbir
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: C.btnBrown }}>
                  CTO & Co-founder
                </p>
              </div>
              <p className="text-xs text-gray-500 italic px-4 font-light leading-relaxed">
                "Coding solutions that build community."
              </p>
            </div>

            {/* Founder 3 */}
            <div className="text-center space-y-4">
              <div className="w-36 h-36 rounded-full overflow-hidden mx-auto shadow-md border-4 border-[#F7F4EF]">
                <img
                  src={radifImage}
                  alt="Radif Fiaz"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-base" style={{ color: C.darkGreen }}>
                  Radif Fiaz
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: C.btnBrown }}>
                  Frontend Developer & UI/UX Designer
                </p>
              </div>
              <p className="text-xs text-gray-500 italic px-4 font-light leading-relaxed">
                "Designing experiences that feel like home."
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── What We Stand For ──────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: C.cream }}>
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-14">
            <h2
              className="text-3xl font-extrabold tracking-tight font-serif"
              style={{ color: C.darkGreen }}
            >
              What We Stand For
            </h2>
            <p className="text-sm text-gray-400 mt-2 font-light">
              Our core values guide every decision we make.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Value 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/50 shadow-sm flex flex-col justify-between">
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${C.darkGreen}08`, color: C.darkGreen }}
                >
                  <RiStarFill className="text-lg" />
                </div>
                <h3 className="font-extrabold text-sm mb-2" style={{ color: C.darkGreen }}>
                  Professionalism
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Hostels listed on our platform are managed by professional, screened, and trusted operators.
                </p>
              </div>
            </div>

            {/* Value 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/50 shadow-sm flex flex-col justify-between">
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${C.darkGreen}08`, color: C.darkGreen }}
                >
                  <RiShieldCheckLine className="text-lg" />
                </div>
                <h3 className="font-extrabold text-sm mb-2" style={{ color: C.darkGreen }}>
                  Trust & Safety
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Safety is our top priority. We verify every listing physically before it goes live.
                </p>
              </div>
            </div>

            {/* Value 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/50 shadow-sm flex flex-col justify-between">
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${C.darkGreen}08`, color: C.darkGreen }}
                >
                  <RiHeartLine className="text-lg" />
                </div>
                <h3 className="font-extrabold text-sm mb-2" style={{ color: C.darkGreen }}>
                  Seekers First
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Every feature is built to help students find comfortable housing and compatible roommates.
                </p>
              </div>
            </div>

            {/* Value 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/50 shadow-sm flex flex-col justify-between">
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${C.darkGreen}08`, color: C.darkGreen }}
                >
                  <RiCheckboxCircleLine className="text-lg" />
                </div>
                <h3 className="font-extrabold text-sm mb-2" style={{ color: C.darkGreen }}>
                  Maintained Standards
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Continuous checks ensure that security, utilities, and cleanliness are kept at the highest standards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ──────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-6xl mx-auto rounded-[32px] overflow-hidden p-8 sm:p-12 text-center text-white relative shadow-lg"
          style={{ backgroundColor: C.accent }}
        >
          {/* Subtle decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-black/5 blur-xl pointer-events-none" />

          <div className="relative max-w-xl mx-auto space-y-6">
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif"
              style={{ color: C.darkGreen }}
            >
              Join the RoomBridge family
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: `${C.darkGreen}E0` }}>
              We're changing how student housing works in Pakistan. Sign up today and
              find your next home or start listing your properties.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center text-white font-bold text-xs uppercase
                           tracking-wider py-4 px-8 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                style={{ backgroundColor: C.darkGreen }}
              >
                Find a Room
              </Link>
              <Link
                to="/owner/listings/create"
                className="inline-flex items-center justify-center font-bold text-xs uppercase
                           tracking-wider py-4 px-8 rounded-xl border transition-all active:scale-95 cursor-pointer"
                style={{
                  borderColor: C.darkGreen,
                  color: C.darkGreen,
                  backgroundColor: "transparent",
                }}
              >
                List Your Hostel
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUsPage;
