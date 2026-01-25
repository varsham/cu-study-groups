# CU Study Groups

A web application for Columbia University students to create, discover, and join study groups.

## Features

- **Browse Study Groups**: View all available study groups with search and filter
- **Join Groups**: Columbia students can join groups with their @columbia.edu or @barnard.edu email
- **Create Groups**: Log in and create study groups directly from the dashboard (no Google Form required)
- **Organizer Dashboard**: Manage your study groups, create new ones, and view participants
- **Real-time Updates**: See new groups and participants instantly
- **Email Notifications**: Get notified when someone joins your group
- **Automatic Cleanup**: Expired groups are automatically removed

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Google Form   │────▶│  Apps Script    │────▶│    Supabase     │
│   (Optional)    │     │  (Webhook)      │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌─────────────────┐              │
                        │  React Frontend │◀────────────▶│
                        │ (Browse/Create/ │              │
                        │     Join)       │              │
                        └─────────────────┘

Students can create groups directly from the dashboard after logging in,
or optionally use the Google Form which syncs via webhook.
```

## Project Structure

```
cu_study_group/
├── frontend/           # React + TypeScript frontend
├── supabase/
│   ├── migrations/     # Database schema migrations
│   └── functions/      # Edge functions (email notifications)
├── google-apps-script/ # Webhook for Google Form submissions
├── tests/              # Backend Python tests
└── CLAUDE.md           # Implementation guide
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+ with uv
- Supabase account
- Google account (for Apps Script)

### 1. Database Setup

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login and link project
npx supabase login
npx supabase link --project-ref your-project-ref

# Deploy migrations
npx supabase db push
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

### 3. Google Apps Script Setup (Optional)

The Google Form integration is optional. Students can create groups directly from the dashboard after logging in.

If you want to also support Google Form submissions:

1. Create a new Google Apps Script project
2. Copy contents from `google-apps-script/webhook.gs`
3. Run `setScriptProperties()` with your Supabase credentials
4. Create a trigger for `onFormSubmit`

See `google-apps-script/README.md` for detailed instructions.

### 4. Email Notifications

There are two email configurations needed:

#### A. Edge Functions (Join Notifications, Reminders)

Configure Gmail SMTP in Supabase Edge Function secrets:
```bash
npx supabase secrets set GMAIL_USER=your-email@gmail.com
npx supabase secrets set GMAIL_APP_PASSWORD=your-app-password
```

#### B. Email Templates

Create email templates in Supabase Edge Functions:
```bash
npx supabase functions new join-notification
npx supabase functions new reminder
```

#### C. Configure Auth Redirect URLs

Magic links need to know your production URL to redirect correctly (otherwise they'll go to localhost):

1. Go to **https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/url-configuration**

2. Set the following:

| Setting | Value |
|---------|-------|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/**` |

3. Click **Save**

The **Site URL** is the default redirect destination. The **Redirect URLs** whitelist allows the app to redirect to specific pages like `/dashboard` after authentication.

**Troubleshooting "Magic link goes to localhost"**:
- Ensure Site URL is set to your production URL (not `http://localhost:3000`)
- Add a wildcard redirect URL (`https://your-app.vercel.app/**`) to allow deep links
- Request a new magic link after saving changes (old links use the old URL)

## Deployment

### Automated Deployment (Recommended)

This project uses **Vercel** for frontend hosting and **GitHub Actions** for Supabase.

#### Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Import Project" and select `varsham/cu-study-groups`
3. Vercel will auto-detect settings from `vercel.json`
4. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
5. Click "Deploy"

Every push to `main` will auto-deploy. PRs get preview deployments.

#### Backend (GitHub Actions)

1. Go to your repo Settings → Secrets and variables → Actions
2. Add these secrets:
   - `SUPABASE_PROJECT_REF`: `qmosxdzmvzfusgxhditg`
   - `SUPABASE_ACCESS_TOKEN`: Get from [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

Changes to `supabase/` folder will auto-deploy migrations and Edge Functions.

## Development

### Run Tests

```bash
# Backend tests
uv run pytest tests/ -v

# Frontend tests
cd frontend && npm test
```

### Build Frontend

```bash
cd frontend && npm run build
```

## Environment Variables

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Supabase Edge Functions

| Secret | Description |
|--------|-------------|
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | Gmail app password |

### Google Apps Script

| Property | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **Testing**: Vitest, Testing Library, pytest
- **Email**: Gmail SMTP via Edge Functions
- **Form**: Built-in dashboard form (Google Forms + Apps Script optional)

## License

MIT
