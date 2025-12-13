-- Create team_stats table for storing comprehensive team performance metrics
CREATE TABLE IF NOT EXISTS team_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    team_id TEXT NOT NULL, -- External API identifier
    league TEXT NOT NULL,
    season TEXT NOT NULL DEFAULT '2024',

    -- Current season statistics
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,

    -- Advanced metrics
    win_percentage DECIMAL(5,2) DEFAULT 0.00,
    average_goals_scored DECIMAL(4,2) DEFAULT 0.00,
    average_goals_conceded DECIMAL(4,2) DEFAULT 0.00,
    clean_sheets INTEGER DEFAULT 0,
    failed_to_score INTEGER DEFAULT 0,

    -- Home/Away performance
    home_wins INTEGER DEFAULT 0,
    home_draws INTEGER DEFAULT 0,
    home_losses INTEGER DEFAULT 0,
    home_goals_for INTEGER DEFAULT 0,
    home_goals_against INTEGER DEFAULT 0,
    away_wins INTEGER DEFAULT 0,
    away_draws INTEGER DEFAULT 0,
    away_losses INTEGER DEFAULT 0,
    away_goals_for INTEGER DEFAULT 0,
    away_goals_against INTEGER DEFAULT 0,

    -- Recent form (last 5 matches)
    recent_form TEXT, -- e.g., "W-D-W-L-W"
    recent_goals_for INTEGER DEFAULT 0,
    recent_goals_against INTEGER DEFAULT 0,
    recent_points INTEGER DEFAULT 0,

    -- Elo rating for strength assessment
    elo_rating DECIMAL(6,2) DEFAULT 1500.00,

    -- Additional data
    injuries_count INTEGER DEFAULT 0,
    suspensions_count INTEGER DEFAULT 0,
    average_possession DECIMAL(5,2),
    shots_on_target_pg DECIMAL(4,2), -- Shots on target per game
    shots_pg DECIMAL(4,2), -- Total shots per game

    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source TEXT DEFAULT 'api-football',

    -- Constraints
    UNIQUE(team_name, league, season)
);

-- Create indexes (separate statements)
CREATE INDEX IF NOT EXISTS idx_team_stats_team_name ON team_stats (team_name);
CREATE INDEX IF NOT EXISTS idx_team_stats_league ON team_stats (league);
CREATE INDEX IF NOT EXISTS idx_team_stats_season ON team_stats (season);
CREATE INDEX IF NOT EXISTS idx_team_stats_elo_rating ON team_stats (elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_team_stats_last_updated ON team_stats (last_updated);

-- Enable Row Level Security
ALTER TABLE team_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view team stats" ON team_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage team stats" ON team_stats
  FOR ALL
  TO authenticated
  USING ( (auth.jwt() ->> 'role') = 'admin' )
  WITH CHECK ( (auth.jwt() ->> 'role') = 'admin' );