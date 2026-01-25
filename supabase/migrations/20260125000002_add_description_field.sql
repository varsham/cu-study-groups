-- ABOUTME: Adds optional description field to study_groups table
-- ABOUTME: Allows organizers to specify course name and study group goals

-- Add description column (nullable, since existing groups won't have it)
ALTER TABLE study_groups
ADD COLUMN description TEXT;

-- Add a comment explaining the field's purpose
COMMENT ON COLUMN study_groups.description IS 'Optional description for the study group. Can include specific course name (e.g., "Multivariable Calculus" for Mathematics) and goals for the session.';
