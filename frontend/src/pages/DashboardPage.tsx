// ABOUTME: Dashboard page for organizer login and management
// ABOUTME: Shows login form or dashboard based on auth state

import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/LoginForm'
import { OrganizerDashboard } from '../components/OrganizerDashboard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import './DashboardPage.css'

export function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__loading">
          <LoadingSpinner size="large" message="Loading..." />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {user ? <OrganizerDashboard /> : <LoginForm />}
    </div>
  )
}
