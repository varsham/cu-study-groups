// ABOUTME: Error boundary component for catching and displaying React errors
// ABOUTME: Shows user-friendly error message instead of blank screen

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#003366' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            The application encountered an error.
          </p>
          <details style={{
            textAlign: 'left',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
              Error details
            </summary>
            <pre style={{
              overflow: 'auto',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
