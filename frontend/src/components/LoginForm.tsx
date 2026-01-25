// ABOUTME: Login form component for organizer magic link authentication
// ABOUTME: Sends magic link to Columbia email for dashboard access

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { validateColumbiaEmail, getEmailError } from "../lib/validation";
import "./LoginForm.css";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailError = email ? getEmailError(email) : null;
  const isValid = validateColumbiaEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await signInWithMagicLink(
      email.toLowerCase().trim(),
    );

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setIsSubmitting(false);
      onSuccess?.();
    }
  };

  if (success) {
    return (
      <div className="login-form login-form--success">
        <svg
          className="login-form__success-icon"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 className="login-form__success-title">Check Your Email</h2>
        <p className="login-form__success-message">
          We sent a magic link to <strong>{email}</strong>. Click the link in
          the email to access your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="login-form">
      <h2 className="login-form__title">Organizer Login</h2>
      <p className="login-form__subtitle">
        Sign in to manage your study groups
      </p>

      <form onSubmit={handleSubmit} className="login-form__form">
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
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Magic Link"}
        </button>
      </form>

      <p className="login-form__note">
        Sign in with your Columbia email to create and manage study groups.
      </p>
    </div>
  );
}
