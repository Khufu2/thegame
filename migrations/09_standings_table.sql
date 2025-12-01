-- Add standings table for league rankings history
CREATE TABLE IF NOT EXISTS public.standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id integer,
  standings_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Ensure created_at column exists (in case table exists without it)
ALTER TABLE IF EXISTS public.standings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Create index for standings queries
CREATE INDEX IF NOT EXISTS idx_standings_league_id ON public.standings(league_id);
CREATE INDEX IF NOT EXISTS idx_standings_created_at ON public.standings(created_at DESC);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.standings TO service_role;
