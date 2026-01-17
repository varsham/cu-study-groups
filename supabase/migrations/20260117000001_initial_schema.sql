-- ABOUTME: Initial database schema for CU Study Groups
-- ABOUTME: Creates study_groups and participants tables with constraints

-- Study groups table (uses gen_random_uuid() which is built into PostgreSQL 13+)
CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    professor_name TEXT,
    location TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    student_limit INTEGER CHECK (student_limit IS NULL OR student_limit > 0),
    organizer_name TEXT,
    organizer_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Email must be @columbia.edu
    CONSTRAINT valid_organizer_email CHECK (
        organizer_email ~* '^[A-Za-z0-9._%+-]+@columbia\.edu$'
    ),

    -- End time must be after start time
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Email must be @columbia.edu
    CONSTRAINT valid_participant_email CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@columbia\.edu$'
    ),

    -- Prevent duplicate joins (same email to same group)
    CONSTRAINT unique_participant_per_group UNIQUE (study_group_id, email)
);

-- Create indexes for common queries
CREATE INDEX idx_study_groups_start_time ON study_groups(start_time);
CREATE INDEX idx_study_groups_expires_at ON study_groups(expires_at);
CREATE INDEX idx_study_groups_subject ON study_groups(subject);
CREATE INDEX idx_study_groups_organizer_email ON study_groups(organizer_email);
CREATE INDEX idx_participants_study_group_id ON participants(study_group_id);

-- Comments for documentation
COMMENT ON TABLE study_groups IS 'Study groups created by Columbia students';
COMMENT ON TABLE participants IS 'Students who have joined study groups';
COMMENT ON COLUMN study_groups.expires_at IS 'Group expires at min(created_at + 24h, end_time)';
COMMENT ON COLUMN study_groups.student_limit IS 'Maximum number of participants (NULL = unlimited)';
