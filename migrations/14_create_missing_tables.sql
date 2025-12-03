-- Create missing tables for production-grade implementation
-- These tables support the edge functions: leaderboard, alerts, and enhanced feeds

-- LEADERBOARD TABLE
-- Tracks user rankings and statistics
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  total_bets integer DEFAULT 0,
  total_wins integer DEFAULT 0,
  total_losses integer DEFAULT 0,
  win_rate numeric DEFAULT 0,
  total_stake numeric DEFAULT 0,
  total_payout numeric DEFAULT 0,
  profit_loss numeric DEFAULT 0,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  rank integer,
  last_updated timestamptz DEFAULT now()
);

-- Create indexes for leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_profit_loss ON public.leaderboard(profit_loss DESC);

-- ALERTS TABLE
-- System notifications and alerts for users
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'match_start', 'odds_change', 'bet_result', 'system'
  title text NOT NULL,
  message text NOT NULL,
  data jsonb, -- Additional alert data
  is_read boolean DEFAULT false,
  priority text DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON public.alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);

-- ENHANCE FEEDS TABLE
-- Add missing columns to feeds table for better news management
ALTER TABLE IF EXISTS public.feeds
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'news',
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create additional indexes for feeds
CREATE INDEX IF NOT EXISTS idx_feeds_type ON public.feeds(type);
CREATE INDEX IF NOT EXISTS idx_feeds_published_at ON public.feeds(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feeds_is_featured ON public.feeds(is_featured) WHERE is_featured = true;

-- LEADERBOARD REFRESH FUNCTION
-- Function to update leaderboard data
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clear existing leaderboard
  DELETE FROM public.leaderboard;

  -- Insert updated leaderboard data
  INSERT INTO public.leaderboard (
    user_id,
    display_name,
    total_bets,
    total_wins,
    total_losses,
    win_rate,
    total_stake,
    total_payout,
    profit_loss,
    rank
  )
  SELECT
    u.id,
    u.display_name,
    COALESCE(stats.total_bets, 0) as total_bets,
    COALESCE(stats.total_wins, 0) as total_wins,
    COALESCE(stats.total_losses, 0) as total_losses,
    CASE
      WHEN COALESCE(stats.total_bets, 0) > 0
      THEN (COALESCE(stats.total_wins, 0)::numeric / COALESCE(stats.total_bets, 0)::numeric) * 100
      ELSE 0
    END as win_rate,
    COALESCE(stats.total_stake, 0) as total_stake,
    COALESCE(stats.total_payout, 0) as total_payout,
    COALESCE(stats.profit_loss, 0) as profit_loss,
    null as rank  -- Will be calculated below
  FROM public.users u
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) as total_bets,
      COUNT(*) FILTER (WHERE status = 'WON') as total_wins,
      COUNT(*) FILTER (WHERE status = 'LOST') as total_losses,
      SUM(stake) as total_stake,
      SUM(payout) as total_payout,
      SUM(payout - stake) as profit_loss
    FROM public.bets
    WHERE status IN ('WON', 'LOST')
    GROUP BY user_id
  ) stats ON u.id = stats.user_id;

  -- Update ranks
  UPDATE public.leaderboard
  SET rank = ranked.rank
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY profit_loss DESC, total_bets DESC) as rank
    FROM public.leaderboard
  ) ranked
  WHERE leaderboard.id = ranked.id;

  -- Update last_updated
  UPDATE public.leaderboard
  SET last_updated = now();
END;
$$;

-- Row Level Security Policies
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Leaderboard policies
CREATE POLICY "Users can view leaderboard" ON public.leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage leaderboard" ON public.leaderboard
  FOR ALL USING (auth.role() = 'service_role');

-- Alerts policies
CREATE POLICY "Users can view their own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage alerts" ON public.alerts
  FOR ALL USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE public.leaderboard IS 'User rankings and betting statistics for leaderboard display';
COMMENT ON TABLE public.alerts IS 'System notifications and alerts for users';
COMMENT ON FUNCTION refresh_leaderboard() IS 'Updates leaderboard with latest betting statistics';