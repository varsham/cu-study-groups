// ABOUTME: Dedicated page for viewing a study group and its participants
// ABOUTME: Shown after joining a group or when viewing a group you're part of

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUserEmail } from "../contexts/UserEmailContext";
import { useAuth } from "../contexts/AuthContext";
import { formatTimeRange, getRelativeDay } from "../lib/timezone";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import "./GroupPage.css";

interface StudyGroup {
  id: string;
  subject: string;
  description: string | null;
  professor_name: string | null;
  location: string;
  start_time: string;
  end_time: string;
  student_limit: number | null;
  organizer_name: string | null;
  organizer_email: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  joined_at: string;
}

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userEmail } = useUserEmail();
  const effectiveEmail = user?.email || userEmail;

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!groupId) {
        setError("Invalid group ID");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from("study_groups")
          .select("*")
          .eq("id", groupId)
          .single();

        if (groupError) {
          throw new Error("Study group not found");
        }

        setGroup(groupData);

        // Check if user is a member and fetch participants
        if (effectiveEmail) {
          const { data: participantData, error: participantError } =
            await supabase.rpc("get_group_participants_if_member", {
              p_study_group_id: groupId,
              p_requester_email: effectiveEmail,
            });

          if (
            !participantError &&
            participantData &&
            participantData.length > 0
          ) {
            setParticipants(participantData);
            setIsMember(true);
          } else {
            // Check if user is the organizer
            if (
              groupData.organizer_email.toLowerCase() ===
              effectiveEmail.toLowerCase()
            ) {
              setIsMember(true);
              // Fetch participants as organizer
              const { data: orgParticipants } = await supabase.rpc(
                "get_group_participants_if_member",
                {
                  p_study_group_id: groupId,
                  p_requester_email: effectiveEmail,
                },
              );
              if (orgParticipants) {
                setParticipants(orgParticipants);
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [groupId, effectiveEmail]);

  const handleLeaveGroup = async () => {
    if (!groupId || !effectiveEmail || isLeaving) return;

    const confirmed = window.confirm(
      "Are you sure you want to leave this study group?",
    );
    if (!confirmed) return;

    // Email notifications disabled - would need currentParticipant for name
    // const currentParticipant = participants.find(
    //   (p) => p.email.toLowerCase() === effectiveEmail.toLowerCase(),
    // );

    setIsLeaving(true);
    try {
      const { error: deleteError } = await supabase
        .from("participants")
        .delete()
        .eq("study_group_id", groupId)
        .eq("email", effectiveEmail.toLowerCase());

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Email notifications disabled - Resend requires domain verification
      // TODO: Re-enable when a verified domain is available
      // if (currentParticipant) {
      //   supabase.functions
      //     .invoke("on-participant-left", {
      //       body: {
      //         participant_name: currentParticipant.name,
      //         participant_email: effectiveEmail,
      //         study_group_id: groupId,
      //       },
      //     })
      //     .catch((err) => console.error("Failed to send leave emails:", err));
      // }

      // Redirect to home page after leaving
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave group");
      setIsLeaving(false);
    }
  };

  // Check if current user is a participant (not just organizer)
  const isParticipant = participants.some(
    (p) => p.email.toLowerCase() === effectiveEmail?.toLowerCase(),
  );

  if (isLoading) {
    return (
      <div className="group-page">
        <div className="group-page__loading">
          <LoadingSpinner size="large" message="Loading study group..." />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="group-page">
        <div className="group-page__error">
          <ErrorMessage
            message={error || "Group not found"}
            onRetry={() => navigate("/")}
          />
          <Link to="/" className="group-page__back-link">
            Back to all groups
          </Link>
        </div>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    group.location + " Columbia University New York",
  )}`;

  const isOrganizer =
    effectiveEmail &&
    group.organizer_email.toLowerCase() === effectiveEmail.toLowerCase();

  return (
    <div className="group-page">
      <Link to="/" className="group-page__back-link">
        ← Back to all groups
      </Link>

      <div className="group-page__card">
        <div className="group-page__header">
          <h1 className="group-page__title">{group.subject}</h1>
          {group.professor_name && (
            <p className="group-page__professor">
              Prof. {group.professor_name}
            </p>
          )}
          {group.description && (
            <p className="group-page__description">{group.description}</p>
          )}
        </div>

        <div className="group-page__details">
          <div className="group-page__detail">
            <span className="group-page__icon">📅</span>
            <span>{getRelativeDay(group.start_time)}</span>
          </div>

          <div className="group-page__detail">
            <span className="group-page__icon">🕐</span>
            <span>{formatTimeRange(group.start_time, group.end_time)}</span>
          </div>

          <div className="group-page__detail">
            <span className="group-page__icon">📍</span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group-page__location-link"
            >
              {group.location}
            </a>
          </div>

          {group.organizer_name && (
            <div className="group-page__detail">
              <span className="group-page__icon">👤</span>
              <span>
                Organized by {group.organizer_name}
                {isOrganizer && " (you)"}
              </span>
            </div>
          )}

          {group.student_limit && (
            <div className="group-page__detail">
              <span className="group-page__icon">👥</span>
              <span>
                {participants.length}/{group.student_limit} spots filled
              </span>
            </div>
          )}
        </div>

        {isMember ? (
          <div className="group-page__participants">
            <h2 className="group-page__section-title">
              Participants ({participants.length})
            </h2>
            {participants.length === 0 ? (
              <p className="group-page__empty">
                No one has joined yet. Be the first!
              </p>
            ) : (
              <ul className="group-page__participant-list">
                {participants.map((p) => (
                  <li key={p.id} className="group-page__participant">
                    <div className="group-page__participant-info">
                      <span className="group-page__participant-name">
                        {p.name}
                        {p.email.toLowerCase() ===
                          effectiveEmail?.toLowerCase() && " (you)"}
                      </span>
                      <a
                        href={`mailto:${p.email}`}
                        className="group-page__participant-email"
                      >
                        {p.email}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {isParticipant && (
              <button
                className="group-page__leave-button"
                onClick={handleLeaveGroup}
                disabled={isLeaving}
              >
                {isLeaving ? "Leaving..." : "Leave Group"}
              </button>
            )}
          </div>
        ) : (
          <div className="group-page__not-member">
            <p>Join this group to see other participants.</p>
            <Link to="/" className="group-page__join-link">
              Go back to join
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
