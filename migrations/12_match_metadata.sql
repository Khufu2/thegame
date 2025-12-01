-- Extend matches table with richer metadata for API-Football integrations
ALTER TABLE IF EXISTS public.matches
  ADD COLUMN IF NOT EXISTS fixture_id bigint,
  ADD COLUMN IF NOT EXISTS league_id integer,
  ADD COLUMN IF NOT EXISTS season integer,
  ADD COLUMN IF NOT EXISTS home_team_id integer,
  ADD COLUMN IF NOT EXISTS away_team_id integer,
  ADD COLUMN IF NOT EXISTS home_team_logo text,
  ADD COLUMN IF NOT EXISTS away_team_logo text,
  ADD COLUMN IF NOT EXISTS venue_id integer,
  ADD COLUMN IF NOT EXISTS venue_name text,
  ADD COLUMN IF NOT EXISTS venue_city text,
  ADD COLUMN IF NOT EXISTS venue_country text,
  ADD COLUMN IF NOT EXISTS venue_lat numeric,
  ADD COLUMN IF NOT EXISTS venue_lng numeric,
  ADD COLUMN IF NOT EXISTS odds_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS odds_source text,
  ADD COLUMN IF NOT EXISTS weather_last_checked timestamptz;

-- Ensure fixture IDs remain unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_fixture_id ON public.matches(fixture_id) WHERE fixture_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON public.matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff_time ON public.matches(kickoff_time);

-- Weather snapshots per match
CREATE TABLE IF NOT EXISTS public.match_weather (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text REFERENCES public.matches(id) ON DELETE CASCADE,
  fixture_id bigint,
  temperature numeric,
  humidity numeric,
  wind_speed numeric,
  conditions text,
  icon text,
  source text DEFAULT 'openweather',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_weather_match_id ON public.match_weather(match_id);
CREATE INDEX IF NOT EXISTS idx_match_weather_fixture_id ON public.match_weather(fixture_id);


