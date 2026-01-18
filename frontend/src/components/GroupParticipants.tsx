// ABOUTME: Component to display participants for group members
// ABOUTME: Shows participant list if user is organizer or has joined the group

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./GroupParticipants.css";

interface Participant {
  id: string;
  name: string;
  email: string;
  joined_at: string;
}

interface GroupParticipantsProps {
  groupId: string;
  userEmail: string | null;
  participantCount: number;
}

export function GroupParticipants({
  groupId,
  userEmail,
  participantCount,
}: GroupParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Reset when group changes
    setParticipants([]);
    setHasFetched(false);
    setIsExpanded(false);
  }, [groupId]);

  const fetchParticipants = async () => {
    if (!userEmail || hasFetched) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        "get_group_participants_if_member",
        {
          p_study_group_id: groupId,
          p_requester_email: userEmail,
        }
      );

      if (error) {
        console.error("Error fetching participants:", error);
        return;
      }

      setParticipants(data || []);
      setHasFetched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isExpanded && !hasFetched) {
      fetchParticipants();
    }
    setIsExpanded(!isExpanded);
  };

  // Don't show toggle if user is not logged in or no participants
  if (!userEmail || participantCount === 0) {
    return null;
  }

  return (
    <div className="group-participants">
      <button
        className="group-participants__toggle"
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <span className="group-participants__icon">👥</span>
        <span className="group-participants__label">
          {participantCount} participant{participantCount !== 1 ? "s" : ""}
        </span>
        <span className="group-participants__arrow">
          {isExpanded ? "▼" : "▶"}
        </span>
      </button>

      {isExpanded && (
        <div className="group-participants__list">
          {isLoading && (
            <p className="group-participants__loading">Loading...</p>
          )}

          {!isLoading && participants.length === 0 && hasFetched && (
            <p className="group-participants__empty">
              Join this group to see who else is participating.
            </p>
          )}

          {!isLoading && participants.length > 0 && (
            <ul className="group-participants__ul">
              {participants.map((p) => (
                <li key={p.id} className="group-participants__item">
                  <span className="group-participants__name">{p.name}</span>
                  <span className="group-participants__email">{p.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
