# CU Study Group Management System

## Project Overview

A study group management system for Columbia University students. Students can create study groups directly through the app after logging in with their Columbia email, or via Google Form (which syncs to Supabase). A React frontend displays available groups and allows students to join.

## Tech Stack

- **Database**: Supabase (PostgreSQL with RLS)
- **Backend**: Supabase Edge Functions (Deno)
- **Frontend**: React 19 + TypeScript + Vite
- **Email**: Gmail SMTP (via Edge Functions and Apps Script)
- **Form Integration**: Google Forms → Google Apps Script webhook
- **Hosting**: Supabase Hosting
- **Testing**: Vitest (frontend), pytest (backend)

## Google Form Field Mapping

| Form Field | Database Column | Notes |
|------------|-----------------|-------|
| Email | `organizer_email` | Required, @columbia.edu validation |
| Name | `organizer_name` | Optional (if empty, don't display) |
| Study Group Subject | `subject` | Dropdown + "Other" option |
| If Other, enter subject | `subject` | Override if "Other" selected |
| Professor Name | `professor_name` | Optional |
| Date | `start_time` (date part) | Required |
| Location | `location` | Required |
| Start Time | `start_time` (time part) | Required |
| End Time | `end_time` | Required |
| Student Limit | `student_limit` | Optional |

## Key Decisions

- **Authentication**: Magic link auth for organizers (email-based, no password)
- **Timezones**: Store UTC, display in user's local timezone
- **Real-time**: Supabase real-time subscriptions enabled
- **Duplicate Groups**: Warn via email, but allow duplicates
- **Anonymous Organizers**: If no name provided, just show date/time (no "Anonymous" label)
- **Branding**: Generic Columbia (not SEAS-specific)
- **Join Flow**: When a user joins a group (or tries to join one they've already joined), redirect to a dedicated group page showing all participants
- **Participant Visibility**: Organizers and participants can see other participants' names/emails; everyone else sees only counts
- **Leave Group**: Participants can leave a group from the group page; this removes them from the participant list
- **Email Notifications**: Send confirmation emails when a user joins or leaves a group
- **Organizer Redirect**: Logged-in organizers are automatically redirected from homepage to dashboard
- **Columbia-only Access**: Only @columbia.edu and @barnard.edu emails can join groups or log in
- **Direct Group Creation**: Logged-in organizers can create study groups directly from the dashboard (same fields as Google Form)

---

## Implementation Phases

### Phase 1: Local Project Setup & Database Schema

**Tasks:**
1. Initialize project structure with uv
2. Install Supabase CLI (`brew install supabase/tap/supabase`)
3. Create Supabase project (web console)
4. Write database migrations:
   - `001_initial_schema.sql` - study_groups, participants tables
   - `002_rls_policies.sql` - Row Level Security
   - `003_functions_triggers.sql` - compute_expires_at, participant counting
5. Write tests for schema validation

**Deliverables:**
- `/supabase/migrations/001_initial_schema.sql`
- `/supabase/migrations/002_rls_policies.sql`
- `/supabase/migrations/003_functions_triggers.sql`
- `/supabase/config.toml`

**Dependencies:** None

---

### Phase 2: Organizer Authentication

**Tasks:**
1. Design magic link auth flow (email-based, no password)
2. Add `auth.users` integration for organizers
3. Update RLS to allow organizers to delete their own groups
4. Create auth Edge Function for organizer verification
5. Write tests for auth flow

**Deliverables:**
- Updated migrations for auth integration
- `/supabase/functions/verify-organizer/`

**Dependencies:** Phase 1

---

### Phase 3: Google Apps Script Webhook

**Tasks:**
1. Write Apps Script code to POST form submissions to Supabase
2. Handle subject dropdown + "Other" field logic
3. Combine Date + Start Time into `start_time` timestamp
4. Combine Date + End Time into `end_time` timestamp
5. Add duplicate detection (query existing groups, send warning email if similar exists)
6. Handle authentication (service role key)
7. Test webhook with mock data

**Deliverables:**
- `/google-apps-script/webhook.gs`
- `/google-apps-script/README.md` (setup instructions)

**Dependencies:** Phase 1

---

### Phase 4: Email Notifications (Resend)

**Tasks:**
1. Create Resend account, get API key
2. Write Edge Function: `send-join-confirmation` (to student joining)
3. Write Edge Function: `send-organizer-notification` (to group organizer)
4. Write Edge Function: `send-duplicate-warning` (when creating similar group)
5. Design email templates (plain HTML, Columbia blue #003366)
6. Write tests for email functions

**Deliverables:**
- `/supabase/functions/send-join-confirmation/`
- `/supabase/functions/send-organizer-notification/`
- `/supabase/functions/send-duplicate-warning/`

**Dependencies:** Phase 1, Phase 2

---

### Phase 5: Cleanup Scheduled Function

**Tasks:**
1. Write cleanup Edge Function
2. Configure pg_cron or Supabase cron for hourly execution
3. Logic:
   - Delete groups where `expires_at < now()` AND participant_count = 0
   - Delete groups where `end_time < now()`
4. Write tests

**Deliverables:**
- `/supabase/functions/cleanup-expired-groups/`
- Cron configuration

**Dependencies:** Phase 1

---

### Phase 6: Frontend Setup & Core Components

**Tasks:**
1. Initialize Vite + React + TypeScript project
2. Configure Vitest for testing
3. Set up Supabase client with TypeScript types (generated from schema)
4. Implement timezone handling (store UTC, display local)
5. Create base components:
   - `StudyGroupCard.tsx` - displays group info, participant count, join button
   - `SearchBar.tsx` - debounced search across subject/professor/location
6. Write component tests

**Deliverables:**
- `/frontend/` project structure
- `/frontend/src/lib/supabase.ts`
- `/frontend/src/lib/timezone.ts`
- `/frontend/src/components/StudyGroupCard.tsx`
- `/frontend/src/components/SearchBar.tsx`
- Component tests

**Dependencies:** Phase 1

---

### Phase 7: Join Flow & Real-time

**Tasks:**
1. Create `JoinModal.tsx` component
2. Email validation (@columbia.edu)
3. Duplicate join prevention (unique constraint on study_group_id + email)
4. Set up Supabase real-time subscriptions
5. Live participant count updates without page refresh
6. Write tests

**Deliverables:**
- `/frontend/src/components/JoinModal.tsx`
- `/frontend/src/hooks/useRealtimeParticipants.ts`
- Integration tests

**Dependencies:** Phase 6

---

### Phase 8: Organizer Dashboard

**Tasks:**
1. Create organizer login page (magic link)
2. Create "My Groups" view showing organizer's study groups
3. Add delete functionality for own groups only
4. Show full participant list (with emails) for organizers
5. Write tests

**Deliverables:**
- `/frontend/src/pages/OrganizerDashboard.tsx`
- `/frontend/src/components/OrganizerGroupCard.tsx`
- `/frontend/src/contexts/AuthContext.tsx`
- Auth hooks

**Dependencies:** Phase 2, Phase 6

---

### Phase 9: HomePage & Styling

**Tasks:**
1. Create HomePage with responsive grid of study groups
2. Implement mobile-first responsive layout
3. Apply Columbia styling (#003366 blue, clean minimal design)
4. Google Maps links for locations (Columbia campus search)
5. Handle display when organizer_name is null (just show date/time)
6. Time format: "3:00 PM – 5:00 PM"
7. E2E tests

**Deliverables:**
- `/frontend/src/pages/HomePage.tsx`
- `/frontend/src/styles/` or CSS-in-JS
- E2E tests

**Dependencies:** Phase 6, Phase 7

---

### Phase 10: Deployment & Documentation

**Tasks:**
1. Deploy Supabase migrations to production
2. Deploy Edge Functions
3. Build and deploy frontend to Supabase Hosting
4. Configure environment variables in production
5. Set up Google Apps Script trigger on form submission
6. Write README with:
   - Architecture diagram
   - Setup instructions for each component
   - Environment variable configuration
   - Deployment steps
   - Maintenance/troubleshooting guide

**Deliverables:**
- Production deployment
- `/README.md`
- `/.env.example`

**Dependencies:** All previous phases

---

## Environment Variables

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
WEBHOOK_SECRET=  # optional, for additional webhook security
```

---

## Database Schema Summary

### study_groups
- `id` (uuid, PK)
- `subject` (text, required)
- `professor_name` (text, nullable)
- `location` (text, required)
- `start_time` (timestamptz, required)
- `end_time` (timestamptz, required)
- `student_limit` (integer, nullable)
- `organizer_name` (text, nullable)
- `organizer_email` (text, required, @columbia.edu)
- `created_at` (timestamptz, default now())
- `expires_at` (timestamptz, computed: min(created_at + 24h, end_time))

### participants
- `id` (uuid, PK)
- `study_group_id` (uuid, FK → study_groups, CASCADE delete)
- `name` (text, required)
- `email` (text, required, @columbia.edu)
- `joined_at` (timestamptz, default now())
- Unique constraint: (study_group_id, email)

---

## RLS Policies Summary

### study_groups
- SELECT: Public (anyone can view)
- INSERT: Authenticated users with @columbia.edu or @barnard.edu email (must match organizer_email), OR service role (for Google Form webhook)
- DELETE: Organizer only (authenticated, email matches organizer_email)
- UPDATE: Organizer only (authenticated, email matches organizer_email)

### participants
- SELECT: Public for names only; organizers can see emails for their groups
- INSERT: Public (with @columbia.edu or @barnard.edu email validation)
- DELETE: Cascade from study_groups

---

## Implementation Status

All phases completed:

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | Complete | Database schema, migrations, RLS policies |
| 2 | Complete | Organizer authentication helper functions |
| 3 | Complete | Google Apps Script webhook |
| 4 | Complete | Email notifications (Gmail SMTP) |
| 5 | Complete | Cleanup scheduled function (pg_cron) |
| 6 | Complete | Frontend setup (React, Vite, TypeScript) |
| 7 | Complete | Join flow with real-time subscriptions |
| 8 | Complete | Organizer dashboard with magic link auth |
| 9 | Complete | HomePage, routing, global styles |
| 10 | Complete | Build verification, documentation |

### Test Coverage

- **Backend (pytest)**: 29 tests
- **Frontend (vitest)**: 156 tests
- **Total**: 185 tests passing

### Key Files

**Frontend**:
- `frontend/src/pages/HomePage.tsx` - Main study group listing
- `frontend/src/pages/DashboardPage.tsx` - Organizer login/dashboard
- `frontend/src/pages/GroupPage.tsx` - Dedicated group view with participant list
- `frontend/src/components/OrganizerDashboard.tsx` - Dashboard with group management and create form
- `frontend/src/components/CreateStudyGroupForm.tsx` - Form for creating new study groups
- `frontend/src/components/` - Reusable UI components
- `frontend/src/hooks/useStudyGroups.ts` - Real-time data fetching
- `frontend/src/hooks/useOrganizerGroups.ts` - Organizer's groups with CRUD operations
- `frontend/src/contexts/AuthContext.tsx` - Magic link authentication
- `frontend/src/contexts/UserEmailContext.tsx` - Persists user email after joining
- `frontend/src/lib/database.types.ts` - TypeScript types for Supabase schema

**Backend**:
- `supabase/migrations/` - Database schema and RLS policies
- `supabase/migrations/20260117000006_restrict_email_domains.sql` - Columbia/Barnard email constraints
- `supabase/migrations/20260117000007_participant_visibility.sql` - Functions for participant visibility
- `supabase/functions/on-participant-joined/` - Email notifications on join
- `supabase/functions/send-join-confirmation/` - Join confirmation email
- `supabase/functions/send-organizer-notification/` - Organizer notification email
- `google-apps-script/webhook.gs` - Form submission handler

### Database Functions

- `get_participant_count(p_study_group_id)` - Returns participant count for a group
- `is_study_group_full(p_study_group_id)` - Returns true if group is at capacity
- `is_group_member(p_study_group_id, p_email)` - Checks if email is organizer or participant
- `get_group_participants_if_member(p_study_group_id, p_requester_email)` - Returns participant details only if requester is a member

### Deployment

- **Frontend**: Vercel (auto-deploys from main branch)
- **Backend**: Supabase (migrations via CLI, Edge Functions via GitHub Actions)
- **Live URL**: https://cu-study-groups.vercel.app/
