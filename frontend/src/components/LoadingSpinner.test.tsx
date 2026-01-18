// ABOUTME: Tests for the LoadingSpinner component
// ABOUTME: Verifies rendering, sizes, and accessibility

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with status role', () => {
    render(<LoadingSpinner />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has visually hidden loading text for screen readers', () => {
    render(<LoadingSpinner />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders message when provided', () => {
    render(<LoadingSpinner message="Fetching study groups..." />)

    expect(screen.getByText('Fetching study groups...')).toBeInTheDocument()
  })

  it('applies small size class', () => {
    const { container } = render(<LoadingSpinner size="small" />)

    expect(container.querySelector('.loading-spinner--small')).toBeInTheDocument()
  })

  it('applies medium size class by default', () => {
    const { container } = render(<LoadingSpinner />)

    expect(container.querySelector('.loading-spinner--medium')).toBeInTheDocument()
  })

  it('applies large size class', () => {
    const { container } = render(<LoadingSpinner size="large" />)

    expect(container.querySelector('.loading-spinner--large')).toBeInTheDocument()
  })

  it('renders spinner circle', () => {
    const { container } = render(<LoadingSpinner />)

    expect(container.querySelector('.loading-spinner__circle')).toBeInTheDocument()
  })
})
