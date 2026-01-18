// ABOUTME: Tests for the EmptyState component
// ABOUTME: Verifies empty state display and action button

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No study groups found" />)

    expect(screen.getByText('No study groups found')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No groups"
        description="Try a different search term"
      />
    )

    expect(screen.getByText('Try a different search term')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="No groups" />)

    expect(
      container.querySelector('.empty-state__description')
    ).not.toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    render(
      <EmptyState
        title="No groups"
        action={{ label: 'Create Group', onClick: vi.fn() }}
      />
    )

    expect(
      screen.getByRole('button', { name: 'Create Group' })
    ).toBeInTheDocument()
  })

  it('does not render action button when not provided', () => {
    render(<EmptyState title="No groups" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls action onClick when button clicked', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="No groups"
        action={{ label: 'Refresh', onClick }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders icon', () => {
    const { container } = render(<EmptyState title="No groups" />)

    expect(container.querySelector('.empty-state__icon')).toBeInTheDocument()
  })
})
