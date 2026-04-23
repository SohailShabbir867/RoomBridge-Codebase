import React, { useState } from "react";
import {
  RiMailLine,
  RiPhoneLine,
  RiMapPin2Line,
  RiSendPlaneLine,
  RiTwitterXLine,
  RiFacebookBoxLine,
  RiInstagramLine,
  RiCheckLine,
  RiCustomerService2Line,
  RiTimeLine,
} from "react-icons/ri";
import toast from "react-hot-toast";
import api from "../../services/api";

const CONTACT_INFO = [
  {
    icon: RiMapPin2Line,
    label: "Address",
    value: "F-7/2, Islamabad, Pakistan",
  },
  { icon: RiMailLine, label: "Email", value: "hello@roombridge.pk" },
  { icon: RiPhoneLine, label: "Phone", value: "+92 300 1234567" },
  {
    icon: RiTimeLine,
    label: "Support Hours",
    value: "Mon–Sat, 9 AM – 6 PM PKT",
  },
];

const FAQ = [
  {
    q: "Is RoomBridge free to use?",
    a: "Yes! Searching and contacting owners is 100% free for seekers.",
  },
  {
    q: "How do I list my room?",
    a: 'Create an Owner account, click "Create Listing" and fill in the details.',
  },
  {
    q: "Are listings verified?",
    a: "We manually review listings and verify owner IDs before approving.",
  },
  {
    q: "How does roommate matching work?",
    a: "Complete your lifestyle profile and our algorithm calculates a compatibility score.",
  },
];

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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
        subject: form.subject,
        message: form.message,
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
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="bg-primary py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 bg-white/10 text-accent
                          px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-white/20"
          >
            <RiCustomerService2Line /> We're here to help
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Get in Touch
          </h1>
          <p className="text-white/70 text-lg">
            Have a question, feedback, or need help? Our team responds within 24
            hours.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Left: Contact info card ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-card border border-border p-6">
              <h2 className="text-lg font-bold text-primary mb-5">
                Contact Information
              </h2>
              <div className="space-y-4">
                {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="text-primary text-sm" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-sm font-medium text-primary mt-0.5">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Social */}
              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Follow Us
                </p>
                <div className="flex gap-2">
                  {[
                    { icon: RiTwitterXLine, href: "#", label: "Twitter" },
                    { icon: RiFacebookBoxLine, href: "#", label: "Facebook" },
                    { icon: RiInstagramLine, href: "#", label: "Instagram" },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center
                                  hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 text-text-secondary"
                    >
                      <Icon className="text-sm" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick support options */}
            <div className="bg-primary/5 rounded-card border border-primary/20 p-5">
              <h3 className="font-semibold text-primary text-sm mb-3">
                Quick Help
              </h3>
              {[
                { label: "Listing Issues", sub: "Report a bad listing" },
                { label: "Account Support", sub: "Login & password help" },
                { label: "Booking Questions", sub: "Booking status or refund" },
              ].map(({ label, sub }) => (
                <a
                  key={label}
                  href="#contact-form"
                  className="flex items-center justify-between py-2.5 border-b border-primary/10
                              last:border-0 group cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-primary">{label}</p>
                    <p className="text-xs text-text-secondary">{sub}</p>
                  </div>
                  <RiSendPlaneLine
                    className="text-secondary opacity-0 group-hover:opacity-100
                                              transition-opacity text-sm"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* ── Center/Right: Contact form ── */}
          <div className="lg:col-span-2">
            <div
              id="contact-form"
              className="bg-white rounded-card border border-border p-8"
            >
              <h2 className="text-xl font-bold text-primary mb-6">
                Send Us a Message
              </h2>

              {sent ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RiCheckLine className="text-success text-4xl" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">
                    Message Received!
                  </h3>
                  <p className="text-text-secondary mb-5">
                    Thanks for reaching out. We'll reply to{" "}
                    <strong>{form.email}</strong> within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setForm({
                        name: "",
                        email: "",
                        subject: "",
                        message: "",
                      });
                    }}
                    className="btn-secondary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div>
                      <label className="label">Your Name</label>
                      <input
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Muhammad Ali"
                        className={`input ${errors.name ? "input-error" : ""}`}
                      />
                      {errors.name && (
                        <p className="error-msg">{errors.name}</p>
                      )}
                    </div>
                    {/* Email */}
                    <div>
                      <label className="label">Email Address</label>
                      <div className="relative">
                        <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className={`input pl-9 ${errors.email ? "input-error" : ""}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="error-msg">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="label">Subject</label>
                    <input
                      name="subject"
                      type="text"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      className={`input ${errors.subject ? "input-error" : ""}`}
                    />
                    {errors.subject && (
                      <p className="error-msg">{errors.subject}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="label">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Describe your issue or question in detail…"
                      className={`input resize-none ${errors.message ? "input-error" : ""}`}
                    />
                    {errors.message && (
                      <p className="error-msg">{errors.message}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1 text-right">
                      {form.message.length} characters
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary btn-lg gap-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <RiSendPlaneLine /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-primary mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-text-secondary">
              Quick answers to common questions
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <div
                key={i}
                className="bg-white rounded-card border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left
                             hover:bg-background transition-colors duration-150"
                >
                  <span className="font-semibold text-primary text-sm">
                    {q}
                  </span>
                  <span
                    className={`text-secondary text-lg font-bold transition-transform duration-200
                                    ${openFaq === i ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
