import React from "react";
import { Link } from "react-router-dom";
import {
  RiMapPin2Line,
  RiMailLine,
  RiPhoneLine,
  RiTwitterXLine,
  RiFacebookBoxLine,
  RiInstagramLine,
  RiLinkedinBoxLine,
  RiBuildingLine,
  RiHeartLine,
} from "react-icons/ri";

const QUICK_LINKS = [
  { to: "/explore", label: "Browse Rooms" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About Us" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/register", label: "Post a Room" },
  { to: "/contact", label: "Contact Us" },
  { to: "/login", label: "Login" },
];

const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Quetta",
  "Faisalabad",
  "Multan",
];

const SOCIAL = [
  { icon: RiTwitterXLine, href: "#", label: "Twitter" },
  { icon: RiFacebookBoxLine, href: "#", label: "Facebook" },
  { icon: RiInstagramLine, href: "#", label: "Instagram" },
  { icon: RiLinkedinBoxLine, href: "#", label: "LinkedIn" },
];

const CONTACT = [
  { icon: RiMapPin2Line, text: "Khanpur Rahim Yar Khan, Punjab, Pakistan" },
  { icon: RiMailLine, text: "contact.roombridge@gmail.com" },
  { icon: RiPhoneLine, text: "+92 329 172 9925" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: "#012D1D" }} className="text-white">
      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1 — Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 group w-fit">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center
                              group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: "#8E4E14" }}
              >
                <RiBuildingLine className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold text-white">
                Room<span style={{ color: "#FFAB69" }}>Bridge</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              Pakistan's smart room rental and roommate matching platform. Find
              your perfect room or the ideal roommate — safely and easily.
            </p>

            {/* Social icons */}
            <div className="flex gap-2.5 mt-5">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center
                             hover:opacity-80 transition-all duration-200 text-sm"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: "#FBBF24" }}>
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Browse by City */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: "#FBBF24" }}>
              Browse by City
            </h4>
            <ul className="space-y-2.5">
              {CITIES.map((city) => (
                <li key={city}>
                  <Link
                    to={`/explore?city=${city}`}
                    className="text-sm text-white/60 hover:text-white
                               flex items-center gap-1.5 transition-colors duration-200 group"
                  >
                    <RiMapPin2Line
                      className="text-xs shrink-0
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#FFAB69" }}
                    />
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact + Newsletter */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: "#FBBF24" }}>
              Contact Info
            </h4>
            <ul className="space-y-3">
              {CONTACT.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-2.5 text-sm text-white/60"
                >
                  <Icon className="shrink-0 mt-0.5" style={{ color: "#FFAB69" }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            {/* Email alert signup */}
            <div className="mt-6">
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-2">
                Get room alerts
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border
                             text-white placeholder-white/40 outline-none
                             transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-white text-xs font-semibold
                             rounded-lg hover:opacity-90 transition-colors duration-200 shrink-0"
                  style={{ backgroundColor: "#8E4E14" }}
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5
                        flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-sm text-white/40 flex items-center gap-1">
            © {year} RoomBridge Pakistan. Made with{" "}
            <RiHeartLine className="text-error text-xs" /> in Pakistan.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <Link
              to="/privacy-policy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-and-conditions"
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy-policy#cookies"
              className="hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
