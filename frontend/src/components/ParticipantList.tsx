// ABOUTME: Participant list component for organizer dashboard
// ABOUTME: Shows list of students who joined a study group

import { useState, useEffect } from 'react'
import { formatDate, formatTime } from '../lib/timezone'
import { LoadingSpinner } from './LoadingSpinner'
import './ParticipantList.css'

interface Participant {
  id: string
  name: string
  email: string
  joined_at: string
}

interface ParticipantListProps {
  groupSubject: string
  fetchParticipants: () => Promise<Participant[]>
  onClose: () => void
}

export function ParticipantList({
  groupSubject,
  fetchParticipants,
  onClose,
}: ParticipantListProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchParticipants()
        setParticipants(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load participants')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [fetchParticipants])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="participant-list-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="participant-list-title"
    >
      <div className="participant-list">
        <button
          className="participant-list__close"
          onClick={onClose}
          aria-label="Close participant list"
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <h2 id="participant-list-title" className="participant-list__title">
          Participants
        </h2>
        <p className="participant-list__subtitle">{groupSubject}</p>

        {isLoading && (
          <div className="participant-list__loading">
            <LoadingSpinner size="medium" message="Loading participants..." />
          </div>
        )}

        {error && (
          <p className="participant-list__error" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && participants.length === 0 && (
          <p className="participant-list__empty">
            No one has joined this study group yet.
          </p>
        )}

        {!isLoading && !error && participants.length > 0 && (
          <>
            <p className="participant-list__count">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
            <ul className="participant-list__list">
              {participants.map((participant) => (
                <li key={participant.id} className="participant-list__item">
                  <div className="participant-list__info">
                    <span className="participant-list__name">
                      {participant.name}
                    </span>
                    <a
                      href={`mailto:${participant.email}`}
                      className="participant-list__email"
                    >
                      {participant.email}
                    </a>
                  </div>
                  <span className="participant-list__date">
                    Joined {formatDate(participant.joined_at)} at{' '}
                    {formatTime(participant.joined_at)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
