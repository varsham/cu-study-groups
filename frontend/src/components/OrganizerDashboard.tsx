// ABOUTME: Dashboard component for organizers to manage their study groups
// ABOUTME: Shows list of owned groups with view participants and delete actions

import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useOrganizerGroups } from "../hooks/useOrganizerGroups";
import type { CreateStudyGroupInput } from "../hooks/useOrganizerGroups";
import { formatTimeRange, getRelativeDay } from "../lib/timezone";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { EmptyState } from "./EmptyState";
import { ConfirmModal } from "./ConfirmModal";
import { ParticipantList } from "./ParticipantList";
import {
  CreateStudyGroupForm,
  type StudyGroupFormData,
} from "./CreateStudyGroupForm";
import "./OrganizerDashboard.css";

export function OrganizerDashboard() {
  const { user, signOut } = useAuth();
  const {
    groups,
    isLoading,
    error,
    refetch,
    createGroup,
    deleteGroup,
    getParticipants,
  } = useOrganizerGroups();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    subject: string;
  } | null>(null);
  const [participantsTarget, setParticipantsTarget] = useState<{
    id: string;
    subject: string;
  } | null>(null);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteGroup(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteGroup]);

  const handleViewParticipants = useCallback(
    (groupId: string, subject: string) => {
      setParticipantsTarget({ id: groupId, subject });
    },
    [],
  );

  const fetchParticipantsForGroup = useCallback(() => {
    if (!participantsTarget) return Promise.resolve([]);
    return getParticipants(participantsTarget.id);
  }, [participantsTarget, getParticipants]);

  const handleCreateGroup = useCallback(
    async (formData: StudyGroupFormData) => {
      const input: CreateStudyGroupInput = {
        subject: formData.subject,
        description: formData.description,
        professor_name: formData.professor_name,
        location: formData.location,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        student_limit: formData.student_limit,
        organizer_name: formData.organizer_name,
        organizer_email: formData.organizer_email,
      };
      await createGroup(input);
      setShowCreateForm(false);
    },
    [createGroup],
  );

  if (isLoading) {
    return (
      <div className="organizer-dashboard">
        <div className="organizer-dashboard__loading">
          <LoadingSpinner size="large" message="Loading your study groups..." />
        </div>
      </div>
    );
  }

  return (
    <div className="organizer-dashboard">
      <header className="organizer-dashboard__header">
        <div className="organizer-dashboard__header-content">
          <h1 className="organizer-dashboard__title">Your Study Groups</h1>
          <p className="organizer-dashboard__email">{user?.email}</p>
        </div>
        <div className="organizer-dashboard__header-actions">
          <button
            type="button"
            className="organizer-dashboard__create"
            onClick={() => setShowCreateForm(true)}
          >
            + Create Study Group
          </button>
          <button
            type="button"
            className="organizer-dashboard__signout"
            onClick={signOut}
          >
            Sign Out
          </button>
        </div>
      </header>

      {error && (
        <div className="organizer-dashboard__error">
          <ErrorMessage message={error} onRetry={refetch} />
        </div>
      )}

      {!error && groups.length === 0 && (
        <EmptyState
          title="No Study Groups"
          description="You haven't created any study groups yet. Click the button above to create one."
        />
      )}

      {!error && groups.length > 0 && (
        <div className="organizer-dashboard__groups">
          {groups.map((group) => (
            <div key={group.id} className="organizer-dashboard__card">
              <div className="organizer-dashboard__card-header">
                <h3 className="organizer-dashboard__card-subject">
                  {group.subject}
                </h3>
                {group.professor_name && (
                  <p className="organizer-dashboard__card-professor">
                    Prof. {group.professor_name}
                  </p>
                )}
                {group.description && (
                  <p className="organizer-dashboard__card-description">
                    {group.description}
                  </p>
                )}
              </div>

              <div className="organizer-dashboard__card-details">
                <div className="organizer-dashboard__card-row">
                  <span className="organizer-dashboard__card-icon">📅</span>
                  <span>{getRelativeDay(group.start_time)}</span>
                </div>
                <div className="organizer-dashboard__card-row">
                  <span className="organizer-dashboard__card-icon">🕐</span>
                  <span>
                    {formatTimeRange(group.start_time, group.end_time)}
                  </span>
                </div>
                <div className="organizer-dashboard__card-row">
                  <span className="organizer-dashboard__card-icon">📍</span>
                  <span>{group.location}</span>
                </div>
                <div className="organizer-dashboard__card-row">
                  <span className="organizer-dashboard__card-icon">👥</span>
                  <span>
                    {group.participant_count}
                    {group.student_limit ? `/${group.student_limit}` : ""}{" "}
                    participants
                  </span>
                </div>
              </div>

              <div className="organizer-dashboard__card-actions">
                <button
                  type="button"
                  className="organizer-dashboard__action organizer-dashboard__action--view"
                  onClick={() =>
                    handleViewParticipants(group.id, group.subject)
                  }
                >
                  View Participants
                </button>
                <button
                  type="button"
                  className="organizer-dashboard__action organizer-dashboard__action--delete"
                  onClick={() =>
                    setDeleteTarget({ id: group.id, subject: group.subject })
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Study Group"
          message={`Are you sure you want to delete "${deleteTarget.subject}"? This will also remove all participants. This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {participantsTarget && (
        <ParticipantList
          groupSubject={participantsTarget.subject}
          fetchParticipants={fetchParticipantsForGroup}
          onClose={() => setParticipantsTarget(null)}
        />
      )}

      {showCreateForm && user?.email && (
        <CreateStudyGroupForm
          organizerEmail={user.email}
          onSubmit={handleCreateGroup}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
