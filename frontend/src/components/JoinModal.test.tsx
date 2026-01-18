// ABOUTME: Tests for the JoinModal component
// ABOUTME: Verifies form validation, submission, and accessibility

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JoinModal } from './JoinModal'

describe('JoinModal', () => {
  const defaultProps = {
    groupId: 'test-group-123',
    groupSubject: 'Calculus I',
    onClose: vi.fn(),
    onJoin: vi.fn().mockResolvedValue(undefined),
  }

  it('renders modal with title and subject', () => {
    render(<JoinModal {...defaultProps} />)

    expect(screen.getByText('Join Study Group')).toBeInTheDocument()
    expect(screen.getByText('Calculus I')).toBeInTheDocument()
  })

  it('has accessible dialog role', () => {
    render(<JoinModal {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders name and email inputs', () => {
    render(<JoinModal {...defaultProps} />)

    expect(screen.getByLabelText('Your Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Columbia Email')).toBeInTheDocument()
  })

  it('disables submit button when form is empty', () => {
    render(<JoinModal {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /join group/i })
    expect(submitButton).toBeDisabled()
  })

  it('disables submit button with invalid email', () => {
    render(<JoinModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'John' },
    })
    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'john@gmail.com' },
    })

    const submitButton = screen.getByRole('button', { name: /join group/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button with valid form data', () => {
    render(<JoinModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'jd123@columbia.edu' },
    })

    const submitButton = screen.getByRole('button', { name: /join group/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('shows email error for invalid email', () => {
    render(<JoinModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'john@gmail.com' },
    })

    expect(
      screen.getByText('Please use your @columbia.edu or @barnard.edu email')
    ).toBeInTheDocument()
  })

  it('accepts barnard.edu emails', () => {
    render(<JoinModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'Jane' },
    })
    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'jane@barnard.edu' },
    })

    const submitButton = screen.getByRole('button', { name: /join group/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onJoin with form data on submit', async () => {
    const onJoin = vi.fn().mockResolvedValue(undefined)
    render(<JoinModal {...defaultProps} onJoin={onJoin} />)

    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'JD123@Columbia.EDU' },
    })
    fireEvent.click(screen.getByRole('button', { name: /join group/i }))

    await waitFor(() => {
      expect(onJoin).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'jd123@columbia.edu',
      })
    })
  })

  it('calls onClose after successful submission', async () => {
    const onClose = vi.fn()
    const onJoin = vi.fn().mockResolvedValue(undefined)
    render(<JoinModal {...defaultProps} onClose={onClose} onJoin={onJoin} />)

    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'John' },
    })
    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'john@columbia.edu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /join group/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('shows error message on submission failure', async () => {
    const onJoin = vi.fn().mockRejectedValue(new Error('Group is full'))
    render(<JoinModal {...defaultProps} onJoin={onJoin} />)

    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'John' },
    })
    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'john@columbia.edu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /join group/i }))

    await waitFor(() => {
      expect(screen.getByText('Group is full')).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const onJoin = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )
    render(<JoinModal {...defaultProps} onJoin={onJoin} />)

    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'John' },
    })
    fireEvent.change(screen.getByLabelText('Columbia Email'), {
      target: { value: 'john@columbia.edu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /join group/i }))

    expect(screen.getByLabelText('Your Name')).toBeDisabled()
    expect(screen.getByLabelText('Columbia Email')).toBeDisabled()
    expect(screen.getByText('Joining...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Joining...')).not.toBeInTheDocument()
    })
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<JoinModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /close modal/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn()
    render(<JoinModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    render(<JoinModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('dialog'))

    expect(onClose).toHaveBeenCalled()
  })

  it('does not close when modal content clicked', () => {
    const onClose = vi.fn()
    render(<JoinModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Join Study Group'))

    expect(onClose).not.toHaveBeenCalled()
  })
})
