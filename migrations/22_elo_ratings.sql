-- Create Elo ratings table for advanced ML predictions
CREATE TABLE IF NOT EXISTS team_elo_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id TEXT NOT NULL UNIQUE,
    team_name TEXT NOT NULL,
    league TEXT,
    elo_rating INTEGER NOT NULL DEFAULT 1500,
    matches_played INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Elo change tracking to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS elo_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS home_elo_change INTEGER,
ADD COLUMN IF NOT EXISTS away_elo_change INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_elo_ratings_team_id ON team_elo_ratings(team_id);
CREATE INDEX IF NOT EXISTS idx_team_elo_ratings_league ON team_elo_ratings(league);
CREATE INDEX IF NOT EXISTS idx_team_elo_ratings_rating ON team_elo_ratings(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_matches_elo_processed ON matches(elo_processed) WHERE elo_processed = FALSE;

-- Function to increment matches played (used in Elo calculation)
CREATE OR REPLACE FUNCTION increment_matches_played(team_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT matches_played INTO current_count
    FROM team_elo_ratings
    WHERE team_id = team_id_param;

    IF current_count IS NULL THEN
        RETURN 1;
    ELSE
        RETURN current_count + 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create prediction history table for backtesting
CREATE TABLE IF NOT EXISTS prediction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT,
    predicted_outcome TEXT NOT NULL, -- 'HOME_WIN', 'DRAW', 'AWAY_WIN'
    predicted_score TEXT, -- e.g., "2-1"
    confidence_score INTEGER, -- 0-100
    model_used TEXT NOT NULL, -- 'AI', 'ELO', 'HYBRID', etc.
    actual_outcome TEXT, -- Set after match finishes
    actual_score TEXT, -- Set after match finishes
    accuracy BOOLEAN, -- Whether prediction was correct
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    match_date TIMESTAMP WITH TIME ZONE
);

-- Indexes for prediction history
CREATE INDEX IF NOT EXISTS idx_prediction_history_match_id ON prediction_history(match_id);
CREATE INDEX IF NOT EXISTS idx_prediction_history_accuracy ON prediction_history(accuracy);
CREATE INDEX IF NOT EXISTS idx_prediction_history_model ON prediction_history(model_used);
CREATE INDEX IF NOT EXISTS idx_prediction_history_date ON prediction_history(match_date);

-- Function to calculate prediction accuracy stats
CREATE OR REPLACE FUNCTION get_prediction_accuracy_stats(
    model_name TEXT DEFAULT NULL,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_predictions BIGINT,
    correct_predictions BIGINT,
    accuracy_percentage DECIMAL,
    model TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_predictions,
        COUNT(*) FILTER (WHERE accuracy = TRUE) as correct_predictions,
        ROUND(
            (COUNT(*) FILTER (WHERE accuracy = TRUE)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
            2
        ) as accuracy_percentage,
        COALESCE(model_name, ph.model_used) as model
    FROM prediction_history ph
    WHERE (model_name IS NULL OR ph.model_used = model_name)
    AND ph.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY COALESCE(model_name, ph.model_used);
END;
$$ LANGUAGE plpgsql;