# CU Study Groups

A web application for Columbia University students to create, discover, and join study groups.

## Features

- **Browse Study Groups**: View all available study groups with search and filter
- **Join Groups**: Columbia students can join groups with their @columbia.edu email
- **Create Groups**: Submit new study groups via Google Form
- **Organizer Dashboard**: Manage your study groups and view participants
- **Real-time Updates**: See new groups and participants instantly
- **Email Notifications**: Get notified when someone joins your group
- **Automatic Cleanup**: Expired groups are automatically removed

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Google Form   │────▶│  Apps Script    │────▶│    Supabase     │
│   (Create)      │     │  (Webhook)      │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌─────────────────┐              │
                        │  React Frontend │◀─────────────┘
                        │  (Browse/Join)  │
                        └─────────────────┘
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

### 3. Google Apps Script Setup

1. Create a new Google Apps Script project
2. Copy contents from `google-apps-script/webhook.gs`
3. Run `setScriptProperties()` with your Supabase credentials
4. Create a trigger for `onFormSubmit`

See `google-apps-script/README.md` for detailed instructions.

### 4. Email Notifications

Configure Gmail SMTP in Supabase Edge Function secrets:
```bash
npx supabase secrets set GMAIL_USER=your-email@columbia.edu
npx supabase secrets set GMAIL_APP_PASSWORD=your-app-password
```

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
- **Form**: Google Forms + Apps Script

## License

MIT
