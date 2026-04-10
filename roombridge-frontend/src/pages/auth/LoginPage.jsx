import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials, setLoading, setError } from '../../redux/slices/authSlice';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import {
  RiBuildingLine, RiEyeLine, RiEyeOffLine, RiMailLine,
  RiLockLine, RiLoginBoxLine,
  RiHome4Line, RiShieldCheckLine, RiGroupLine,
} from 'react-icons/ri';

/* ── Meta title ─────────────────────────────────────────────── */
document.title = 'Login — RoomBridge';

const FEATURES = [
  { icon: RiHome4Line,       text: 'Thousands of verified rooms across Pakistan' },
  { icon: RiGroupLine,       text: 'Smart roommate matching by lifestyle & budget' },
  { icon: RiShieldCheckLine, text: 'Secure messaging & booking — all in one place' },
];

/* Role → dashboard path */
const DASHBOARD = {
  owner:  '/owner/dashboard',
  seeker: '/seeker/dashboard',
  admin:  '/admin/dashboard',
};

const LoginPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  /*
    BUG FIX: read location.state.from so we can redirect back to the
    page the user was trying to access before ProtectedRoute kicked them.
  */
  const location  = useLocation();
  const from      = location.state?.from;

  const [form,        setForm]        = useState({ email: '', password: '', remember: false });
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoadingLocal] = useState(false);
  const [errors,      setErrors]      = useState({});

  /* ── Validation ─────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
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
      const data = await authService.login({ email: form.email, password: form.password });
      /*
        The API returns { success, message, data: { user } }.
        authService.login() returns res.data (axios envelope), so user is at data.data.user.
      */
      const userData = data.data?.user || data.user;
      dispatch(setCredentials({ user: userData }));
      toast.success(`Welcome back, ${userData.name}! 🎉`);
      /*
        BUG FIX: redirect to the page they were trying to visit (from),
        or fall back to their role-based dashboard.
      */
      const dest = from || DASHBOARD[userData.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Invalid email or password.';

      /* If user hasn't verified email, redirect to check-email page */
      if (status === 403 && msg.toLowerCase().includes('verify')) {
        toast.error('Please verify your email first.');
        navigate('/check-email', { state: { email: form.email.trim().toLowerCase() } });
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
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name])  setErrors((er) => ({ ...er, [name]: '' }));
    if (errors.form)   setErrors((er) => ({ ...er, form: '' }));
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Branding panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-primary flex-col justify-between p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group w-fit">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center
                          group-hover:scale-110 transition-transform duration-200">
            <RiBuildingLine className="text-primary text-xl" />
          </div>
          <span className="text-2xl font-bold text-white">
            Room<span className="text-accent">Bridge</span>
          </span>
        </Link>

        {/* Center content */}
        <div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Find Your <span className="text-accent">Perfect</span><br/>Room in Pakistan
          </h1>
          <p className="text-white/65 text-lg mb-10">
            Pakistan's most trusted room rental & roommate matching platform.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="text-accent text-sm" />
                </div>
                <p className="text-white/80 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} RoomBridge Pakistan
        </p>
      </div>

      {/* ── Right: Form panel ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <RiBuildingLine className="text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Room<span className="text-secondary">Bridge</span></span>
          </Link>

          <h2 className="text-3xl font-bold text-primary mb-1">Welcome back</h2>
          <p className="text-text-secondary mb-8">Sign in to your account to continue</p>

          {/* Form error banner */}
          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-error/30 rounded-input text-sm text-error"
                 role="alert">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="label" htmlFor="login-email">Email Address</label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="login-email" name="email" type="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                />
              </div>
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="login-password" name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`input pl-10 pr-11 ${errors.password ? 'input-error' : ''}`}
                />
                <button type="button" tabIndex={-1}
                        onClick={() => setShowPass((s) => !s)}
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2
                                   text-text-secondary hover:text-primary transition-colors">
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input name="remember" type="checkbox" checked={form.remember}
                       onChange={handleChange}
                       className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link to="/forgot-password"
                    className="text-sm text-secondary hover:text-primary font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
                    className="w-full btn-primary btn-lg justify-center gap-2 mt-1"
                    aria-busy={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                <><RiLoginBoxLine /> Sign In</>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-secondary">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google (placeholder) */}
            <button
              type="button"
              onClick={() => toast('Google login coming soon!', { icon: '🚧' })}
              className="w-full flex items-center justify-center gap-3 border border-border
                         py-2.5 rounded-btn text-sm font-medium text-primary
                         hover:border-primary hover:shadow-card transition-all duration-200 bg-white"
            >
              <svg viewBox="0 0 48 48" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.2 0 5.7 1.1 7.6 2.9l5.6-5.6C33.8 3.6 29.3 1.5 24 1.5 14.7 1.5 6.9 7.2 3.6 15.3l6.6 5.1C11.9 14.3 17.4 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.4 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.6c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.3-9.4 6.3-16.2z"/>
                <path fill="#FBBC05" d="M10.2 28.6A14.6 14.6 0 019.5 24c0-1.6.3-3.1.7-4.6L3.6 14.3A22.5 22.5 0 001.5 24c0 3.6.9 7 2.4 10l6.3-5.4z"/>
                <path fill="#34A853" d="M24 46.5c5.3 0 9.8-1.8 13.1-4.8l-7-5.4c-1.8 1.2-4.1 1.9-6.1 1.9-6.6 0-12.1-4.8-13.8-11.2l-6.6 5.1C6.9 40.8 14.7 46.5 24 46.5z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-secondary font-semibold hover:text-primary transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
