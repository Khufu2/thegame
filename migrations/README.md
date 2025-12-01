# Migrations

This folder contains SQL migrations for the Sheena Sports backend (Supabase/Postgres).

Guidance
- Use the Supabase SQL editor (Dashboard → SQL) to run migrations, or use `psql` / the Supabase CLI if you prefer.
- Always create a backup before running destructive commands.

Files
- `01_init.sql` — initial schema: extensions, core tables (users, matches, timeline, bets, feeds, channels, messages, leagues, standings) and basic indexes.

How to run (PowerShell examples)

1) Using psql (requires PG connection string):

```powershell
# export connection string (replace placeholders)
$env:PGCONN = 'postgres://postgres:YOUR_PASSWORD@db.host.supabase.co:5432/postgres'
psql $env:PGCONN -f migrations/01_init.sql
```

2) Using Supabase SQL editor
- Open Supabase Dashboard → SQL Editor, paste the contents of `01_init.sql` and run.

Next steps
- After running these migrations, I'll add recommended Row Level Security (RLS) policy scripts in a follow-up migration.
