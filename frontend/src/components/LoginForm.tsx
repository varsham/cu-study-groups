// ABOUTME: Login form component for organizer OTP authentication
// ABOUTME: Sends verification code to Columbia email for dashboard access

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { validateColumbiaEmail, getEmailError } from "../lib/validation";
import "./LoginForm.css";

type LoginStep = "email" | "code";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { sendOtpCode, verifyOtpCode } = useAuth();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const emailError = email ? getEmailError(email) : null;
  const isEmailValid = validateColumbiaEmail(email);
  const isCodeValid = code.length === 8 && /^\d+$/.test(code);

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isEmailValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setInfoMessage(null);

    const { error: sendError } = await sendOtpCode(email.toLowerCase().trim());

    if (sendError) {
      setError(sendError.message);
      setIsSubmitting(false);
    } else {
      setStep("code");
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setInfoMessage(null);

    const { error: verifyError } = await verifyOtpCode(
      email.toLowerCase().trim(),
      code,
    );

    if (verifyError) {
      // Auto-resend a new code on failure (expired or invalid)
      setCode("");
      const { error: resendError } = await sendOtpCode(
        email.toLowerCase().trim(),
      );

      if (resendError) {
        setError("Verification failed. Please try again later.");
      } else {
        setInfoMessage(
          "Code invalid or expired. We've sent a new code to your email.",
        );
      }
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onSuccess?.();
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setCode("");
    setError(null);
    setInfoMessage(null);
  };

  const handleResendCode = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setInfoMessage(null);

    const { error: resendError } = await sendOtpCode(
      email.toLowerCase().trim(),
    );

    if (resendError) {
      setError(resendError.message);
    } else {
      setInfoMessage("New code sent to your email.");
    }
    setIsSubmitting(false);
  };

  if (step === "code") {
    return (
      <div className="login-form">
        <h2 className="login-form__title">Enter Verification Code</h2>
        <p className="login-form__subtitle">
          We sent an 8-digit code to <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerifyCode} className="login-form__form">
          <div className="login-form__field">
            <label htmlFor="login-code" className="login-form__label">
              Verification Code
            </label>
            <input
              id="login-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="12345678"
              className="login-form__input login-form__input--code"
              required
              disabled={isSubmitting}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          {infoMessage && (
            <p className="login-form__info" role="status">
              {infoMessage}
            </p>
          )}

          {error && (
            <p
              className="login-form__error login-form__error--submit"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-form__button"
            disabled={!isCodeValid || isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="login-form__actions">
          <button
            type="button"
            className="login-form__link-button"
            onClick={handleResendCode}
            disabled={isSubmitting}
          >
            Resend code
          </button>
          <span className="login-form__separator">·</span>
          <button
            type="button"
            className="login-form__link-button"
            onClick={handleBackToEmail}
            disabled={isSubmitting}
          >
            Use different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-form">
      <h2 className="login-form__title">Organizer Login</h2>
      <p className="login-form__subtitle">
        Sign in to manage your study groups
      </p>

      <form onSubmit={handleSendCode} className="login-form__form">
        <div className="login-form__field">
          <label htmlFor="login-email" className="login-form__label">
            Columbia Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-uni@columbia.edu"
            className={`login-form__input ${emailError ? "error" : ""}`}
            required
            disabled={isSubmitting}
            autoFocus
          />
          {emailError && (
            <p className="login-form__error" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {error && (
          <p
            className="login-form__error login-form__error--submit"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="login-form__button"
          disabled={!isEmailValid || isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Verification Code"}
        </button>
      </form>

      <p className="login-form__note">
        Sign in with your Columbia email to create and manage study groups.
      </p>
    </div>
  );
}
