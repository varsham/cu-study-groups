// ABOUTME: Tests for the ParticipantList component
// ABOUTME: Verifies participant display, loading, and error states

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ParticipantList } from './ParticipantList'

const mockParticipants = [
  {
    id: '1',
    name: 'John Doe',
    email: 'jd123@columbia.edu',
    joined_at: '2026-01-17T14:00:00-05:00',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'js456@columbia.edu',
    joined_at: '2026-01-17T15:30:00-05:00',
  },
]

describe('ParticipantList', () => {
  const defaultProps = {
    groupSubject: 'Calculus I',
    fetchParticipants: vi.fn().mockResolvedValue(mockParticipants),
    onClose: vi.fn(),
  }

  it('renders title and subject', async () => {
    render(<ParticipantList {...defaultProps} />)

    expect(screen.getByText('Participants')).toBeInTheDocument()
    expect(screen.getByText('Calculus I')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Loading participants...')).not.toBeInTheDocument()
    })
  })

  it('has accessible dialog role', async () => {
    render(<ParticipantList {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Loading participants...')).not.toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<ParticipantList {...defaultProps} />)

    expect(screen.getByText('Loading participants...')).toBeInTheDocument()
  })

  it('displays participants after loading', async () => {
    render(<ParticipantList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('displays participant emails as mailto links', async () => {
    render(<ParticipantList {...defaultProps} />)

    await waitFor(() => {
      const emailLink = screen.getByRole('link', { name: 'jd123@columbia.edu' })
      expect(emailLink).toHaveAttribute('href', 'mailto:jd123@columbia.edu')
    })
  })

  it('displays participant count', async () => {
    render(<ParticipantList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('2 participants')).toBeInTheDocument()
    })
  })

  it('uses singular form for one participant', async () => {
    const fetchParticipants = vi.fn().mockResolvedValue([mockParticipants[0]])
    render(
      <ParticipantList {...defaultProps} fetchParticipants={fetchParticipants} />
    )

    await waitFor(() => {
      expect(screen.getByText('1 participant')).toBeInTheDocument()
    })
  })

  it('shows empty state when no participants', async () => {
    const fetchParticipants = vi.fn().mockResolvedValue([])
    render(
      <ParticipantList {...defaultProps} fetchParticipants={fetchParticipants} />
    )

    await waitFor(() => {
      expect(
        screen.getByText('No one has joined this study group yet.')
      ).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    const fetchParticipants = vi.fn().mockRejectedValue(new Error('Network error'))
    render(
      <ParticipantList {...defaultProps} fetchParticipants={fetchParticipants} />
    )

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    render(<ParticipantList {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn()
    render(<ParticipantList {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('dialog'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
