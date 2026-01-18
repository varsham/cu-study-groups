// ABOUTME: Hook for fetching and subscribing to study groups
// ABOUTME: Provides real-time updates via Supabase subscriptions

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type {
  StudyGroupWithCounts,
  StudyGroup,
  ParticipantInsert,
} from "../lib/database.types";

interface StudyGroupWithParticipants extends StudyGroup {
  participants: { count: number }[];
}

interface UseStudyGroupsResult {
  groups: StudyGroupWithCounts[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  joinGroup: (groupId: string, name: string, email: string) => Promise<void>;
}

export function useStudyGroups(searchQuery: string = ""): UseStudyGroupsResult {
  const [groups, setGroups] = useState<StudyGroupWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setError(null);

      // Fetch study groups with participant counts
      const { data, error: fetchError } = await supabase
        .from("study_groups")
        .select(
          `
          *,
          participants:participants(count)
        `,
        )
        .gt("end_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform data to include participant_count and is_full
      const rawData = data as unknown as StudyGroupWithParticipants[] | null;
      const groupsWithCounts: StudyGroupWithCounts[] = (rawData || []).map(
        (group) => {
          const participantCount = group.participants?.[0]?.count ?? 0;
          return {
            id: group.id,
            subject: group.subject,
            professor_name: group.professor_name,
            location: group.location,
            start_time: group.start_time,
            end_time: group.end_time,
            student_limit: group.student_limit,
            organizer_name: group.organizer_name,
            created_at: group.created_at,
            expires_at: group.expires_at,
            participant_count: participantCount,
            is_full: group.student_limit
              ? participantCount >= group.student_limit
              : false,
          };
        },
      );

      setGroups(groupsWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinGroup = useCallback(
    async (groupId: string, name: string, email: string) => {
      const participant: ParticipantInsert = {
        study_group_id: groupId,
        name,
        email,
      };
      const { error: insertError } = await supabase
        .from("participants")
        .insert(participant);

      if (insertError) {
        if (insertError.message.includes("unique")) {
          throw new Error("You have already joined this study group");
        }
        if (insertError.message.includes("full")) {
          throw new Error("This study group is now full");
        }
        throw new Error(insertError.message);
      }

      // Refetch to get updated counts
      await fetchGroups();
    },
    [fetchGroups],
  );

  // Initial fetch
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("study-groups-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_groups",
        },
        () => {
          fetchGroups();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
        },
        () => {
          fetchGroups();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGroups]);

  // Filter groups based on search query
  const filteredGroups = searchQuery
    ? groups.filter((group) => {
        const query = searchQuery.toLowerCase();
        return (
          group.subject.toLowerCase().includes(query) ||
          group.location.toLowerCase().includes(query) ||
          (group.professor_name?.toLowerCase().includes(query) ?? false) ||
          (group.organizer_name?.toLowerCase().includes(query) ?? false)
        );
      })
    : groups;

  return {
    groups: filteredGroups,
    isLoading,
    error,
    refetch: fetchGroups,
    joinGroup,
  };
}
