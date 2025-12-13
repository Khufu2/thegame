-- Create player_stats table for storing comprehensive player performance data
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name TEXT NOT NULL,
    player_id TEXT NOT NULL, -- External API identifier
    team_name TEXT NOT NULL,
    team_id TEXT NOT NULL,
    league TEXT NOT NULL,
    season TEXT NOT NULL DEFAULT '2024',

    -- Player information
    position TEXT, -- GK, DEF, MID, FWD
    age INTEGER,
    nationality TEXT,

    -- Performance statistics
    matches_played INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,

    -- Advanced metrics
    goals_per_90 DECIMAL(4,2) DEFAULT 0.00,
    assists_per_90 DECIMAL(4,2) DEFAULT 0.00,
    shots_on_target INTEGER DEFAULT 0,
    shots_total INTEGER DEFAULT 0,
    shots_on_target_percentage DECIMAL(5,2) DEFAULT 0.00,
    passes_completed INTEGER DEFAULT 0,
    passes_attempted INTEGER DEFAULT 0,
    pass_accuracy DECIMAL(5,2) DEFAULT 0.00,
    tackles_won INTEGER DEFAULT 0,
    tackles_total INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    clearances INTEGER DEFAULT 0,
    dribbles_completed INTEGER DEFAULT 0,
    dribbles_attempted INTEGER DEFAULT 0,
    dribble_success_rate DECIMAL(5,2) DEFAULT 0.00,

    -- Goalkeeper specific (if applicable)
    saves INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,

    -- Recent performance (last 5 matches)
    recent_matches INTEGER DEFAULT 0,
    recent_goals INTEGER DEFAULT 0,
    recent_assists INTEGER DEFAULT 0,
    recent_minutes INTEGER DEFAULT 0,

    -- Injury and availability
    injury_status TEXT DEFAULT 'available', -- available, injured, suspended, doubtful
    injury_type TEXT,
    expected_return DATE,
    suspension_matches_remaining INTEGER DEFAULT 0,

    -- Rating and form
    average_rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 10.00
    form_rating DECIMAL(3,2) DEFAULT 0.00, -- Recent form rating

    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source TEXT DEFAULT 'api-football',

    -- Constraints
    UNIQUE(player_name, team_name, season)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_stats_player_name ON player_stats (player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_name ON player_stats (team_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_league ON player_stats (league);
CREATE INDEX IF NOT EXISTS idx_player_stats_position ON player_stats (position);
CREATE INDEX IF NOT EXISTS idx_player_stats_goals ON player_stats (goals DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_assists ON player_stats (assists DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_average_rating ON player_stats (average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_last_updated ON player_stats (last_updated);

-- Enable Row Level Security
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view player stats" ON player_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage player stats" ON player_stats
  FOR ALL
  TO authenticated
  USING ( (auth.jwt() ->> 'role') = 'admin' )
  WITH CHECK ( (auth.jwt() ->> 'role') = 'admin' );