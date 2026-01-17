-- ABOUTME: Organizer authentication helpers for CU Study Groups
-- ABOUTME: Functions to support magic link auth and organizer dashboard

-- Function to get study groups for the authenticated organizer
CREATE OR REPLACE FUNCTION get_my_study_groups()
RETURNS TABLE (
    id UUID,
    subject TEXT,
    professor_name TEXT,
    location TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    student_limit INTEGER,
    organizer_name TEXT,
    organizer_email TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    participant_count INTEGER,
    is_full BOOLEAN
) AS $$
BEGIN
    -- Only return groups for the authenticated user
    IF auth.jwt() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT
        sg.id,
        sg.subject,
        sg.professor_name,
        sg.location,
        sg.start_time,
        sg.end_time,
        sg.student_limit,
        sg.organizer_name,
        sg.organizer_email,
        sg.created_at,
        sg.expires_at,
        get_participant_count(sg.id) AS participant_count,
        is_study_group_full(sg.id) AS is_full
    FROM study_groups sg
    WHERE sg.organizer_email = auth.jwt() ->> 'email'
    ORDER BY sg.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get participants for an organizer's study group (includes emails)
CREATE OR REPLACE FUNCTION get_my_group_participants(p_study_group_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    joined_at TIMESTAMPTZ
) AS $$
DECLARE
    v_organizer_email TEXT;
BEGIN
    -- Only allow if authenticated
    IF auth.jwt() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify the user owns this group
    SELECT sg.organizer_email INTO v_organizer_email
    FROM study_groups sg
    WHERE sg.id = p_study_group_id;

    IF v_organizer_email IS NULL THEN
        RAISE EXCEPTION 'Study group not found';
    END IF;

    IF v_organizer_email != auth.jwt() ->> 'email' THEN
        RAISE EXCEPTION 'Not authorized to view participants for this group';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.email,
        p.joined_at
    FROM participants p
    WHERE p.study_group_id = p_study_group_id
    ORDER BY p.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for organizer to delete their own study group
CREATE OR REPLACE FUNCTION delete_my_study_group(p_study_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_organizer_email TEXT;
    v_deleted_count INTEGER;
BEGIN
    -- Only allow if authenticated
    IF auth.jwt() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify the user owns this group
    SELECT sg.organizer_email INTO v_organizer_email
    FROM study_groups sg
    WHERE sg.id = p_study_group_id;

    IF v_organizer_email IS NULL THEN
        RAISE EXCEPTION 'Study group not found';
    END IF;

    IF v_organizer_email != auth.jwt() ->> 'email' THEN
        RAISE EXCEPTION 'Not authorized to delete this group';
    END IF;

    -- Delete the group (participants cascade automatically)
    DELETE FROM study_groups WHERE id = p_study_group_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_my_study_groups() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_group_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_my_study_group(UUID) TO authenticated;
