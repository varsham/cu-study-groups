// ABOUTME: Tests for the Header component
// ABOUTME: Verifies navigation links and auth-aware display

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'

// Mock the useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../contexts/AuthContext'
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

describe('Header', () => {
  it('renders logo', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(screen.getByText('CU')).toBeInTheDocument()
    expect(screen.getByText('Study Groups')).toBeInTheDocument()
  })

  it('renders Find Groups link', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Find Groups' })).toHaveAttribute(
      'href',
      '/'
    )
  })

  it('shows Organizer Login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(
      screen.getByRole('link', { name: 'Organizer Login' })
    ).toBeInTheDocument()
  })

  it('shows Dashboard when authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { email: 'test@columbia.edu' } })
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Organizer Login' })
    ).not.toBeInTheDocument()
  })

  it('applies active class to current route', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    )

    const findGroupsLink = screen.getByRole('link', { name: 'Find Groups' })
    expect(findGroupsLink).toHaveClass('header__link--active')
  })

  it('applies active class to dashboard route', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Header />
      </MemoryRouter>
    )

    const dashboardLink = screen.getByRole('link', { name: 'Organizer Login' })
    expect(dashboardLink).toHaveClass('header__link--active')
  })

  it('logo links to home', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    const logoLink = screen.getByRole('link', { name: /CU.*Study Groups/i })
    expect(logoLink).toHaveAttribute('href', '/')
  })
})
