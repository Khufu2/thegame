-- Add feeds table (for news articles and content)
CREATE TABLE IF NOT EXISTS public.feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  source text,
  type text DEFAULT 'news', -- 'news', 'alert', 'update'
  sentiment text, -- 'positive', 'neutral', 'negative'
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure type column exists (defensive - in case partial table creation happened)
ALTER TABLE IF EXISTS public.feeds ADD COLUMN IF NOT EXISTS type text DEFAULT 'news';

-- Add odds table (for storing odds from different bookmakers)
CREATE TABLE IF NOT EXISTS public.odds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text REFERENCES public.matches(id) ON DELETE CASCADE,
  bookmaker text NOT NULL, -- 'bet365', 'william_hill', 'theodds_api', etc.
  odds_home numeric NOT NULL,
  odds_draw numeric,
  odds_away numeric NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feeds_created_at ON public.feeds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feeds_type ON public.feeds("type");
CREATE INDEX IF NOT EXISTS idx_odds_match_id ON public.odds(match_id);
CREATE INDEX IF NOT EXISTS idx_odds_bookmaker ON public.odds(bookmaker);
CREATE INDEX IF NOT EXISTS idx_odds_fetched_at ON public.odds(fetched_at DESC);
