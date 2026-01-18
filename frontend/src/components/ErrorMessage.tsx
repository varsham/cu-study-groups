// ABOUTME: Error message component for displaying errors
// ABOUTME: Provides a styled error alert with optional retry action

import './ErrorMessage.css'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message" role="alert">
      <div className="error-message__content">
        <svg
          className="error-message__icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
        <p className="error-message__text">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          className="error-message__retry"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  )
}
