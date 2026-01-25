-- ABOUTME: Adds RLS policy allowing authenticated users to create study groups directly
-- ABOUTME: Users can only create groups where they are the organizer (email must match)

-- Allow authenticated users to insert study groups
-- The user's authenticated email must match the organizer_email field
-- This enables direct group creation from the dashboard without requiring the Google Form
CREATE POLICY "study_groups_insert_authenticated"
    ON study_groups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- User can only create groups where they are the organizer
        lower(organizer_email) = lower(auth.jwt() ->> 'email')
        -- Email domain validation is handled by the table constraint
    );
