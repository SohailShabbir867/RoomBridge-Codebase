import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import {
  RiLockLine, RiEyeLine, RiEyeOffLine, RiBuildingLine,
  RiCheckLine, RiArrowLeftLine,
} from 'react-icons/ri';

const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s;
};
const STRENGTH_LABELS = ['', 'Weak',    'Fair',      'Good',        'Strong'];
const STRENGTH_COLORS = ['', 'bg-error','bg-warning', 'bg-secondary','bg-success'];
const STRENGTH_TEXT   = ['', 'text-error','text-warning','text-secondary','text-success'];

const ResetPasswordPage = () => {
  const { token }    = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();

  const [form,        setForm]        = useState({ password: '', confirmPassword: '' });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});
  const [done,        setDone]        = useState(false);

  const pwStrength = getStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.password)           e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
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
        toast.success('Password reset! You are now logged in. 🎉');
        const map = { owner: '/owner/dashboard', seeker: '/seeker/dashboard', admin: '/admin/dashboard' };
        navigate(map[data.data.user.role] || '/');
      } else {
        toast.success('Password reset successfully!');
        setDone(true);
      }
    } catch (err) {
      const msg = err.message || 'Reset link is invalid or has expired.';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
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

        <div className="bg-white rounded-card shadow-card border border-border p-8">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RiCheckLine className="text-success text-4xl" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Password Updated!</h2>
              <p className="text-text-secondary text-sm mb-6">Your password has been reset successfully.</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RiLockLine className="text-primary text-3xl" />
                </div>
                <h1 className="text-2xl font-bold text-primary mb-1">Set New Password</h1>
                <p className="text-text-secondary text-sm">Choose a strong password for your account.</p>
              </div>

              {errors.form && (
                <div className="mb-4 p-3 bg-red-50 border border-error/30 rounded-input text-sm text-error">
                  {errors.form}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* New password */}
                <div>
                  <label className="label" htmlFor="rp-password">New Password</label>
                  <div className="relative">
                    <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      id="rp-password" name="password"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); if (errors.password) setErrors(er => ({ ...er, password: '' })); }}
                      placeholder="Min 8 characters"
                      className={`input pl-10 pr-11 ${errors.password ? 'input-error' : ''}`}
                    />
                    <button type="button" tabIndex={-1}
                            onClick={() => setShowPass(s => !s)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors">
                      {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                    </button>
                  </div>
                  {errors.password && <p className="error-msg">{errors.password}</p>}
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i}
                               className={`h-1.5 flex-1 rounded-full transition-colors duration-300
                                           ${i <= pwStrength ? STRENGTH_COLORS[pwStrength] : 'bg-border'}`} />
                        ))}
                      </div>
                      <p className={`text-xs mt-1 font-medium ${STRENGTH_TEXT[pwStrength]}`}>
                        {STRENGTH_LABELS[pwStrength]} password
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="label" htmlFor="rp-confirm">Confirm Password</label>
                  <div className="relative">
                    <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      id="rp-confirm" name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => { setForm(f => ({ ...f, confirmPassword: e.target.value })); if (errors.confirmPassword) setErrors(er => ({ ...er, confirmPassword: '' })); }}
                      placeholder="Re-enter your password"
                      className={`input pl-10 pr-11 ${errors.confirmPassword ? 'input-error' : ''}`}
                    />
                    <button type="button" tabIndex={-1}
                            onClick={() => setShowConfirm(s => !s)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors">
                      {showConfirm ? <RiEyeOffLine /> : <RiEyeLine />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword}</p>}
                </div>

                <button type="submit" disabled={loading}
                        className="w-full btn-primary btn-lg justify-center gap-2 mt-1">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Resetting…
                    </>
                  ) : (
                    <><RiLockLine /> Reset Password</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary
                           hover:text-primary font-medium transition-colors duration-200">
            <RiArrowLeftLine /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
