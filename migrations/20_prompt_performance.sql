-- Create prompt_performance table to track which prompts work best
CREATE TABLE IF NOT EXISTS prompt_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_template TEXT NOT NULL,
    prompt_hash VARCHAR(64) UNIQUE NOT NULL, -- Hash of prompt for deduplication
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0,
    average_confidence DECIMAL(5,2) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    roi DECIMAL(5,2) DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ab_test_experiments table for A/B testing
CREATE TABLE IF NOT EXISTS ab_test_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_name VARCHAR(100) NOT NULL,
    experiment_type VARCHAR(50) NOT NULL, -- 'PROMPT', 'STRATEGY', 'CONFIDENCE'
    variant_a TEXT NOT NULL, -- JSON config for variant A
    variant_b TEXT NOT NULL, -- JSON config for variant B
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED')),
    total_predictions INTEGER DEFAULT 0,
    variant_a_predictions INTEGER DEFAULT 0,
    variant_b_predictions INTEGER DEFAULT 0,
    variant_a_correct INTEGER DEFAULT 0,
    variant_b_correct INTEGER DEFAULT 0,
    variant_a_accuracy DECIMAL(5,2) DEFAULT 0,
    variant_b_accuracy DECIMAL(5,2) DEFAULT 0,
    winner VARCHAR(10) CHECK (winner IN ('A', 'B', 'TIE', 'INCONCLUSIVE')),
    confidence_level DECIMAL(5,2), -- Statistical confidence in the result
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_performance_hash ON prompt_performance (prompt_hash);
CREATE INDEX IF NOT EXISTS idx_prompt_performance_accuracy ON prompt_performance (accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_experiments_status ON ab_test_experiments (status);
CREATE INDEX IF NOT EXISTS idx_ab_test_experiments_type ON ab_test_experiments (experiment_type);

-- Enable Row Level Security
ALTER TABLE prompt_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_experiments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage prompt performance" ON prompt_performance
  FOR ALL
  TO authenticated
  USING ( (auth.jwt() ->> 'role') = 'admin' )
  WITH CHECK ( (auth.jwt() ->> 'role') = 'admin' );

CREATE POLICY "Admins can manage A/B experiments" ON ab_test_experiments
  FOR ALL
  TO authenticated
  USING ( (auth.jwt() ->> 'role') = 'admin' )
  WITH CHECK ( (auth.jwt() ->> 'role') = 'admin' );

-- Function to update prompt performance
CREATE OR REPLACE FUNCTION update_prompt_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the prompt_performance table when predictions are resolved
    IF NEW.status = 'RESOLVED' AND OLD.status != 'RESOLVED' THEN
        -- This would be called from a trigger, but for now we'll handle it in the edge function
        -- The logic will be implemented in the optimize-prompts function
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update prompt performance (optional - we handle this in edge functions)
-- CREATE TRIGGER trigger_update_prompt_performance
--     AFTER UPDATE ON prediction_history
--     FOR EACH ROW
--     EXECUTE FUNCTION update_prompt_performance();