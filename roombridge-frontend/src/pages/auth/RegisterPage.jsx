import React, { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import {
  RiBuildingLine,
  RiEyeLine,
  RiEyeOffLine,
  RiMailLine,
  RiLockLine,
  RiUserLine,
  RiPhoneLine,
  RiMapPin2Line,
  RiUserAddLine,
  RiHome4Line,
  RiKeyLine,
} from "react-icons/ri";
import { CITIES } from "../../utils/constants";

/* ── Meta title ─────────────────────────────────────────────── */
document.title = "Sign Up — RoomBridge";

/* ── Password strength scorer ───────────────────────────────── */
const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
};

/*
  index 0 must have a value so the label/color doesn't show
  "undefined password" when the score is 0.
  Keep the array 5-long (indices 0–4) to match the score range.
*/
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "",
  "bg-error",
  "bg-warning",
  "bg-secondary",
  "bg-success",
];
const STRENGTH_TEXT = [
  "",
  "text-error",
  "text-warning",
  "text-secondary",
  "text-success",
];

/*
  LISTING_TYPES in constants.js uses 'single'/'shared'/'apartment'
  but the backend Listing.model.js enum uses 'single_room'/'shared_room'/'full_apartment'.
  The role selector here only needs 'owner'/'seeker' — those are correct.
  But the URL ?role= param could be anything — validate it.
*/
const VALID_ROLES = ["owner", "seeker"];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* validate role from URL — only accept 'owner' or 'seeker' */
  const rawRole = searchParams.get("role") || "";
  const preselectedRole = VALID_ROLES.includes(rawRole) ? rawRole : "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    role: preselectedRole,
    terms: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /* Memoize strength so it doesn't recalculate on every render */
  const pwStrength = useMemo(() => getStrength(form.password), [form.password]);

  /* ── Validation ─────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!form.phone) e.phone = "Phone number is required";
    else if (!/^(\+92|0)[0-9]{10}$/.test(form.phone.replace(/\s/g, ""))) {
      e.phone = "Enter a valid Pakistani phone number";
    }
    if (!form.city) e.city = "Please select your city";
    if (!form.role) e.role = "Please select a role";
    if (!form.terms) e.terms = "You must accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await authService.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        city: form.city,
        role: form.role,
      });
      toast.success("Account created! Check your email to verify. ✉️");
      navigate("/check-email", {
        state: { email: form.email.trim().toLowerCase() },
      });
    } catch (err) {
      /*
        read from the axios error shape, not err.message directly.
      */
      const msg =
        err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
    if (errors.form) setErrors((er) => ({ ...er, form: "" }));
  };

  const selectRole = (role) => {
    setForm((f) => ({ ...f, role }));
    if (errors.role) setErrors((er) => ({ ...er, role: "" }));
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-primary flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2.5 group w-fit">
          <div
            className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center
                          group-hover:scale-110 transition-transform duration-200"
          >
            <RiBuildingLine className="text-primary text-xl" />
          </div>
          <span className="text-2xl font-bold text-white">
            Room<span className="text-accent">Bridge</span>
          </span>
        </Link>

        <div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Join <span className="text-accent">Thousands</span>
            <br />
            of Happy Members
          </h1>
          <p className="text-white/65 text-lg mb-10">
            Whether you have a room to offer or need one — we've got you
            covered.
          </p>
          {[
            {
              icon: RiHome4Line,
              title: "Room Owners",
              desc: "List your room and get verified tenants fast.",
            },
            {
              icon: RiKeyLine,
              title: "Room Seekers",
              desc: "Find rooms that match your budget & lifestyle.",
            },
            {
              icon: RiBuildingLine,
              title: "Smart Match",
              desc: "AI-powered roommate compatibility scoring.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="text-accent" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{title}</p>
                <p className="text-white/60 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} RoomBridge Pakistan
        </p>
      </div>

      {/* ── Right: Form ───────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <RiBuildingLine className="text-white" />
            </div>
            <span className="text-xl font-bold text-primary">
              Room<span className="text-secondary">Bridge</span>
            </span>
          </Link>

          <h2 className="text-3xl font-bold text-primary mb-1">
            Create your account
          </h2>
          <p className="text-text-secondary mb-7">
            Join RoomBridge — it's free!
          </p>

          {/* Form-level error */}
          {errors.form && (
            <div
              className="mb-4 p-3 bg-red-50 border border-error/30 rounded-input text-sm text-error"
              role="alert"
            >
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* ── Role selector ────────────────────────────── */}
            <div>
              <p className="label mb-2">I am a…</p>
              <div
                className="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-label="Account type"
              >
                {[
                  {
                    value: "seeker",
                    icon: RiKeyLine,
                    label: "Looking for a Room",
                    sub: "Seeker",
                  },
                  {
                    value: "owner",
                    icon: RiHome4Line,
                    label: "Listing a Room",
                    sub: "Owner",
                  },
                ].map(({ value, icon: Icon, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={form.role === value}
                    onClick={() => selectRole(value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-card border-2
                                transition-all duration-200 cursor-pointer
                                ${
                                  form.role === value
                                    ? "border-primary bg-primary/5 shadow-card"
                                    : "border-border bg-white hover:border-secondary hover:shadow-card"
                                }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center
                                    ${form.role === value ? "bg-primary text-white" : "bg-background text-primary"}`}
                    >
                      <Icon className="text-xl" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-primary">
                        {label}
                      </p>
                      <p className="text-xs text-text-secondary">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
              {errors.role && <p className="error-msg mt-1">{errors.role}</p>}
            </div>

            {/* ── Full Name ─────────────────────────────────── */}
            <div>
              <label className="label" htmlFor="reg-name">
                Full Name
              </label>
              <div className="relative">
                <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Muhammad Ali"
                  autoComplete="name"
                  className={`input pl-10 ${errors.name ? "input-error" : ""}`}
                />
              </div>
              {errors.name && <p className="error-msg">{errors.name}</p>}
            </div>

            {/* ── Email ─────────────────────────────────────── */}
            <div>
              <label className="label" htmlFor="reg-email">
                Email Address
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input pl-10 ${errors.email ? "input-error" : ""}`}
                />
              </div>
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            {/* ── Password + strength bar ────────────────────── */}
            <div>
              <label className="label" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`input pl-10 pr-11 ${errors.password ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                                   text-text-secondary hover:text-primary transition-colors"
                >
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
              {errors.password && (
                <p className="error-msg">{errors.password}</p>
              )}

              {/* Strength bar — only render when there's a password */}
              {form.password && (
                <div
                  className="mt-2"
                  aria-label={`Password strength: ${STRENGTH_LABELS[pwStrength] || "too short"}`}
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300
                                       ${i <= pwStrength ? STRENGTH_COLORS[pwStrength] : "bg-border"}`}
                      />
                    ))}
                  </div>
                  {/*
                    pwStrength 0 means password exists but is empty-length — impossible
                    since we only render when form.password is truthy. Score 1–4 maps to labels.
                    Guard with || '' to prevent "undefined password".
                  */}
                  <p
                    className={`text-xs mt-1 font-medium ${STRENGTH_TEXT[pwStrength] || "text-text-secondary"}`}
                  >
                    {STRENGTH_LABELS[pwStrength]
                      ? `${STRENGTH_LABELS[pwStrength]} password`
                      : "Keep typing…"}
                  </p>
                </div>
              )}
            </div>

            {/* ── Confirm Password ──────────────────────────── */}
            <div>
              <label className="label" htmlFor="reg-confirm">
                Confirm Password
              </label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={`input pl-10 pr-11 ${errors.confirmPassword ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                                   text-text-secondary hover:text-primary transition-colors"
                >
                  {showConfirm ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="error-msg">{errors.confirmPassword}</p>
              )}
            </div>

            {/* ── Phone + City ──────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="reg-phone">
                  Phone
                </label>
                <div className="relative">
                  <RiPhoneLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+92 300 1234567"
                    autoComplete="tel"
                    className={`input pl-10 ${errors.phone ? "input-error" : ""}`}
                  />
                </div>
                {errors.phone && (
                  <p className="error-msg text-[11px]">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="reg-city">
                  City
                </label>
                <div className="relative">
                  <RiMapPin2Line className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  <select
                    id="reg-city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={`input pl-10 appearance-none ${errors.city ? "input-error" : ""}`}
                  >
                    <option value="">Select city</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.city && <p className="error-msg">{errors.city}</p>}
              </div>
            </div>

            {/* ── Terms ─────────────────────────────────────── */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  name="terms"
                  type="checkbox"
                  checked={form.terms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded border-border accent-primary cursor-pointer shrink-0"
                />
                <span className="text-sm text-text-secondary leading-snug">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-secondary font-medium hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-secondary font-medium hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.terms && <p className="error-msg mt-1">{errors.terms}</p>}
            </div>

            {/* ── Submit ─────────────────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary btn-lg justify-center gap-2"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
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
                  Creating account…
                </>
              ) : (
                <>
                  <RiUserAddLine /> Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-5">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-secondary font-semibold hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
