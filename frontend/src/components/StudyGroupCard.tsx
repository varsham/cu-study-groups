// ABOUTME: Study group card component for displaying group information
// ABOUTME: Shows subject, time, location, organizer, and join button

import type { StudyGroupWithCounts } from "../lib/database.types";
import { formatTimeRange, getRelativeDay } from "../lib/timezone";
import "./StudyGroupCard.css";

interface StudyGroupCardProps {
  group: StudyGroupWithCounts;
  onJoin: (groupId: string) => void;
}

export function StudyGroupCard({ group, onJoin }: StudyGroupCardProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    group.location + " Columbia University New York",
  )}`;

  const capacityText = group.student_limit
    ? `${group.participant_count}/${group.student_limit}`
    : `${group.participant_count} joined`;

  return (
    <div className={`study-group-card ${group.is_full ? "full" : ""}`}>
      <div className="card-header">
        <h3 className="subject">{group.subject}</h3>
        {group.professor_name && (
          <p className="professor">Prof. {group.professor_name}</p>
        )}
      </div>

      <div className="card-body">
        {group.description && (
          <p className="description">{group.description}</p>
        )}

        <div className="info-row">
          <span className="icon">📅</span>
          <span className="value">{getRelativeDay(group.start_time)}</span>
        </div>

        <div className="info-row">
          <span className="icon">🕐</span>
          <span className="value">
            {formatTimeRange(group.start_time, group.end_time)}
          </span>
        </div>

        <div className="info-row">
          <span className="icon">📍</span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="location-link"
          >
            {group.location}
          </a>
        </div>

        {group.organizer_name && (
          <div className="info-row">
            <span className="icon">👤</span>
            <span className="value">Organized by {group.organizer_name}</span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className="capacity">{capacityText}</span>
        {group.is_full ? (
          <span className="full-badge">Full</span>
        ) : (
          <button
            className="join-button"
            onClick={() => onJoin(group.id)}
            aria-label={`Join ${group.subject} study group`}
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}
