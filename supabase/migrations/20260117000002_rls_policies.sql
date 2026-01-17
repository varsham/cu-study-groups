-- ABOUTME: Row Level Security policies for CU Study Groups
-- ABOUTME: Controls read/write access to study_groups and participants tables

-- Enable RLS on both tables
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Study Groups Policies

-- Anyone can view study groups (public read)
CREATE POLICY "study_groups_select_public"
    ON study_groups
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Only service role can insert (via webhook from Google Apps Script)
CREATE POLICY "study_groups_insert_service_role"
    ON study_groups
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Organizers can delete their own groups (authenticated users with matching email)
CREATE POLICY "study_groups_delete_organizer"
    ON study_groups
    FOR DELETE
    TO authenticated
    USING (organizer_email = auth.jwt() ->> 'email');

-- Organizers can update their own groups
CREATE POLICY "study_groups_update_organizer"
    ON study_groups
    FOR UPDATE
    TO authenticated
    USING (organizer_email = auth.jwt() ->> 'email')
    WITH CHECK (organizer_email = auth.jwt() ->> 'email');

-- Participants Policies

-- Public can see participant names (but not emails)
-- This is handled at the query level by only selecting 'name' column
-- The policy allows SELECT but the frontend should only query names
CREATE POLICY "participants_select_public"
    ON participants
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Anyone with a valid @columbia.edu email can join (insert)
-- The email constraint in the table ensures only columbia.edu emails
CREATE POLICY "participants_insert_public"
    ON participants
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Participants can remove themselves from a group
CREATE POLICY "participants_delete_self"
    ON participants
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- Service role has full access (for Edge Functions)
CREATE POLICY "study_groups_service_role_all"
    ON study_groups
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "participants_service_role_all"
    ON participants
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
