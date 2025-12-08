// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FOOTBALL_DATA_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchDetails {
  timeline?: any[];
  stats?: any;
  lineups?: any;
  venueDetails?: any;
  comments?: any[];
  headToHead?: any[];
}

// Rate limiter for Football-Data.org (10 req/min on free tier)
let reqCount = 0;
let windowStart = Date.now();

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitedFetch(url: string, label?: string) {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    reqCount = 0;
    windowStart = now;
  }

  if (reqCount >= 6) {
    const wait = 60_000 - (now - windowStart) + 1000;
    console.log(`[rateLimit] Waiting ${wait}ms before calling ${label}`);
    await sleep(wait);
    reqCount = 0;
    windowStart = Date.now();
  }

  reqCount++;
  return fetch(url, {
    method: 'GET',
    headers: {
      'X-Auth-Token': FOOTBALL_DATA_API_KEY || '',
      'Accept': 'application/json'
    },
  });
}

// Fetch match details from database first, then enrich with API data
async function getMatchDetailsFromDB(matchId: string) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  
  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching match from DB:', error);
    return null;
  }
  
  return match;
}

// Fetch head-to-head data from Football-Data.org
async function fetchHeadToHead(fixtureId: number): Promise<any[]> {
  if (!FOOTBALL_DATA_API_KEY) {
    console.log('[h2h] No API key, skipping');
    return [];
  }

  try {
    const res = await rateLimitedFetch(
      `https://api.football-data.org/v4/matches/${fixtureId}/head2head?limit=5`,
      'head2head'
    );

    if (!res.ok) {
      console.warn(`[h2h] API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.matches || []).map((m: any) => ({
      date: m.utcDate,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.score?.fullTime?.home ?? m.score?.home,
      awayScore: m.score?.fullTime?.away ?? m.score?.away,
      competition: m.competition?.name
    }));
  } catch (error) {
    console.error('[h2h] Error:', error);
    return [];
  }
}

// Build timeline from match data
function buildTimeline(match: any): any[] {
  // If we have stored timeline data, use it
  if (match?.timeline && Array.isArray(match.timeline)) {
    return match.timeline;
  }
  
  // Otherwise return empty - will be populated by live updates
  return [];
}

// Build stats from match data
function buildStats(match: any): any {
  // If we have stored stats, use them
  if (match?.stats) {
    return match.stats;
  }
  
  // Return null for scheduled matches
  if (match?.status === 'scheduled') {
    return null;
  }
  
  // Basic stats from score if available
  if (match?.home_team_score !== null && match?.away_team_score !== null) {
    return {
      goals: { home: match.home_team_score, away: match.away_team_score }
    };
  }
  
  return null;
}

// Build lineups from match data
function buildLineups(match: any): any {
  // If we have stored lineups, use them
  if (match?.lineups) {
    return match.lineups;
  }
  
  // Return null - lineups typically available close to kickoff
  return null;
}

// Build venue details
function buildVenueDetails(match: any): any {
  if (match?.venue_details) {
    return match.venue_details;
  }
  
  if (match?.venue) {
    return {
      name: match.venue,
      city: match.metadata?.venue_city || null,
      country: match.metadata?.venue_country || null
    };
  }
  
  return null;
}

// Fetch comments for the match from messages table
async function fetchComments(matchId: string): Promise<any[]> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  
  // Look for a channel associated with this match
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle();
  
  if (!channel) {
    return [];
  }
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      text,
      created_at,
      team_support,
      likes,
      user_id,
      profiles!messages_user_id_fkey (
        display_name,
        avatar_url,
        is_pro
      )
    `)
    .eq('channel_id', channel.id)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  
  return (messages || []).map((msg: any) => ({
    id: msg.id,
    userName: msg.profiles?.display_name || 'Anonymous',
    userAvatar: msg.profiles?.avatar_url || null,
    text: msg.text,
    timestamp: formatTimestamp(msg.created_at),
    teamSupport: msg.team_support,
    isPro: msg.profiles?.is_pro || false,
    likes: msg.likes || 0
  }));
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const matchId = url.searchParams.get("matchId");

    if (!matchId) {
      return new Response(
        JSON.stringify({ error: "matchId parameter required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching details for match: ${matchId}`);

    // Get match from database
    const match = await getMatchDetailsFromDB(matchId);
    
    if (!match) {
      return new Response(
        JSON.stringify({ error: "Match not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build response from stored data
    const timeline = buildTimeline(match);
    const stats = buildStats(match);
    const lineups = buildLineups(match);
    const venueDetails = buildVenueDetails(match);
    
    // Fetch head-to-head if we have a fixture_id
    let headToHead: any[] = [];
    if (match.fixture_id && FOOTBALL_DATA_API_KEY) {
      headToHead = await fetchHeadToHead(match.fixture_id);
    }
    
    // Fetch comments from database
    const comments = await fetchComments(matchId);

    const matchDetails: MatchDetails = {
      timeline,
      stats,
      lineups,
      venueDetails,
      comments,
      headToHead
    };

    // Add match metadata to response
    const response = {
      ...matchDetails,
      match: {
        id: match.id,
        homeTeam: match.home_team_json || { name: match.home_team, id: match.home_team_id },
        awayTeam: match.away_team_json || { name: match.away_team, id: match.away_team_id },
        status: match.status,
        kickoffTime: match.kickoff_time,
        score: match.score || { home: match.home_team_score, away: match.away_team_score },
        league: match.league,
        round: match.round,
        venue: match.venue,
        odds: {
          home: match.odds_home,
          draw: match.odds_draw,
          away: match.odds_away
        }
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-match-details:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
