// ABOUTME: Auth callback page that handles magic link verification
// ABOUTME: Shows appropriate messages for success, already logged in, or errors

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { LoadingSpinner } from "../components/LoadingSpinner";
import "./AuthCallbackPage.css";

type AuthStatus =
  | "loading"
  | "success"
  | "already_logged_in"
  | "expired"
  | "error";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      // Wait for auth context to initialize
      if (authLoading) return;

      // If user is already logged in, redirect to dashboard
      if (user) {
        setStatus("already_logged_in");
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
        return;
      }

      // Check for error in URL (Supabase adds error params for invalid/expired links)
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        if (
          errorDescription?.includes("expired") ||
          errorDescription?.includes("invalid")
        ) {
          setStatus("expired");
          setErrorMessage(
            "This magic link has expired or has already been used."
          );
        } else {
          setStatus("error");
          setErrorMessage(errorDescription || "An error occurred during login.");
        }
        return;
      }

      // Check for auth tokens in URL hash (successful verification)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        } catch (err) {
          setStatus("error");
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to complete login"
          );
        }
      } else {
        // No tokens and no error - might be a direct visit or malformed URL
        setStatus("error");
        setErrorMessage("Invalid login link. Please request a new magic link.");
      }
    }

    handleCallback();
  }, [authLoading, user, searchParams, navigate]);

  const handleRequestNewLink = () => {
    navigate("/dashboard");
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="auth-callback">
      {status === "loading" && (
        <div className="auth-callback__content">
          <LoadingSpinner size="large" message="Verifying your login..." />
        </div>
      )}

      {status === "success" && (
        <div className="auth-callback__content auth-callback__content--success">
          <div className="auth-callback__icon">✓</div>
          <h1 className="auth-callback__title">Login Successful!</h1>
          <p className="auth-callback__message">
            Redirecting you to your dashboard...
          </p>
        </div>
      )}

      {status === "already_logged_in" && (
        <div className="auth-callback__content auth-callback__content--info">
          <div className="auth-callback__icon">ℹ</div>
          <h1 className="auth-callback__title">Already Logged In</h1>
          <p className="auth-callback__message">
            You&apos;re already logged in. Redirecting to your dashboard...
          </p>
          <button
            className="auth-callback__button"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard Now
          </button>
        </div>
      )}

      {status === "expired" && (
        <div className="auth-callback__content auth-callback__content--warning">
          <div className="auth-callback__icon">⏱</div>
          <h1 className="auth-callback__title">Link Expired or Already Used</h1>
          <p className="auth-callback__message">
            Magic links can only be used once and expire after 24 hours.
          </p>
          <button
            className="auth-callback__button"
            onClick={handleRequestNewLink}
          >
            Request New Magic Link
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="auth-callback__content auth-callback__content--error">
          <div className="auth-callback__icon">✕</div>
          <h1 className="auth-callback__title">Login Failed</h1>
          <p className="auth-callback__message">{errorMessage}</p>
          <button
            className="auth-callback__button"
            onClick={handleRequestNewLink}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
