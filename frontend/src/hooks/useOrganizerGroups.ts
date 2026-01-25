// ABOUTME: Hook for fetching and managing organizer's study groups
// ABOUTME: Provides CRUD operations for authenticated organizers

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { StudyGroupWithCounts, StudyGroup } from "../lib/database.types";

interface StudyGroupWithParticipants extends StudyGroup {
  participants: { count: number }[];
}

interface Participant {
  id: string;
  name: string;
  email: string;
  joined_at: string;
}

export interface CreateStudyGroupInput {
  subject: string;
  description: string | null;
  professor_name: string | null;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  student_limit: number | null;
  organizer_name: string | null;
  organizer_email: string;
}

export interface UpdateStudyGroupInput {
  subject: string;
  description: string | null;
  professor_name: string | null;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  student_limit: number | null;
  organizer_name: string | null;
}

interface UseOrganizerGroupsResult {
  groups: StudyGroupWithCounts[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createGroup: (input: CreateStudyGroupInput) => Promise<void>;
  updateGroup: (groupId: string, input: UpdateStudyGroupInput) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  getParticipants: (groupId: string) => Promise<Participant[]>;
}

export function useOrganizerGroups(): UseOrganizerGroupsResult {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroupWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!user?.email) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch study groups owned by this organizer (case-insensitive match)
      const { data, error: fetchError } = await supabase
        .from("study_groups")
        .select(
          `
          *,
          participants:participants(count)
        `,
        )
        .ilike("organizer_email", user.email.toLowerCase())
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
            description: group.description,
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
  }, [user?.email]);

  const createGroup = useCallback(
    async (input: CreateStudyGroupInput) => {
      if (!user?.email) {
        throw new Error("You must be logged in to create a group");
      }

      // Combine date and time into ISO timestamps (Eastern Time)
      const startDateTime = new Date(`${input.date}T${input.start_time}:00`);
      const endDateTime = new Date(`${input.date}T${input.end_time}:00`);

      const studyGroupData = {
        subject: input.subject,
        description: input.description,
        professor_name: input.professor_name,
        location: input.location,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        student_limit: input.student_limit,
        organizer_name: input.organizer_name,
        organizer_email: user.email.toLowerCase(),
      };

      const { error: insertError } = await supabase
        .from("study_groups")
        .insert(studyGroupData);

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Refetch to update the list
      await fetchGroups();
    },
    [user?.email, fetchGroups],
  );

  const updateGroup = useCallback(
    async (groupId: string, input: UpdateStudyGroupInput) => {
      if (!user?.email) {
        throw new Error("You must be logged in to update a group");
      }

      // Combine date and time into ISO timestamps
      const startDateTime = new Date(`${input.date}T${input.start_time}:00`);
      const endDateTime = new Date(`${input.date}T${input.end_time}:00`);

      const updateData = {
        subject: input.subject,
        description: input.description,
        professor_name: input.professor_name,
        location: input.location,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        student_limit: input.student_limit,
        organizer_name: input.organizer_name,
      };

      const { error: updateError } = await supabase
        .from("study_groups")
        .update(updateData)
        .eq("id", groupId)
        .eq("organizer_email", user.email.toLowerCase());

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Refetch to update the list
      await fetchGroups();
    },
    [user?.email, fetchGroups],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!user?.email) {
        throw new Error("You must be logged in to delete a group");
      }

      const { error: deleteError } = await supabase
        .from("study_groups")
        .delete()
        .eq("id", groupId)
        .eq("organizer_email", user.email.toLowerCase());

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Refetch to update the list
      await fetchGroups();
    },
    [user?.email, fetchGroups],
  );

  const getParticipants = useCallback(
    async (groupId: string): Promise<Participant[]> => {
      if (!user?.email) {
        throw new Error("You must be logged in to view participants");
      }

      // First verify this group belongs to the user
      const { data: group, error: groupError } = await supabase
        .from("study_groups")
        .select("id")
        .eq("id", groupId)
        .eq("organizer_email", user.email.toLowerCase())
        .single();

      if (groupError || !group) {
        throw new Error("Group not found or access denied");
      }

      const { data, error: fetchError } = await supabase
        .from("participants")
        .select("id, name, email, joined_at")
        .eq("study_group_id", groupId)
        .order("joined_at", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      return (data as Participant[]) || [];
    },
    [user?.email],
  );

  // Initial fetch when user changes
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    isLoading,
    error,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getParticipants,
  };
}
