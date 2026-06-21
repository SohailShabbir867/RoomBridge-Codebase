import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import Logo from "../../components/common/Logo";
import {
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckboxCircleLine,
  RiArrowLeftLine,
  RiShieldCheckLine,
} from "react-icons/ri";
import studentAvatar from "../../assets/student_avatar.png";

document.title = "Reset Password — RoomBridge";

/* ── Password strength ────────────────────────────────────── */
const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "bg-red-500", "bg-amber-500", "bg-indigo-500", "bg-emerald-500"];
const STRENGTH_TEXT   = ["", "text-red-500", "text-amber-500", "text-indigo-500", "text-emerald-500"];

const ResetPasswordPage = () => {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const dispatch   = useDispatch();

  const [form, setForm]           = useState({ password: "", confirmPassword: "" });
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});
  const [done, setDone]           = useState(false);

  const pwStrength = getStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    else if (!/[A-Z]/.test(form.password)) e.password = "Must contain an uppercase letter";
    else if (!/[0-9]/.test(form.password)) e.password = "Must contain a number";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const data = await authService.resetPassword(token, form.password);
      if (data?.data?.user) {
        dispatch(setCredentials({ user: data.data.user }));
        toast.success("Password reset! You are now logged in. 🎉");
        const map = { owner: "/owner/dashboard", seeker: "/seeker/dashboard", admin: "/admin/dashboard" };
        navigate(map[data.data.user.role] || "/");
      } else {
        toast.success("Password reset successfully!");
        setDone(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Reset link is invalid or has expired.";
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: "" }));
    if (errors.form)   setErrors((er) => ({ ...er, form: "" }));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col justify-between bg-[#F5F0E6] p-4 sm:p-6 md:p-8 font-sans">
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
        <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] sm:min-h-[640px]">

          {/* ── Left brand panel ── */}
          <div className="md:col-span-5 bg-[#FFA26B] p-8 lg:p-12 flex flex-col justify-between text-[#012D1D]">
            <div>
              <Logo className="mb-8" />
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold leading-[1.15] tracking-tight">
                Secure your <br /> new password.
              </h1>
              <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#012D1D]/75 mt-4 max-w-[280px] leading-relaxed">
                Choose a strong password to keep your RoomBridge account safe.
              </p>
            </div>

            <div className="w-44 h-44 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full bg-[#FFEED7] mx-auto flex items-center justify-center overflow-hidden border border-amber-100/50 mt-8 md:mt-0 shadow-inner">
              <img src={studentAvatar} alt="Student Illustration" className="w-[90%] h-[90%] object-contain" />
            </div>
          </div>

          {/* ── Right form panel ── */}
          <div className="md:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">

            {done ? (
              /* ── Success state ── */
              <div className="text-left">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  <RiCheckboxCircleLine className="text-emerald-500 text-4xl" />
                </div>

                <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
                  Password Updated!
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-8">
                  Your password has been reset successfully. You can now sign in.
                </p>

                <Link
                  to="/login"
                  className="inline-block bg-[#012D1D] hover:bg-[#012D1D]/90 active:scale-[0.98] transition-all duration-200 text-white py-4 px-8 rounded-2xl font-bold text-xs sm:text-sm shadow-[0_4px_12px_rgba(1,45,29,0.1)]"
                >
                  Sign In Now →
                </Link>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#012D1D] tracking-tight mb-2">
                  Set New Password
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-8">
                  Enter and confirm your new password below.
                </p>

                {/* Form Error Banner */}
                {errors.form && (
                  <div className="p-4 bg-red-50/80 border border-red-200 text-red-600 rounded-2xl text-xs sm:text-sm font-semibold mb-6" role="alert">
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">

                  {/* New Password */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2" htmlFor="rp-password">
                      New Password
                    </label>
                    <div className="relative">
                      <RiLockLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                      <input
                        id="rp-password"
                        name="password"
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange("password")}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        className={`w-full pl-12 pr-12 py-3.5 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${errors.password ? "ring-2 ring-red-500/50" : ""}`}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPass((s) => !s)}
                        className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#012D1D] transition-colors"
                      >
                        {showPass ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.password}</p>
                    )}

                    {/* Strength meter */}
                    {form.password && (
                      <div className="mt-2 animate-fade-in">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                i <= pwStrength ? STRENGTH_COLORS[pwStrength] : "bg-gray-100"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[9px] mt-1 font-bold ${STRENGTH_TEXT[pwStrength] || "text-gray-400"}`}>
                          {STRENGTH_LABELS[pwStrength] ? `${STRENGTH_LABELS[pwStrength]} password` : "Keep typing…"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#012D1D] uppercase tracking-wider mb-2" htmlFor="rp-confirm">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <RiShieldCheckLine className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                      <input
                        id="rp-confirm"
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={handleChange("confirmPassword")}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        className={`w-full pl-12 pr-12 py-3.5 bg-[#F9F7F2] border-0 rounded-2xl text-[#012D1D] placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFA569]/30 transition-all text-xs sm:text-sm ${errors.confirmPassword ? "ring-2 ring-red-500/50" : ""}`}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#012D1D] transition-colors"
                      >
                        {showConfirm ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#012D1D] hover:bg-[#012D1D]/90 active:scale-[0.98] transition-all duration-200 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm mt-2 shadow-[0_4px_12px_rgba(1,45,29,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-busy={loading}
                  >
                    {loading ? "Resetting…" : <><RiLockLine /> Reset Password</>}
                  </button>
                </form>
              </>
            )}

            {/* Back to Login */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#012D1D] hover:text-[#FFA569] font-bold transition-colors"
              >
                <RiArrowLeftLine className="text-base" /> Back to Login
              </Link>
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

export default ResetPasswordPage;
