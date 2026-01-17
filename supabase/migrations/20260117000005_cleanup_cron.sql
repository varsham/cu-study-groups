-- ABOUTME: Set up scheduled cleanup job for expired study groups
-- ABOUTME: Runs every hour to delete expired groups with no participants

-- Enable pg_cron extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule cleanup job to run every hour
SELECT cron.schedule(
    'cleanup-expired-study-groups',  -- job name
    '0 * * * *',                     -- every hour at minute 0
    $$SELECT cleanup_expired_groups()$$
);

-- Add a comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Scheduled job to cleanup expired study groups every hour';
