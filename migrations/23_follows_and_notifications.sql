-- Followed matches and betslips for pro users
CREATE TABLE followed_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

CREATE TABLE followed_betslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    betslip_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, betslip_id)
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN DEFAULT true,
    whatsapp_enabled BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT true,
    live_alerts BOOLEAN DEFAULT true,
    war_room_alerts BOOLEAN DEFAULT true,
    momentum_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('goal', 'card', 'var', 'halftime', 'fulltime', 'momentum', 'war_room', 'cash_out')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    match_id TEXT,
    betslip_id TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    sent_push BOOLEAN DEFAULT false,
    sent_whatsapp BOOLEAN DEFAULT false,
    sent_email BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_followed_matches_user_id ON followed_matches(user_id);
CREATE INDEX idx_followed_matches_match_id ON followed_matches(match_id);
CREATE INDEX idx_followed_betslips_user_id ON followed_betslips(user_id);
CREATE INDEX idx_followed_betslips_betslip_id ON followed_betslips(betslip_id);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

-- RLS Policies
ALTER TABLE followed_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE followed_betslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Followed matches policies
CREATE POLICY "Users can view their own followed matches" ON followed_matches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own followed matches" ON followed_matches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own followed matches" ON followed_matches
    FOR DELETE USING (auth.uid() = user_id);

-- Followed betslips policies
CREATE POLICY "Users can view their own followed betslips" ON followed_betslips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own followed betslips" ON followed_betslips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own followed betslips" ON followed_betslips
    FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);