-- ABOUTME: Database functions and triggers for CU Study Groups
-- ABOUTME: Handles expires_at computation, participant counting, and capacity checks

-- Function to compute expires_at: min(created_at + 24h, end_time)
CREATE OR REPLACE FUNCTION compute_expires_at(p_created_at TIMESTAMPTZ, p_end_time TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN LEAST(p_created_at + INTERVAL '24 hours', p_end_time);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to set expires_at before insert
CREATE OR REPLACE FUNCTION set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at := compute_expires_at(COALESCE(NEW.created_at, NOW()), NEW.end_time);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set expires_at on insert
CREATE TRIGGER trigger_set_expires_at
    BEFORE INSERT ON study_groups
    FOR EACH ROW
    EXECUTE FUNCTION set_expires_at();

-- Function to get participant count for a study group
CREATE OR REPLACE FUNCTION get_participant_count(p_study_group_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM participants
        WHERE study_group_id = p_study_group_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a study group is full
CREATE OR REPLACE FUNCTION is_study_group_full(p_study_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit INTEGER;
    v_count INTEGER;
BEGIN
    SELECT student_limit INTO v_limit
    FROM study_groups
    WHERE id = p_study_group_id;

    -- No limit means never full
    IF v_limit IS NULL THEN
        RETURN FALSE;
    END IF;

    v_count := get_participant_count(p_study_group_id);
    RETURN v_count >= v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger function to prevent joining full groups
CREATE OR REPLACE FUNCTION check_study_group_capacity()
RETURNS TRIGGER AS $$
BEGIN
    IF is_study_group_full(NEW.study_group_id) THEN
        RAISE EXCEPTION 'Study group is full'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check capacity before allowing a participant to join
CREATE TRIGGER trigger_check_capacity
    BEFORE INSERT ON participants
    FOR EACH ROW
    EXECUTE FUNCTION check_study_group_capacity();

-- Function to get study groups with participant counts (for frontend)
CREATE OR REPLACE FUNCTION get_study_groups_with_counts()
RETURNS TABLE (
    id UUID,
    subject TEXT,
    professor_name TEXT,
    location TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    student_limit INTEGER,
    organizer_name TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    participant_count INTEGER,
    is_full BOOLEAN
) AS $$
BEGIN
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
        sg.created_at,
        sg.expires_at,
        get_participant_count(sg.id) AS participant_count,
        is_study_group_full(sg.id) AS is_full
    FROM study_groups sg
    WHERE sg.expires_at > NOW()
      AND sg.end_time > NOW()
    ORDER BY sg.start_time ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to find similar/duplicate study groups (for warning)
CREATE OR REPLACE FUNCTION find_similar_study_groups(
    p_subject TEXT,
    p_professor_name TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    subject TEXT,
    professor_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    organizer_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sg.id,
        sg.subject,
        sg.professor_name,
        sg.start_time,
        sg.end_time,
        sg.organizer_email
    FROM study_groups sg
    WHERE sg.expires_at > NOW()
      AND sg.end_time > NOW()
      AND LOWER(sg.subject) = LOWER(p_subject)
      AND (
          -- Same professor (if provided)
          (p_professor_name IS NOT NULL AND LOWER(sg.professor_name) = LOWER(p_professor_name))
          OR p_professor_name IS NULL
      )
      AND (
          -- Overlapping time
          (sg.start_time, sg.end_time) OVERLAPS (p_start_time, p_end_time)
      );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to cleanup expired groups (called by scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_groups()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM study_groups
        WHERE
            -- Expired with no participants
            (expires_at < NOW() AND get_participant_count(id) = 0)
            -- Or past end time
            OR end_time < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_participant_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_study_group_full(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_study_groups_with_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION find_similar_study_groups(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_groups() TO service_role;
