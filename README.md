# Readers of Aurangabad

This project is a React + TypeScript + Vite frontend for the Readers of Aurangabad community site.

## Local configuration

Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for live Supabase data access.

If those values are missing or invalid, the app falls back to a non-production demo client and skips live Supabase calls rather than crashing during startup. Protected admin/data operations remain unavailable until valid credentials are configured.
