# Running My Finance

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key (Supabase dashboard, Project settings, API).
3. Apply `supabase/migrations/*.sql` in order (already applied to the `my-finance` project).
4. `npm run dev`, open http://localhost:3000, create an account, set up your household, then use **Import** to upload a PTSB CSV.
5. Receipt reading needs `ANTHROPIC_API_KEY` in `.env.local` (server only).

Tests: `npm test`. Checks: `npm run lint && npm run build`.

## Notes
- Tax figures live in `lib/tax/config.ts`, one entry per tax year.
- Supabase email confirmation: if it is on, new sign-ups must click the emailed link before signing in.
- If you run this in a sandbox with an HTTP proxy, start the server with `NODE_USE_ENV_PROXY=1` so server-side calls reach Supabase.
