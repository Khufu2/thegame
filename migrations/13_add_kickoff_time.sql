-- Add kickoff_time column to matches table for API compatibility
-- This column is used by the new Football-Data.org and TheSportsDB integrations

ALTER TABLE IF EXISTS public.matches
  ADD COLUMN IF NOT EXISTS kickoff_time timestamptz;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_matches_kickoff_time ON public.matches(kickoff_time);

-- Add comment for documentation
COMMENT ON COLUMN public.matches.kickoff_time IS 'Match kickoff time (UTC) - used by Football-Data.org and TheSportsDB APIs';