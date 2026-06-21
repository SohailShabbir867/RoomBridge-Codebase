import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  setCredentials,
  setLoading,
  setError,
} from "../../redux/slices/authSlice";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiLockLine,
  RiAtLine,
} from "react-icons/ri";
import studentAvatar from "../../assets/student_avatar.png";
import Logo from "../../components/common/Logo";

/* ── Meta title ─────────────────────────────────────────────── */
document.title = "Log In — RoomBridge";

/* Role → dashboard path */
const DASHBOARD = {
  owner: "/owner/dashboard",
  seeker: "/seeker/dashboard",
  admin: "/admin/dashboard",
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoadingLocal] = useState(false);
  const [errors, setErrors] = useState({});

  /* ── Validation ─────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoadingLocal(true);
      dispatch(setLoading(true));
      const data = await authService.login({
        email: form.email,
        password: form.password,
      });
      const userData = data.data?.user || data.user;
      dispatch(setCredentials({ user: userData }));
      toast.success(`Welcome back, ${userData.name}! 🎉`);
      const dest = from || DASHBOARD[userData.role] || "/";
      navigate(dest, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "Invalid email or password.";

      if (status === 403 && msg.toLowerCase().includes("verify")) {
        toast.error("Please verify your email first.");
        navigate("/check-email", {
          state: { email: form.email.trim().toLowerCase() },
        });
        return;
      }

      dispatch(setError(msg));
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
    if (errors.form) setErrors((er) => ({ ...er, form: "" }));
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
              <Link
                to="/register"
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Sign Up
              </Link>
              <span className="text-sm font-extrabold text-[#012D1D] relative pb-3">
                Log In
                <span className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-[#E7864B] rounded-full" />
              </span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-8">
              Access your personalized housing dashboard.
            </p>

            {/* Form Error Banner */}
            {errors.form && (
              <div
                className="p-4 bg-red-50/80 border border-red-200 text-red-600 rounded-2xl text-xs sm:text-sm font-semibold mb-6 animate-fade-in"
                role="alert"
              >
                {errors.form}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              
              {/* Email Input */}
              <div>
                <label
                  className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2"
                  htmlFor="login-email"
                >
                  Email or Phone Number
                </label>
                <div className="relative">
                  <RiAtLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter Your Gmail"
                    autoComplete="email"
                    className={`w-full pl-12 pr-4 py-3.5 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${
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

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider"
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[10px] sm:text-xs font-bold text-[#FFA569] hover:text-[#FFA569]/85 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <RiLockLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="********"
                    autoComplete="current-password"
                    className={`w-full pl-12 pr-12 py-3.5 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${
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
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#012D1D] hover:bg-[#012D1D]/90 active:scale-[0.98] transition-all duration-200 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm mt-6 shadow-[0_4px_12px_rgba(1,45,29,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={loading}
              >
                {loading ? "Logging in..." : "Log In →"}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[9px] sm:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  or continue with
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={() => toast("Google login coming soon!", { icon: "🚧" })}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 hover:border-gray-200 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-[#012D1D] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-200"
              >
                <svg
                  viewBox="0 0 48 48"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.2 0 5.7 1.1 7.6 2.9l5.6-5.6C33.8 3.6 29.3 1.5 24 1.5 14.7 1.5 6.9 7.2 3.6 15.3l6.6 5.1C11.9 14.3 17.4 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.4 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.6c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.3-9.4 6.3-16.2z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.2 28.6A14.6 14.6 0 019.5 24c0-1.6.3-3.1.7-4.6L3.6 14.3A22.5 22.5 0 001.5 24c0 3.6.9 7 2.4 10l6.3-5.4z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 46.5c5.3 0 9.8-1.8 13.1-4.8l-7-5.4c-1.8 1.2-4.1 1.9-6.1 1.9-6.6 0-12.1-4.8-13.8-11.2l-6.6 5.1C6.9 40.8 14.7 46.5 24 46.5z"
                  />
                </svg>
                Google
              </button>
            </form>

            {/* Bottom links inside form box */}
            <div className="text-center space-y-3 mt-8">
              <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                New here?{" "}
                <Link
                  to="/register"
                  className="text-[#FFA569] hover:text-[#FFA569]/85 font-bold transition-colors"
                >
                  Create an account
                </Link>
              </p>
              <div>
                <Link
                  to="/register?role=owner"
                  className="inline-block text-[10px] font-extrabold text-[#FFA569] hover:text-[#FFA569]/85 tracking-wider uppercase transition-colors"
                >
                  Are you a hostel owner? Register here →
                </Link>
              </div>
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

export default LoginPage;
