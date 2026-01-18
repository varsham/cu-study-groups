// ABOUTME: Tests for the ErrorMessage component
// ABOUTME: Verifies error display and retry functionality

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('has alert role for accessibility', () => {
    render(<ErrorMessage message="Error occurred" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not render retry button by default', () => {
    render(<ErrorMessage message="Error" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', () => {
    render(<ErrorMessage message="Error" onRetry={vi.fn()} />)

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', () => {
    const onRetry = vi.fn()
    render(<ErrorMessage message="Error" onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders error icon', () => {
    const { container } = render(<ErrorMessage message="Error" />)

    expect(container.querySelector('.error-message__icon')).toBeInTheDocument()
  })
})
