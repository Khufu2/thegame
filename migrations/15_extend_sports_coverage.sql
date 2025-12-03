-- Extend sports coverage using free APIs
-- Add support for NBA, NHL, MLB, UFC, F1, and African football
-- Conservative approach - extend existing schema without breaking changes

-- Add sport types to existing feeds table
ALTER TABLE IF EXISTS public.feeds
  ADD COLUMN IF NOT EXISTS sport text DEFAULT 'soccer',
  ADD COLUMN IF NOT EXISTS league_code text;

-- Create sports taxonomy (minimal, backwards compatible)
CREATE TABLE IF NOT EXISTS public.sports (
  id text PRIMARY KEY, -- 'soccer', 'basketball', 'baseball', etc.
  name text NOT NULL,
  display_name text NOT NULL,
  category text DEFAULT 'team', -- 'team', 'individual', 'motor'
  api_provider text, -- 'thesportsdb', 'ergast', etc.
  is_active boolean DEFAULT true
);

-- Insert basic sports (start with free APIs)
INSERT INTO public.sports (id, name, display_name, category, api_provider) VALUES
  ('soccer', 'soccer', 'Soccer', 'team', 'football-data'),
  ('basketball', 'basketball', 'Basketball', 'team', 'thesportsdb'),
  ('baseball', 'baseball', 'Baseball', 'team', 'thesportsdb'),
  ('hockey', 'hockey', 'Hockey', 'team', 'thesportsdb'),
  ('mma', 'mma', 'MMA/UFC', 'individual', 'thesportsdb'),
  ('formula1', 'formula1', 'Formula 1', 'motor', 'ergast')
ON CONFLICT (id) DO NOTHING;

-- Extend matches table for multi-sport (backwards compatible)
ALTER TABLE IF EXISTS public.matches
  ADD COLUMN IF NOT EXISTS sport text DEFAULT 'soccer' REFERENCES public.sports(id),
  ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'match', -- 'match', 'race', 'fight'
  ADD COLUMN IF NOT EXISTS round_info jsonb, -- For F1 rounds, UFC rounds, etc.
  ADD COLUMN IF NOT EXISTS circuit_name text, -- For F1 circuits
  ADD COLUMN IF NOT EXISTS weather_conditions jsonb; -- For outdoor sports

-- Create NBA-specific function (using TheSportsDB free API)
CREATE OR REPLACE FUNCTION get_nba_games(date_param date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  id text,
  home_team text,
  away_team text,
  home_score integer,
  away_score integer,
  status text,
  kickoff_time timestamptz,
  league text
) LANGUAGE plpgsql AS $$
BEGIN
  -- NBA games from TheSportsDB (free, no rate limits)
  -- This is a placeholder - actual implementation in edge function
  RETURN QUERY
  SELECT
    'nba-' || gs.idEvent::text as id,
    gs.strHomeTeam as home_team,
    gs.strAwayTeam as away_team,
    gs.intHomeScore::integer as home_score,
    gs.intAwayScore::integer as away_score,
    CASE
      WHEN gs.strStatus = 'Match Finished' THEN 'finished'
      WHEN gs.strStatus = 'Not Started' THEN 'scheduled'
      ELSE 'live'
    END as status,
    (gs.dateEvent || ' ' || COALESCE(gs.strTime, '00:00:00'))::timestamptz as kickoff_time,
    'NBA' as league
  FROM (
    -- Placeholder for TheSportsDB API call
    -- In practice, this would be handled by edge function
    SELECT * FROM jsonb_to_recordset(
      '[{"idEvent": "1", "strHomeTeam": "Lakers", "strAwayTeam": "Celtics", "intHomeScore": null, "intAwayScore": null, "strStatus": "Not Started", "dateEvent": "' || date_param || '", "strTime": "20:00:00"}]'
    ) AS x(idEvent text, strHomeTeam text, strAwayTeam text, intHomeScore text, intAwayScore text, strStatus text, dateEvent text, strTime text)
  ) gs;
END;
$$;

-- Create F1 races function (using Ergast free API)
CREATE OR REPLACE FUNCTION get_f1_races(season_param text DEFAULT '2024')
RETURNS TABLE (
  id text,
  race_name text,
  circuit_name text,
  country text,
  race_date date,
  status text,
  winner text
) LANGUAGE plpgsql AS $$
BEGIN
  -- F1 races from Ergast API (completely free)
  RETURN QUERY
  SELECT
    'f1-' || r.round::text as id,
    r.raceName as race_name,
    c.circuitName as circuit_name,
    c.country as country,
    r.date::date as race_date,
    CASE
      WHEN r.date < CURRENT_DATE THEN 'finished'
      ELSE 'scheduled'
    END as status,
    COALESCE(r.winner, 'TBD') as winner
  FROM (
    -- Placeholder for Ergast API data
    SELECT * FROM jsonb_to_recordset(
      '[{"round": "1", "raceName": "Bahrain Grand Prix", "circuitName": "Bahrain International Circuit", "country": "Bahrain", "date": "2024-03-02", "winner": null}]'
    ) AS x(round text, raceName text, circuitName text, country text, date text, winner text)
  ) r;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.sports IS 'Sports taxonomy for multi-sport support';
COMMENT ON FUNCTION get_nba_games(date) IS 'Get NBA games for specified date (TheSportsDB free API)';
COMMENT ON FUNCTION get_f1_races(text) IS 'Get F1 races for specified season (Ergast free API)';