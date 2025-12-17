-- Betslips table for tracking user betting history
CREATE TABLE betslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT, -- Optional custom name for the betslip
    items JSONB NOT NULL, -- Array of BetSlipItem objects
    total_odds DECIMAL(10,2) NOT NULL,
    stake DECIMAL(10,2),
    potential_return DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SETTLED', 'CANCELLED')),
    result TEXT CHECK (result IN ('WON', 'LOST', 'PENDING')),
    payout DECIMAL(10,2), -- Actual payout if won
    is_public BOOLEAN DEFAULT false, -- Whether other users can view this betslip
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Betslip items table for detailed tracking (optional, can use JSONB instead)
CREATE TABLE betslip_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    betslip_id UUID NOT NULL REFERENCES betslips(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    match_up TEXT NOT NULL,
    selection TEXT NOT NULL,
    market TEXT, -- e.g., 'Match Winner', 'BTTS', 'Over/Under'
    odds DECIMAL(6,2) NOT NULL,
    outcome TEXT NOT NULL, -- 'HOME', 'DRAW', 'AWAY'
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WON', 'LOST')),
    result TEXT, -- Actual match result
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_betslips_user_id ON betslips(user_id);
CREATE INDEX idx_betslips_status ON betslips(status);
CREATE INDEX idx_betslips_created_at ON betslips(created_at DESC);
CREATE INDEX idx_betslips_is_public ON betslips(is_public);
CREATE INDEX idx_betslip_items_betslip_id ON betslip_items(betslip_id);
CREATE INDEX idx_betslip_items_match_id ON betslip_items(match_id);

-- RLS Policies
ALTER TABLE betslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE betslip_items ENABLE ROW LEVEL SECURITY;

-- Betslips policies
CREATE POLICY "Users can view their own betslips" ON betslips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public betslips from others" ON betslips
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own betslips" ON betslips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own betslips" ON betslips
    FOR UPDATE USING (auth.uid() = user_id);

-- Betslip items policies
CREATE POLICY "Users can view items from their own betslips" ON betslip_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM betslips
            WHERE betslips.id = betslip_items.betslip_id
            AND betslips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view items from public betslips" ON betslip_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM betslips
            WHERE betslips.id = betslip_items.betslip_id
            AND betslips.is_public = true
        )
    );

CREATE POLICY "Users can insert items to their own betslips" ON betslip_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM betslips
            WHERE betslips.id = betslip_items.betslip_id
            AND betslips.user_id = auth.uid()
        )
    );

-- Function to calculate betslip result
CREATE OR REPLACE FUNCTION calculate_betslip_result(betslip_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    total_items INTEGER;
    won_items INTEGER;
    lost_items INTEGER;
    pending_items INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'WON' THEN 1 END),
        COUNT(CASE WHEN status = 'LOST' THEN 1 END),
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)
    INTO total_items, won_items, lost_items, pending_items
    FROM betslip_items
    WHERE betslip_id = betslip_uuid;

    IF pending_items > 0 THEN
        RETURN 'PENDING';
    ELSIF lost_items > 0 THEN
        RETURN 'LOST';
    ELSIF won_items = total_items THEN
        RETURN 'WON';
    ELSE
        RETURN 'PENDING';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update betslip result when items change
CREATE OR REPLACE FUNCTION update_betslip_result()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE betslips
    SET result = calculate_betslip_result(NEW.betslip_id),
        updated_at = NOW(),
        settled_at = CASE
            WHEN calculate_betslip_result(NEW.betslip_id) IN ('WON', 'LOST')
            THEN NOW()
            ELSE settled_at
        END
    WHERE id = NEW.betslip_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_betslip_result
    AFTER INSERT OR UPDATE ON betslip_items
    FOR EACH ROW
    EXECUTE FUNCTION update_betslip_result();