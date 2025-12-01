-- Row Level Security (RLS) policies for Sheena Sports
-- NOTE: The Supabase service_role key bypasses RLS entirely. Any server-side operations using
-- the service role key will not be restricted by these policies.

-- Enable RLS on tables where necessary
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timeline ENABLE ROW LEVEL SECURITY;

-- MESSAGES: allow anyone to SELECT
CREATE POLICY IF NOT EXISTS "messages_select_public" ON public.messages
  FOR SELECT USING (true);

-- MESSAGES: allow authenticated users to INSERT where auth.uid() matches user_id
CREATE POLICY IF NOT EXISTS "messages_insert_owner_only" ON public.messages
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- BETS: allow authenticated users to INSERT their own bets only
CREATE POLICY IF NOT EXISTS "bets_insert_owner_only" ON public.bets
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- BETS: allow users to SELECT their own bets
CREATE POLICY IF NOT EXISTS "bets_select_owner_only" ON public.bets
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- FEEDS: allow public SELECT (articles are public)
CREATE POLICY IF NOT EXISTS "feeds_select_public" ON public.feeds
  FOR SELECT USING (true);

-- FEEDS: allow INSERT only if author_id matches auth.uid()
CREATE POLICY IF NOT EXISTS "feeds_insert_author_only" ON public.feeds
  FOR INSERT WITH CHECK (auth.uid()::uuid = author_id);

-- TIMELINE: allow public SELECT for match feeds (read-only)
CREATE POLICY IF NOT EXISTS "timeline_select_public" ON public.timeline
  FOR SELECT USING (true);

-- Helpful note: service role calls bypass these policies; use server endpoints for admin actions
-- such as settling bets, publishing as system, or mass updates.
