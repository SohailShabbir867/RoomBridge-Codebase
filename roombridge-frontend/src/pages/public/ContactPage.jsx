import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiMailLine,
  RiMapPin2Line,
  RiSendPlaneLine,
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiBuildingLine,
  RiCompass3Line,
  RiShieldCheckLine,
  RiGroupLine,
  RiWhatsappLine,
  RiArrowDownSLine,
} from "react-icons/ri";
import toast from "react-hot-toast";
import api from "../../services/api";

document.title = "Contact Us — RoomBridge";

/* ─── Design tokens (match Figma) ──────────────────────────── */
const C = {
  darkGreen: "#012D1D",
  btnBrown:  "#8E4E14",
  accent:    "#FFAB69",
  cream:     "#F7F4EF",
  promise:   "#F0EDE9",
  white:     "#FFFFFF",
};

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [role, setRole] = useState("Student");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post("/users/contact", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
        role,
      });
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: C.cream }}>
      {/* ─── Hero / Header ──────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-24 pb-28 px-4 text-center text-white"
        style={{ backgroundColor: C.darkGreen }}
      >
        {/* Ambient radial lighting */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[150px] opacity-[0.05]"
          style={{ backgroundColor: C.accent }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 right-1/4 w-96 h-96 rounded-full blur-[150px] opacity-[0.03]"
          style={{ backgroundColor: C.white }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl mx-auto">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.25em]"
            style={{ color: C.accent }}
          >
            Connect With Us
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight mt-3 mb-6 font-serif leading-tight">
            Get in Touch
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Whether you're a student seeking the perfect room or a hostel owner
            looking to reach more residents, our team is here to guide your journey.
          </p>
        </div>
      </section>

      {/* ─── Form & Contact Details Section ──────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-2 bg-white rounded-[24px] p-8 sm:p-10 shadow-sm border border-gray-100/50">
            <h2
              className="text-2xl font-extrabold tracking-tight mb-8 font-serif"
              style={{ color: C.darkGreen }}
            >
              Send us a message
            </h2>

            {sent ? (
              <div className="text-center py-12">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm"
                  style={{ backgroundColor: `${C.darkGreen}08`, color: C.darkGreen }}
                >
                  <RiCheckboxCircleLine className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-serif" style={{ color: C.darkGreen }}>
                  Message Received!
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                  Thanks for reaching out. We've received your request and will reply to{" "}
                  <strong className="font-semibold text-gray-700">{form.email}</strong>{" "}
                  within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setForm({
                      name: "",
                      email: "",
                      phone: "",
                      subject: "General Inquiry",
                      message: "",
                    });
                  }}
                  className="inline-flex items-center justify-center font-bold py-3 px-8 rounded-xl
                             transition-all duration-200 text-xs text-white uppercase tracking-wider
                             cursor-pointer shadow-md hover:opacity-95 active:scale-[0.98]"
                  style={{ backgroundColor: C.darkGreen }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ibrahim Khan"
                      className={`w-full bg-[#F5F2EB] border-0 rounded-xl py-3.5 px-4 text-sm
                                 focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800
                                 placeholder-gray-400/80 transition-all
                                 ${errors.name ? "ring-1 ring-red-500" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="ibrahim@example.com"
                      className={`w-full bg-[#F5F2EB] border-0 rounded-xl py-3.5 px-4 text-sm
                                 focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800
                                 placeholder-gray-400/80 transition-all
                                 ${errors.email ? "ring-1 ring-red-500" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Phone and Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Phone Input (Non-validating in original, keep as is) */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                      className="w-full bg-[#F5F2EB] border-0 rounded-xl py-3.5 px-4 text-sm
                                 focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800
                                 placeholder-gray-400/80 transition-all"
                    />
                  </div>

                  {/* Subject Select */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Subject
                    </label>
                    <div className="relative">
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full bg-[#F5F2EB] border-0 rounded-xl py-3.5 px-4 text-sm
                                   focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800
                                   appearance-none cursor-pointer pr-10"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Listing Support">Listing Support</option>
                        <option value="Roommate Matching">Roommate Matching</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <RiArrowDownSLine className="text-lg" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: I am a Role Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                    I am a
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {["Student", "Owner", "Other"].map((r) => {
                      const isActive = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className="px-6 py-2 rounded-full text-xs font-bold transition-all duration-200
                                     cursor-pointer active:scale-95 border"
                          style={{
                            backgroundColor: isActive ? C.darkGreen : "#EBE7E0",
                            color: isActive ? C.white : C.darkGreen,
                            borderColor: isActive ? C.darkGreen : "#EBE7E0",
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 4: Message */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Your Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us how we can help you..."
                    className={`w-full bg-[#F5F2EB] border-0 rounded-xl p-4 text-sm
                               focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800
                               placeholder-gray-400/80 resize-none transition-all
                               ${errors.message ? "ring-1 ring-red-500" : ""}`}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-bold py-4 px-6 rounded-xl hover:opacity-95
                             active:scale-[0.98] transition-all duration-200 text-sm shadow-md
                             disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: C.darkGreen }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <RiSendPlaneLine className="text-base" /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Contact details & guarantee */}
          <div className="space-y-6">
            
            {/* Email Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${C.darkGreen}08`, color: C.darkGreen }}
              >
                <RiMailLine className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm" style={{ color: C.darkGreen }}>
                  Email
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                  Drop us a line anytime.
                </p>
                <a
                  href="mailto:hello@roombridge.pk"
                  className="text-xs font-bold underline mt-2 block hover:opacity-85 transition-all"
                  style={{ color: C.btnBrown }}
                >
                  hello@roombridge.pk
                </a>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${C.darkGreen}08`, color: C.darkGreen }}
              >
                <RiWhatsappLine className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm" style={{ color: C.darkGreen }}>
                  WhatsApp
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                  Available for quick chats.
                </p>
                <a
                  href="https://wa.me/923001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold underline mt-2 block hover:opacity-85 transition-all"
                  style={{ color: C.btnBrown }}
                >
                  +92 300 NESTIQ
                </a>
              </div>
            </div>

            {/* Office Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${C.darkGreen}08`, color: C.darkGreen }}
              >
                <RiMapPin2Line className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm" style={{ color: C.darkGreen }}>
                  Office
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-medium">
                  Gulberg III, Main Boulevard<br />Lahore, Punjab, Pakistan
                </p>
              </div>
            </div>

            {/* Response Guarantee Card */}
            <div
              className="rounded-[20px] p-6 text-white relative overflow-hidden shadow-sm"
              style={{ backgroundColor: C.darkGreen }}
            >
              {/* Highlight background element */}
              <div
                className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-[0.1]"
                style={{ backgroundColor: C.accent }}
              />
              
              <div
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: C.accent }}
              >
                <RiCheckboxCircleLine className="text-sm shrink-0" />
                <span>Response Guarantee</span>
              </div>
              <h3 className="text-lg font-extrabold font-serif mt-2.5 mb-1.5">
                Within 24 hours
              </h3>
              <p className="text-[11px] text-white/60 leading-relaxed font-light">
                Our sanctuary concierge team operates daily to ensure your needs are met promptly.
              </p>
            </div>
            
          </div>
        </div>
      </section>

      {/* ─── Support topics section ─────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100/50">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2
                className="text-3xl font-extrabold tracking-tight font-serif"
                style={{ color: C.darkGreen }}
              >
                What do you need help with?
              </h2>
              <p className="text-sm text-gray-400 mt-2 font-light">
                Quickly navigate to the most common support topics and services.
              </p>
            </div>
            <div className="shrink-0">
              <a
                href="#categories"
                className="text-[10px] font-bold tracking-widest uppercase pb-1 border-b"
                style={{ color: C.btnBrown, borderColor: C.btnBrown }}
              >
                Support Categories
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center mb-5 text-[#2E7D32]">
                  <RiBuildingLine className="text-lg" />
                </div>
                <h3 className="font-extrabold text-sm mb-2" style={{ color: C.darkGreen }}>
                  List Your Hostel
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Reach thousands of students and manage your property with ease.
                </p>
              </div>
              <Link
                to="/owner/listings/create"
                className="text-[11px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 mt-5 hover:opacity-85 transition-all"
                style={{ color: C.btnBrown }}
              >
                Get Started <RiArrowRightLine className="text-xs" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] flex items-center justify-center mb-5 text-[#EF6C00]">
                  <RiCompass3Line className="text-lg" />
                </div>
                <h3 className="font-extrabold text-sm mb-2" style={{ color: C.darkGreen }}>
                  Find a Hostel
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Search by location, amenities, and budget across Pakistan.
                </p>
              </div>
              <Link
                to="/explore"
                className="text-[11px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 mt-5 hover:opacity-85 transition-all"
                style={{ color: C.btnBrown }}
              >
                Browse Map <RiArrowRightLine className="text-xs" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] flex items-center justify-center mb-5 text-[#C62828]">
                  <RiShieldCheckLine className="text-lg" />
                </div>
                <h3 className="font-extrabold text-sm mb-2" style={{ color: C.darkGreen }}>
                  Report a Problem
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Encountered an issue with a listing or our platform? Let us know.
                </p>
              </div>
              <a
                href="#contact-form"
                className="text-[11px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 mt-5 hover:opacity-85 transition-all"
                style={{ color: C.btnBrown }}
              >
                Open Ticket <RiArrowRightLine className="text-xs" />
              </a>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] flex items-center justify-center mb-5 text-[#00695C]">
                  <RiGroupLine className="text-lg" />
                </div>
                <h3 className="font-extrabold text-sm mb-2" style={{ color: C.darkGreen }}>
                  Partner With Us
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Universities and organizations looking for institutional partnerships.
                </p>
              </div>
              <Link
                to="/about"
                className="text-[11px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 mt-5 hover:opacity-85 transition-all"
                style={{ color: C.btnBrown }}
              >
                View Program <RiArrowRightLine className="text-xs" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 sm:py-24 px-5 sm:px-8 text-center"
        style={{ backgroundColor: C.cream }}
      >
        {/* Subtle grid of vertical architectural columns layout in background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none flex justify-around"
          style={{ color: C.darkGreen }}
        >
          <div className="w-[1px] h-full bg-current" />
          <div className="w-[1px] h-full bg-current" />
          <div className="w-[1px] h-full bg-current" />
          <div className="w-[1px] h-full bg-current" />
          <div className="w-[1px] h-full bg-current" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 font-serif leading-tight"
            style={{ color: C.darkGreen }}
          >
            Ready to find your sanctuary?
          </h2>
          <p className="text-gray-500 italic text-sm md:text-base mb-10 max-w-lg mx-auto font-light">
            "The next is more than a room, it's where your future begins."
          </p>

          <Link
            to="/explore"
            className="inline-flex items-center justify-center text-white font-bold
                       text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl hover:opacity-90
                       active:scale-[0.97] transition-all duration-200 shadow-md cursor-pointer"
            style={{ backgroundColor: C.darkGreen }}
          >
            Explore Listings
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
