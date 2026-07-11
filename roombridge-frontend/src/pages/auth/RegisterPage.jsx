import React, { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import {
  RiUserLine,
  RiAtLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiPhoneLine,
  RiMapPin2Line,
} from "react-icons/ri";
import { CITIES } from "../../utils/constants";
import studentAvatar from "../../assets/student_avatar.png";
import Logo from "../../components/common/Logo";

/* ── Meta title ─────────────────────────────────────────────── */
document.title = "Sign Up — RoomBridge";

/* Password strength scorer */
const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "",
  "bg-red-500",
  "bg-amber-500",
  "bg-indigo-500",
  "bg-emerald-500",
];
const STRENGTH_TEXT = [
  "",
  "text-red-500",
  "text-amber-500",
  "text-indigo-500",
  "text-emerald-500",
];

const VALID_ROLES = ["owner", "seeker"];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* Validate role from URL — only accept 'owner' or 'seeker' */
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
    else if (getStrength(form.password) < 3)
      e.password = "The password is weak. Please use a strong password for registration.";
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
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col justify-between bg-[#F5F0E6] p-4 sm:p-6 md:p-8 font-sans">
      {/* Spacer / Container to center the card */}
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
        <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] sm:min-h-[640px]">
          
          {/* ── Left side (Branding Panel) ── */}
          <div className="md:col-span-5 bg-[#FFA26B] p-8 lg:p-12 flex flex-col justify-between text-[#012D1D]">
            <div>
              <Logo className="mb-8" />
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold leading-[1.15] tracking-tight">
                Your nest away <br /> from home.
              </h1>
              <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#012D1D]/75 mt-4 max-w-[280px] leading-relaxed">
                Curated sanctuaries for the modern Pakistani student.
              </p>
            </div>
            
            <div className="w-44 h-44 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full bg-[#FFEED7] mx-auto flex items-center justify-center overflow-hidden border border-amber-100/50 mt-8 md:mt-0 shadow-inner">
              <img
                src={studentAvatar}
                alt="Student Illustration"
                className="w-[90%] h-[90%] object-contain"
              />
            </div>
          </div>

          {/* ── Right side (Form Panel) ── */}
          <div className="md:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
            
            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-100 pb-3 mb-8">
              <span className="text-sm font-extrabold text-[#012D1D] relative pb-3">
                Sign Up
                <span className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-[#E7864B] rounded-full" />
              </span>
              <Link
                to="/login"
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Log In
              </Link>
            </div>

            {/* Title & Subtitle */}
            <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
              Create Account
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-8">
              Join RoomBridge — it's free!
            </p>

            {/* Form Error Banner */}
            {errors.form && (
              <div
                className="p-4 bg-red-50/80 border border-red-200 text-red-600 rounded-2xl text-xs sm:text-sm font-semibold mb-6"
                role="alert"
              >
                {errors.form}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              
              {/* Role selector */}
              <div>
                <label className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => selectRole("seeker")}
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold transition-all text-xs border ${
                      form.role === "seeker"
                        ? "bg-[#FFA26B]/15 border-[#E7864B] text-[#E7864B] ring-1 ring-[#E7864B]"
                        : "bg-[#F9F7F2] border-transparent text-[#012D1D]/60 hover:bg-gray-50"
                    }`}
                  >
                    Looking for a Room
                  </button>
                  <button
                    type="button"
                    onClick={() => selectRole("owner")}
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold transition-all text-xs border ${
                      form.role === "owner"
                        ? "bg-[#FFA26B]/15 border-[#E7864B] text-[#E7864B] ring-1 ring-[#E7864B]"
                        : "bg-[#F9F7F2] border-transparent text-[#012D1D]/60 hover:bg-gray-50"
                    }`}
                  >
                    Listing a Room
                  </button>
                </div>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1.5 font-semibold">
                    {errors.role}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label
                  className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2"
                  htmlFor="reg-name"
                >
                  Full Name
                </label>
                <div className="relative">
                  <RiUserLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Muhammad Ali"
                    autoComplete="name"
                    className={`w-full pl-12 pr-4 py-3 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${
                      errors.name ? "ring-2 ring-red-500/50" : ""
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1.5 font-semibold">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label
                  className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2"
                  htmlFor="reg-email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <RiAtLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`w-full pl-12 pr-4 py-3 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${
                      errors.email ? "ring-2 ring-red-500/50" : ""
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 font-semibold">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2"
                  htmlFor="reg-password"
                >
                  Password
                </label>
                <div className="relative">
                  <RiLockLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="reg-password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className={`w-full pl-12 pr-12 py-3 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${
                      errors.password ? "ring-2 ring-red-500/50" : ""
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#012D1D] transition-colors"
                  >
                    {showPass ? (
                      <RiEyeOffLine className="text-lg" />
                    ) : (
                      <RiEyeLine className="text-lg" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5 font-semibold">
                    {errors.password}
                  </p>
                )}

                {/* Password strength meter */}
                {form.password && (
                  <div className="mt-2 animate-fade-in">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            i <= pwStrength
                              ? STRENGTH_COLORS[pwStrength]
                              : "bg-gray-100"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-[9px] mt-1 font-bold ${
                        STRENGTH_TEXT[pwStrength] || "text-gray-400"
                      }`}
                    >
                      {STRENGTH_LABELS[pwStrength]
                        ? `${STRENGTH_LABELS[pwStrength]} password`
                        : "Keep typing…"}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2"
                  htmlFor="reg-confirm"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <RiLockLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="reg-confirm"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className={`w-full pl-12 pr-12 py-3 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${
                      errors.confirmPassword ? "ring-2 ring-red-500/50" : ""
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#012D1D] transition-colors"
                  >
                    {showConfirm ? (
                      <RiEyeOffLine className="text-lg" />
                    ) : (
                      <RiEyeLine className="text-lg" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5 font-semibold">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Phone & City Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2"
                    htmlFor="reg-phone"
                  >
                    Phone
                  </label>
                  <div className="relative">
                    <RiPhoneLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                      className={`w-full pl-12 pr-4 py-3 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${
                        errors.phone ? "ring-2 ring-red-500/50" : ""
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-[10px] mt-1 font-semibold">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2"
                    htmlFor="reg-city"
                  >
                    City
                  </label>
                  <div className="relative">
                    <RiMapPin2Line className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                    <select
                      id="reg-city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-8 py-3 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 appearance-none transition-all text-xs sm:text-sm ${
                        errors.city ? "ring-2 ring-red-500/50" : ""
                      }`}
                    >
                      <option value="">Select city</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1.5 font-semibold">
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    name="terms"
                    type="checkbox"
                    checked={form.terms}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 rounded border-gray-200 accent-[#FFA569] cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-gray-400 font-semibold leading-normal">
                    I agree to the{" "}
                    <Link
                      to="/terms-and-conditions"
                      className="text-[#FFA569] font-bold hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy-policy"
                      className="text-[#FFA569] font-bold hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">
                    {errors.terms}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#012D1D] hover:bg-[#012D1D]/90 active:scale-[0.98] transition-all duration-200 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm shadow-[0_4px_12px_rgba(1,45,29,0.1)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                aria-busy={loading}
              >
                {loading ? "Creating account..." : "Create Account →"}
              </button>
            </form>

            {/* Bottom link inside form box */}
            <div className="text-center space-y-3 mt-8">
              <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#FFA569] hover:text-[#FFA569]/85 font-bold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Page Footer ── */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-widest py-4 pointer-events-auto">
        <p>© {new Date().getFullYear()} ROOMBRIDGE, THE CURATED SANCTUARY FOR STUDENTS.</p>
        <div className="flex gap-5">
          <Link to="/privacy-policy" className="hover:text-[#FFA569] transition-colors">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:text-[#FFA569] transition-colors">Terms of Service</Link>
          <Link to="/contact" className="hover:text-[#FFA569] transition-colors">Help Center</Link>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;
