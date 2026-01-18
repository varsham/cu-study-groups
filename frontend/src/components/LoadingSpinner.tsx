// ABOUTME: Loading spinner component for async states
// ABOUTME: Displays a Columbia-themed animated spinner

import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
}

export function LoadingSpinner({
  size = 'medium',
  message,
}: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner loading-spinner--${size}`} role="status">
      <div className="loading-spinner__circle" aria-hidden="true" />
      {message && <p className="loading-spinner__message">{message}</p>}
      <span className="visually-hidden">Loading...</span>
    </div>
  )
}
