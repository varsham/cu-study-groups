// ABOUTME: Tests for the LoginForm component
// ABOUTME: Verifies login form validation and magic link submission

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from './LoginForm'

// Mock the useAuth hook
const mockSignInWithMagicLink = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithMagicLink: mockSignInWithMagicLink,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    mockSignInWithMagicLink.mockReset()
    mockSignInWithMagicLink.mockResolvedValue({ error: null })
  })

  it('renders login form', () => {
    render(<LoginForm />)

    expect(screen.getByText('Organizer Login')).toBeInTheDocument()
    expect(screen.getByLabelText('Columbia Email')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /send magic link/i })
    ).toBeInTheDocument()
  })

  it('disables submit button when email is empty', () => {
    render(<LoginForm />)

    expect(screen.getByRole('button', { name: /send magic link/i })).toBeDisabled()
  })

  it('disables submit button with invalid email', () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'test@gmail.com' },
    })

    expect(screen.getByRole('button', { name: /send magic link/i })).toBeDisabled()
  })

  it('enables submit button with valid Columbia email', () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'test@columbia.edu' },
    })

    expect(
      screen.getByRole('button', { name: /send magic link/i })
    ).not.toBeDisabled()
  })

  it('shows email error for invalid email', () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'test@gmail.com' },
    })

    expect(
      screen.getByText('Please use your @columbia.edu or @barnard.edu email')
    ).toBeInTheDocument()
  })

  it('accepts barnard.edu emails', () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'test@barnard.edu' },
    })

    expect(
      screen.getByRole('button', { name: /send magic link/i })
    ).not.toBeDisabled()
  })

  it('calls signInWithMagicLink on submit', async () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'TEST@Columbia.EDU' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(mockSignInWithMagicLink).toHaveBeenCalledWith('test@columbia.edu')
    })
  })

  it('shows success message after successful submission', async () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'test@columbia.edu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
      expect(screen.getByText(/test@columbia.edu/)).toBeInTheDocument()
    })
  })

  it('calls onSuccess callback after successful submission', async () => {
    const onSuccess = vi.fn()
    render(<LoginForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'test@columbia.edu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('shows error message on submission failure', async () => {
    mockSignInWithMagicLink.mockResolvedValue({
      error: new Error('Rate limit exceeded'),
    })
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'test@columbia.edu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    mockSignInWithMagicLink.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    )
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'test@columbia.edu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    expect(screen.getByText('Sending...')).toBeInTheDocument()
    expect(screen.getByLabelText('Columbia Email')).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
    })
  })
})
