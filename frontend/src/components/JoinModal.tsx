// ABOUTME: Modal component for joining a study group
// ABOUTME: Validates Columbia email and submits participant data to Supabase

import { useState } from "react";
import { validateColumbiaEmail, getEmailError } from "../lib/validation";
import "./JoinModal.css";

interface JoinModalProps {
  groupId: string;
  groupSubject: string;
  onClose: () => void;
  onJoin: (data: { name: string; email: string }) => Promise<void>;
}

export function JoinModal({
  groupId: _groupId,
  groupSubject,
  onClose,
  onJoin,
}: JoinModalProps) {
  // Note: groupId is passed for interface consistency but join is handled by parent
  void _groupId;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = email ? getEmailError(email) : null;
  const isValid = name.trim().length > 0 && validateColumbiaEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onJoin({ name: name.trim(), email: email.toLowerCase().trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="join-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-modal-title"
    >
      <div className="join-modal">
        <button
          className="join-modal__close"
          onClick={onClose}
          aria-label="Close modal"
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <h2 id="join-modal-title" className="join-modal__title">
          Join Study Group
        </h2>
        <p className="join-modal__subtitle">{groupSubject}</p>

        <form onSubmit={handleSubmit} className="join-modal__form">
          <div className="join-modal__field">
            <label htmlFor="join-name" className="join-modal__label">
              Your Name
            </label>
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="join-modal__input"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="join-modal__field">
            <label htmlFor="join-email" className="join-modal__label">
              Columbia Email
            </label>
            <input
              id="join-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="uni@columbia.edu"
              className={`join-modal__input ${emailError ? "error" : ""}`}
              required
              disabled={isSubmitting}
            />
            {emailError && (
              <p className="join-modal__error" role="alert">
                {emailError}
              </p>
            )}
          </div>

          {error && (
            <p
              className="join-modal__error join-modal__error--submit"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="join-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="join-modal__button join-modal__button--cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="join-modal__button join-modal__button--submit"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Joining..." : "Join Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
