// ABOUTME: TypeScript types for Supabase database schema
// ABOUTME: Defines study_groups and participants table types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      study_groups: {
        Row: {
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
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          subject: string;
          description?: string | null;
          professor_name?: string | null;
          location: string;
          start_time: string;
          end_time: string;
          student_limit?: number | null;
          organizer_name?: string | null;
          organizer_email: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          subject?: string;
          description?: string | null;
          professor_name?: string | null;
          location?: string;
          start_time?: string;
          end_time?: string;
          student_limit?: number | null;
          organizer_name?: string | null;
          organizer_email?: string;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          study_group_id: string;
          name: string;
          email: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          study_group_id: string;
          name: string;
          email: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          study_group_id?: string;
          name?: string;
          email?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "participants_study_group_id_fkey";
            columns: ["study_group_id"];
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_participant_count: {
        Args: { p_study_group_id: string };
        Returns: number;
      };
      is_study_group_full: {
        Args: { p_study_group_id: string };
        Returns: boolean;
      };
      is_group_member: {
        Args: { p_study_group_id: string; p_email: string };
        Returns: boolean;
      };
      get_group_participants_if_member: {
        Args: { p_study_group_id: string; p_requester_email: string };
        Returns: {
          id: string;
          name: string;
          email: string;
          joined_at: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export interface StudyGroupWithCounts {
  id: string;
  subject: string;
  description: string | null;
  professor_name: string | null;
  location: string;
  start_time: string;
  end_time: string;
  student_limit: number | null;
  organizer_name: string | null;
  created_at: string;
  expires_at: string;
  participant_count: number;
  is_full: boolean;
}

export type StudyGroup = Database["public"]["Tables"]["study_groups"]["Row"];
export type Participant = Database["public"]["Tables"]["participants"]["Row"];
export type ParticipantInsert =
  Database["public"]["Tables"]["participants"]["Insert"];
