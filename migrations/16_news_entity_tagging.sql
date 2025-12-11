-- Add entity tagging and content categorization for news articles
-- Enables associating news with teams, leagues, players, and content types

-- Create news_entities table for linking news to sports entities
CREATE TABLE IF NOT EXISTS public.news_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid REFERENCES public.feeds(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('team', 'league', 'player')),
  entity_id text NOT NULL, -- Team ID, League code, or Player ID
  entity_name text NOT NULL, -- Display name
  confidence numeric(3,2) DEFAULT 1.0, -- AI confidence score 0.0-1.0
  created_at timestamptz DEFAULT now()
);

-- Create news_content_tags table for content categorization
CREATE TABLE IF NOT EXISTS public.news_content_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid REFERENCES public.feeds(id) ON DELETE CASCADE NOT NULL,
  tag_type text NOT NULL CHECK (tag_type IN ('category', 'sentiment', 'topic')),
  tag_value text NOT NULL, -- 'transfer', 'hype', 'injury', 'positive', 'rumor', etc.
  confidence numeric(3,2) DEFAULT 1.0, -- AI confidence score 0.0-1.0
  created_at timestamptz DEFAULT now()
);

-- Create news_shares table for tracking shares (optional analytics)
CREATE TABLE IF NOT EXISTS public.news_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid REFERENCES public.feeds(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  share_method text DEFAULT 'web', -- 'web', 'native', 'copy'
  shared_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_entities_feed_id ON public.news_entities(feed_id);
CREATE INDEX IF NOT EXISTS idx_news_entities_entity_type ON public.news_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_news_entities_entity_id ON public.news_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_news_content_tags_feed_id ON public.news_content_tags(feed_id);
CREATE INDEX IF NOT EXISTS idx_news_content_tags_type ON public.news_content_tags(tag_type);
CREATE INDEX IF NOT EXISTS idx_news_shares_feed_id ON public.news_shares(feed_id);
CREATE INDEX IF NOT EXISTS idx_news_shares_user_id ON public.news_shares(user_id);

-- Enable RLS
ALTER TABLE public.news_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read access for all, write for authenticated)
CREATE POLICY "Anyone can read news entities" ON public.news_entities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create news entities" ON public.news_entities FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read news content tags" ON public.news_content_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create news content tags" ON public.news_content_tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read news shares" ON public.news_shares FOR SELECT USING (true);
CREATE POLICY "Users can create their own shares" ON public.news_shares FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Extend feeds table with additional metadata
ALTER TABLE public.feeds
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS word_count integer,
  ADD COLUMN IF NOT EXISTS reading_time_minutes integer,
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS excerpt text;

-- Comments for documentation
COMMENT ON TABLE public.news_entities IS 'Links news articles to sports entities (teams, leagues, players)';
COMMENT ON TABLE public.news_content_tags IS 'Content categorization and topic tags for news articles';
COMMENT ON TABLE public.news_shares IS 'Tracks sharing activity for analytics';
COMMENT ON COLUMN public.news_entities.confidence IS 'AI confidence score for entity recognition (0.0-1.0)';
COMMENT ON COLUMN public.news_content_tags.confidence IS 'AI confidence score for tag classification (0.0-1.0)';