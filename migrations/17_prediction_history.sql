-- Create prediction_history table to track all predictions and their outcomes
CREATE TABLE IF NOT EXISTS prediction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT NOT NULL,
    predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('HOME_WIN', 'DRAW', 'AWAY_WIN')),
    actual_outcome TEXT CHECK (actual_outcome IN ('HOME_WIN', 'DRAW', 'AWAY_WIN')),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    predicted_score TEXT,
    actual_score TEXT,
    ai_reasoning TEXT,
    key_insight TEXT,
    betting_angle TEXT,
    odds JSONB,
    probability JSONB,
    is_value_pick BOOLEAN DEFAULT false,
    risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    model_edge DECIMAL(5,2),
    system_record TEXT,
    prompt_template TEXT, -- The AI prompt used for this prediction
    prompt_source TEXT DEFAULT 'default', -- 'default', 'optimized', 'ab_test_X'
    ab_test_variant TEXT, -- 'A' or 'B' if part of A/B test
    is_correct BOOLEAN, -- Calculated when resolved
    points_earned INTEGER, -- Points earned based on confidence and correctness
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    match_date TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'CANCELLED'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_history_match_id ON prediction_history (match_id);
CREATE INDEX IF NOT EXISTS idx_prediction_history_league ON prediction_history (league);
CREATE INDEX IF NOT EXISTS idx_prediction_history_status ON prediction_history (status);
CREATE INDEX IF NOT EXISTS idx_prediction_history_created_at ON prediction_history (created_at);
CREATE INDEX IF NOT EXISTS idx_prediction_history_match_date ON prediction_history (match_date);

-- Enable Row Level Security
ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view prediction history" ON prediction_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage prediction history" ON prediction_history
  FOR ALL
  TO authenticated
  USING ( (auth.jwt() ->> 'role') = 'admin' )
  WITH CHECK ( (auth.jwt() ->> 'role') = 'admin' );