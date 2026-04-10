import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { RiCheckboxCircleLine, RiCloseCircleLine, RiLoader4Line } from 'react-icons/ri';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data?.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-card border border-border shadow-card max-w-md w-full p-8 text-center">

        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <RiLoader4Line className="text-4xl text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-3">Verifying Your Email…</h1>
            <p className="text-text-secondary">Please wait while we verify your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <RiCheckboxCircleLine className="text-4xl text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-3">Email Verified! 🎉</h1>
            <p className="text-text-secondary mb-6">{message}</p>
            <Link
              to="/login"
              className="w-full block py-3 rounded-btn bg-primary text-white text-sm font-semibold
                         hover:bg-primary-dark transition-all duration-200 text-center"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <RiCloseCircleLine className="text-4xl text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-3">Verification Failed</h1>
            <p className="text-text-secondary mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                to="/register"
                className="w-full block py-3 rounded-btn bg-primary text-white text-sm font-semibold
                           hover:bg-primary-dark transition-all duration-200 text-center"
              >
                Register Again
              </Link>
              <Link
                to="/login"
                className="w-full block py-3 rounded-btn bg-background border border-border
                           text-text-secondary text-sm font-medium hover:text-primary
                           hover:border-primary transition-all duration-200 text-center"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmailPage;
