import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import {
  RiMailLine, RiBuildingLine, RiArrowLeftLine,
  RiSendPlaneLine, RiCheckboxCircleLine, RiRefreshLine,
} from 'react-icons/ri';

document.title = 'Forgot Password — RoomBridge';

const ForgotPasswordPage = () => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      setError('');
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
      toast.success('Password reset link sent!');
    } catch (err) {
      /*
        BUG FIX: err.message doesn't work on axios errors — must use
        err.response?.data?.message. Also: for security, even if the email
        doesn't exist, the backend returns 200 with a generic message.
        We show success regardless to prevent email enumeration.
      */
      const msg = err.response?.data?.message
        || 'Failed to send reset email. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setError('');
    /* Keep email filled — user might just need to retry without retyping */
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-10 group">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center
                          group-hover:bg-secondary transition-colors duration-200">
            <RiBuildingLine className="text-white text-lg" />
          </div>
          <span className="text-2xl font-bold text-primary">
            Room<span className="text-secondary">Bridge</span>
          </span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-card shadow-card border border-border p-8">

          {!sent ? (
            /* ── Step 1: Enter email ─────────────────────── */
            <>
              <div className="text-center mb-7">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RiMailLine className="text-primary text-3xl" />
                </div>
                <h1 className="text-2xl font-bold text-primary mb-1">Forgot your password?</h1>
                <p className="text-text-secondary text-sm leading-relaxed">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5">
                  <label className="label" htmlFor="fp-email">Email Address</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`input pl-10 ${error ? 'input-error' : ''}`}
                    />
                  </div>
                  {error && <p className="error-msg mt-1" role="alert">{error}</p>}
                </div>

                <button type="submit" disabled={loading}
                        className="w-full btn-primary btn-lg justify-center gap-2"
                        aria-busy={loading}>
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <><RiSendPlaneLine /> Send Reset Link</>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── Step 2: Success state ───────────────────── */
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RiCheckboxCircleLine className="text-success text-4xl" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Check your inbox!</h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-2">
                We sent a password reset link to:
              </p>
              <p className="text-primary font-semibold text-sm mb-6 bg-background
                            px-4 py-2 rounded-input inline-block">
                {email}
              </p>
              <p className="text-text-secondary text-xs mb-6">
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  onClick={handleReset}
                  className="text-secondary font-medium hover:text-primary transition-colors
                             inline-flex items-center gap-1"
                >
                  <RiRefreshLine className="text-xs" /> try again
                </button>
              </p>
              <div className="bg-accent/10 rounded-input p-3 text-xs text-text-secondary text-left">
                <p className="font-medium text-primary mb-1">What to do next:</p>
                <ol className="list-decimal list-inside space-y-1 text-text-secondary">
                  <li>Open the email from RoomBridge</li>
                  <li>Click the "Reset Password" button</li>
                  <li>Create a new strong password</li>
                </ol>
              </div>

              {/* Expiry notice */}
              <p className="text-text-secondary text-xs mt-4">
                The reset link expires in <strong>15 minutes</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary
                           hover:text-primary font-medium transition-colors duration-200">
            <RiArrowLeftLine /> Back to Login
          </Link>
        </div>

        <p className="text-center text-xs text-text-secondary mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-secondary font-semibold hover:text-primary transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
