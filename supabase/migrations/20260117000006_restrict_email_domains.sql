-- ABOUTME: Restricts data to Columbia and Barnard email domains
-- ABOUTME: Database constraints to enforce university-only emails

-- Add check constraint to study_groups organizer_email
ALTER TABLE study_groups
    DROP CONSTRAINT IF EXISTS study_groups_organizer_email_domain_check;

ALTER TABLE study_groups
    ADD CONSTRAINT study_groups_organizer_email_domain_check
    CHECK (organizer_email ~* '@(columbia|barnard)\.edu$');

-- Add check constraint to participants email
ALTER TABLE participants
    DROP CONSTRAINT IF EXISTS participants_email_domain_check;

ALTER TABLE participants
    ADD CONSTRAINT participants_email_domain_check
    CHECK (email ~* '@(columbia|barnard)\.edu$');
