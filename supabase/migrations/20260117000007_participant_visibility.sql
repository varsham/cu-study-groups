-- ABOUTME: Function to get participants for users who are members of a study group
-- ABOUTME: Returns participant details only if requester is organizer or participant

-- Function to check if an email is a member of a study group (organizer or participant)
CREATE OR REPLACE FUNCTION is_group_member(p_study_group_id UUID, p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_organizer BOOLEAN;
    v_is_participant BOOLEAN;
BEGIN
    -- Check if user is the organizer
    SELECT EXISTS(
        SELECT 1 FROM study_groups
        WHERE id = p_study_group_id
        AND LOWER(organizer_email) = LOWER(p_email)
    ) INTO v_is_organizer;

    IF v_is_organizer THEN
        RETURN TRUE;
    END IF;

    -- Check if user is a participant
    SELECT EXISTS(
        SELECT 1 FROM participants
        WHERE study_group_id = p_study_group_id
        AND LOWER(email) = LOWER(p_email)
    ) INTO v_is_participant;

    RETURN v_is_participant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get participants for a group (returns details only if requester is a member)
CREATE OR REPLACE FUNCTION get_group_participants_if_member(
    p_study_group_id UUID,
    p_requester_email TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    joined_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Only return participant details if requester is a member
    IF NOT is_group_member(p_study_group_id, p_requester_email) THEN
        -- Return empty result for non-members
        RETURN;
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_group_member(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_group_participants_if_member(UUID, TEXT) TO anon, authenticated;
