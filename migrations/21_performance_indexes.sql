-- Performance optimization indexes for scaling to 10k+ users
-- These indexes will significantly improve query performance

-- Matches table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_status_kickoff ON matches (status, kickoff_time DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_league_status ON matches (league, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_home_team ON matches (home_team);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_away_team ON matches (away_team);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_kickoff_time ON matches (kickoff_time DESC);

-- Prediction history indexes (most critical for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_match_id ON prediction_history (match_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_status_created ON prediction_history (status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_league_status ON prediction_history (league, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_confidence ON prediction_history (confidence DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_prompt_source ON prediction_history (prompt_source);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_ab_variant ON prediction_history (ab_test_variant);

-- Feeds table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feeds_type_created ON feeds (type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feeds_source_created ON feeds (source, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feeds_created_at ON feeds (created_at DESC);

-- Users/profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON profiles (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_created_at ON profiles (created_at DESC);

-- Bets table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_user_id_created ON bets (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_match_id ON bets (match_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_status ON bets (status);

-- Standings table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_standings_league ON standings (league);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_standings_team_name ON standings (team_name);

-- News entities indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_entities_feed_id ON news_entities (feed_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_entities_entity_type ON news_entities (entity_type);

-- Prompt performance indexes (already created in migration 20, but ensuring they exist)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_performance_accuracy ON prompt_performance (accuracy DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_performance_last_used ON prompt_performance (last_used DESC);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_league_kickoff_status ON matches (league, kickoff_time DESC, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_league_created ON prediction_history (league, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feeds_type_source_created ON feeds (type, source, created_at DESC);

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_scheduled ON matches (kickoff_time DESC) WHERE status = 'scheduled';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_live ON matches (id) WHERE status = 'live';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_resolved ON prediction_history (match_id, confidence DESC) WHERE status = 'RESOLVED';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_pending ON bets (user_id, created_at DESC) WHERE status = 'pending';

-- JSONB indexes for metadata fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_metadata_fixture_id ON matches ((metadata->>'fixture_id'));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feeds_metadata ON feeds USING GIN (metadata);

-- Foreign key indexes (ensure they exist)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_user_id ON bets (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_match_id_exists ON bets (match_id);

-- Performance monitoring indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_history_created_hour ON prediction_history (date_trunc('hour', created_at));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feeds_created_hour ON feeds (date_trunc('hour', created_at));

-- Clean up any unused indexes (optional - run manually if needed)
-- DROP INDEX CONCURRENTLY IF EXISTS old_index_name;