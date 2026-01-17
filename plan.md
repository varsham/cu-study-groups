Study Group Management System - Implementation Plan
Architecture Overview
The system consists of:

Google Form → Google Sheet → Google Apps Script → Supabase (webhook)
Supabase Database (PostgreSQL with RLS)
Supabase Edge Functions (email notifications, cleanup)
React + TypeScript Frontend (deployed on Supabase)
1. Project Structure
study-groups/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── functions/
│   │   ├── send-join-confirmation/
│   │   ├── send-organizer-notification/
│   │   └── cleanup-expired-groups/
│   └── config.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StudyGroupCard.tsx
│   │   │   ├── JoinModal.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── pages/
│   │   │   └── HomePage.tsx
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── google-apps-script/
│   └── webhook.gs
├── README.md
└── .env.example
2. Database Schema (Supabase)
Tables
study_groups

id (uuid, primary key, default gen_random_uuid())
subject (text, required)
professor_name (text, required)
location (text, nullable)
start_time (timestamptz, required)
end_time (timestamptz, required)
student_limit (integer, nullable)
description (text, nullable)
organizer_name (text, nullable)
organizer_email (text, required, check @columbia.edu)
created_at (timestamptz, default now())
expires_at (timestamptz, computed: created_at + 24 hours OR end_time, whichever is earlier)
participants

id (uuid, primary key, default gen_random_uuid())
study_group_id (uuid, foreign key to study_groups, on delete cascade)
name (text, required)
email (text, required, check @columbia.edu)
joined_at (timestamptz, default now())
Unique constraint: (study_group_id, email)
Database Functions & Triggers
compute_expires_at() - Function to calculate expiration (created_at + 24h OR end_time)
update_is_full() - Function to mark groups as full when limit reached
get_participant_count() - Function to count participants per group
Trigger on participants insert to update group full status
Row Level Security (RLS)
study_groups: Public SELECT, no public INSERT/UPDATE/DELETE
participants: Public SELECT (names only, no emails), authenticated INSERT (via Edge Function)
3. Google Apps Script Webhook
File: google-apps-script/webhook.gs

Trigger on form submission
Extract form data from sheet row
Validate email domain (@columbia.edu)
POST to Supabase webhook endpoint (protected by service role key)
Handle errors and retries
Form field mapping:

Name → organizer_name
Subject → subject
Professor Name → professor_name
Location → location
Start Time → start_time (parse from form)
End Time → end_time (parse from form)
Student Limit → student_limit
Description → description
Organizer Email → organizer_email
4. Supabase Edge Functions
send-join-confirmation
Triggered when participant joins
Sends email to student with study group details
Uses Resend API
Includes: subject, professor, time, location, organizer name
send-organizer-notification
Triggered when participant joins
Sends email to organizer (if organizer_email exists)
Notifies about new participant
Uses Resend API
cleanup-expired-groups
Scheduled function (runs every hour via pg_cron or Supabase cron)
Deletes groups where:
expires_at < now() AND participant_count = 0
OR end_time < now()
Cascades to delete participants
5. Frontend Application (React + TypeScript)
Components
StudyGroupCard.tsx

Displays study group information
Shows organizer name (if available)
Formats time as "3:00pm – 5:00pm"
Links location to Google Maps (Columbia campus search)
Shows participant list (names only)
Displays capacity: current_count / limit
States: Available (Join button) vs Full (greyed, "Full" text)
JoinModal.tsx

Form with name and email fields
Validates @columbia.edu email
Prevents duplicate joins
Calls Supabase function to join
Shows success/error messages
SearchBar.tsx

Search across subject, professor_name, location
Real-time filtering
Debounced input
HomePage.tsx

Fetches study groups ordered by start_time ASC
Filters by search query
Renders grid of StudyGroupCard components
Responsive layout (mobile + desktop)
Styling
Columbia-inspired blue (#003366) and neutral palette
Clean, minimal design
Mobile-first responsive
No logos/branding
Supabase Client Setup
Initialize Supabase client with anon key
Real-time subscriptions for participant updates (optional)
Type-safe queries with TypeScript
6. Security & Validation
RLS policies for public read, restricted write
Email validation (@columbia.edu) at database and application level
Webhook authentication (service role key in Google Apps Script)
Edge Functions use service role for database operations
Participant emails never exposed in frontend
7. Deployment
Supabase Setup
Create new Supabase project
Run migrations
Deploy Edge Functions
Configure Resend API key
Set up pg_cron for cleanup (or use Supabase cron)
Frontend Deployment
Build React app
Deploy to Supabase Hosting (or Vercel/Netlify)
Set environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
Google Apps Script
Create Google Form
Link to Google Sheet
Add Apps Script code
Set webhook URL and service role key
Set up form submission trigger
8. Environment Variables
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (for webhook)
RESEND_API_KEY
WEBHOOK_SECRET (optional, for additional security)
9. README Documentation
Include:

System architecture diagram
Google Form → Supabase flow explanation
Setup instructions for each component
Environment variable configuration
Deployment steps
Maintenance guide (monitoring, troubleshooting)
