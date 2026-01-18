// ABOUTME: Header component with navigation links
// ABOUTME: Shows logo and links to home and dashboard

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

export function Header() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo">
          <span className="header__logo-icon">CU</span>
          <span className="header__logo-text">Study Groups</span>
        </Link>

        <nav className="header__nav">
          <Link
            to="/"
            className={`header__link ${
              location.pathname === '/' ? 'header__link--active' : ''
            }`}
          >
            Find Groups
          </Link>
          <Link
            to="/dashboard"
            className={`header__link ${
              location.pathname === '/dashboard' ? 'header__link--active' : ''
            }`}
          >
            {user ? 'Dashboard' : 'Organizer Login'}
          </Link>
        </nav>
      </div>
    </header>
  )
}
