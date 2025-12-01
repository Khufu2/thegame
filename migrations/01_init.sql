-- Initial schema for Sheena Sports
-- Create required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text,
  display_name text,
  avatar_url text,
  bio text,
  preferences jsonb DEFAULT '{}'::jsonb,
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- LEAGUES
CREATE TABLE IF NOT EXISTS public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  slug text UNIQUE,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
  id text PRIMARY KEY,
  league_id uuid REFERENCES public.leagues(id) ON DELETE SET NULL,
  home_team jsonb,
  away_team jsonb,
  start_time timestamptz,
  status text,
  score jsonb,
  momentum jsonb,
  venue text,
  venue_details jsonb,
  prediction jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matches_start_time ON public.matches(start_time);

-- TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS public.timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text REFERENCES public.matches(id) ON DELETE CASCADE,
  minute int,
  type text,
  player text,
  description text,
  media_url text,
  source text,
  created_at timestamptz DEFAULT now()
);

-- BETS
CREATE TABLE IF NOT EXISTS public.bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  match_id text REFERENCES public.matches(id) ON DELETE CASCADE,
  stake numeric NOT NULL,
  odds numeric NOT NULL,
  status text DEFAULT 'PENDING', -- PENDING, WON, LOST, CANCELLED
  payout numeric DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  settled_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON public.bets(user_id);

-- FEEDS (News / Articles)
CREATE TABLE IF NOT EXISTS public.feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  title text,
  body text,
  persona text,
  published_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- COMMUNITY CHANNELS & MESSAGES
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  text text,
  attachments jsonb,
  team_support text,
  created_at timestamptz DEFAULT now()
);

-- STANDINGS (cached table)
CREATE TABLE IF NOT EXISTS public.standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE,
  season text,
  data jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Simple helper: audit/log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text,
  object_type text,
  object_id text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_timeline_match_id ON public.timeline(match_id);

-- End of initial schema
