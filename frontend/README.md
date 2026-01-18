# CU Study Groups - Frontend

React frontend for the Columbia University Study Groups application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your Supabase credentials:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Testing

Run tests:
```bash
npm test        # Watch mode
npm run test:run  # Single run
```

## Building

Build for production:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### Supabase Hosting

1. Install Supabase CLI if not already installed
2. Link your project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
3. Deploy:
   ```bash
   npm run build
   npx supabase deploy --local
   ```

### Other Hosting (Vercel, Netlify, etc.)

1. Build the project: `npm run build`
2. Deploy the `dist/` directory
3. Set environment variables in your hosting provider's dashboard

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Supabase (database, auth, real-time)
- Vitest + Testing Library

## Project Structure

```
src/
  components/     # Reusable UI components
  contexts/       # React contexts (Auth)
  hooks/          # Custom React hooks
  lib/            # Utilities and Supabase client
  pages/          # Page components
  test/           # Test setup
```
