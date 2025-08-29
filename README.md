# FORKCAST-AI

AI-powered food rescue assistant built with Next.js 14 (App Router).

## Getting Started

1. Install dependencies

```
pnpm install
```

2. Add environment variables

Create `.env.local` at the project root:

```
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://postgres:password@db.host:5432/postgres
```

3. Run the dev server

```
pnpm dev
```

Open http://localhost:3000

## Deployment

- Set `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your hosting provider (e.g., Vercel → Project → Settings → Environment Variables)
 - Set `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` in your hosting provider (e.g., Vercel → Project → Settings → Environment Variables)
- Redeploy to apply changes

## Tech
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Notes
- The chat API gracefully handles upstream errors and missing configuration, returning friendly messages to users instead of server errors.
