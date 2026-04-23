import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { RiMailCheckLine, RiMailSendLine, RiLoader4Line } from "react-icons/ri";

const CheckEmailPage = () => {
  const location = useLocation();
  const email = location.state?.email || "";
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("No email address found. Please register again.");
      return;
    }
    try {
      setResending(true);
      await api.post("/auth/resend-verification", { email });
      toast.success("Verification email resent! Check your inbox.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-card border border-border shadow-card max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <RiMailCheckLine className="text-4xl text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-primary mb-3">
          Check Your Email
        </h1>

        <p className="text-text-secondary mb-2">
          We've sent a verification link to:
        </p>
        {email && <p className="text-primary font-semibold mb-4">{email}</p>}

        <p className="text-text-secondary text-sm mb-6">
          Click the link in the email to verify your account. The link expires
          in <strong>24 hours</strong>.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-btn
                       bg-primary/5 border border-primary/20 text-primary text-sm font-medium
                       hover:bg-primary hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            {resending ? (
              <>
                <RiLoader4Line className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                <RiMailSendLine /> Resend Verification Email
              </>
            )}
          </button>

          <Link
            to="/login"
            className="w-full block py-3 rounded-btn bg-background border border-border
                       text-text-secondary text-sm font-medium hover:text-primary
                       hover:border-primary transition-all duration-200 text-center"
          >
            Back to Login
          </Link>
        </div>

        <p className="text-xs text-text-secondary mt-6">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            onClick={handleResend}
            className="text-primary hover:underline"
          >
            click here to resend
          </button>
          .
        </p>
      </div>
    </div>
  );
};

export default CheckEmailPage;
