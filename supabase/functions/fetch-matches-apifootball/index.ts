// @ts-nocheck
/**
 * API-Football Match Fetcher - Extended Multi-Sport
 * Optimized for FREE TIER: ~100 calls/day
 * 
 * Sports covered:
 * - Football: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UCL, UEL
 * - NBA: via API-Basketball
 * - F1: via API-Formula-1
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Top football leagues to fetch
const PRIORITY_FOOTBALL_LEAGUES = [
  { id: 39, name: "Premier League", country: "England", code: "PL" },
  { id: 2, name: "Champions League", country: "Europe", code: "CL" },
  { id: 3, name: "Europa League", country: "Europe", code: "EL" },
  { id: 78, name: "Bundesliga", country: "Germany", code: "BL1" },
  { id: 140, name: "La Liga", country: "Spain", code: "PD" },
  { id: 135, name: "Serie A", country: "Italy", code: "SA" },
  { id: 61, name: "Ligue 1", country: "France", code: "FL1" },
  { id: 848, name: "Conference League", country: "Europe", code: "ECL" },
];

// NBA leagues for API-Basketball
const NBA_LEAGUE = { id: 12, name: "NBA", country: "USA", code: "NBA" };

const CURRENT_SEASON = 2024;

// Rate limiter - conservative for free tier
let callCount = 0;
const MAX_CALLS_PER_RUN = 20;

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function apiSportsFetch(sport: string, endpoint: string, params: Record<string, string | number> = {}) {
  if (callCount >= MAX_CALLS_PER_RUN) {
    console.log(`[API-Sports] Rate limit reached (${MAX_CALLS_PER_RUN} calls), skipping...`);
    return null;
  }
  
  const queryString = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  
  // Different base URLs for different sports
  const baseUrls: Record<string, string> = {
    football: "https://v3.football.api-sports.io",
    basketball: "https://v1.basketball.api-sports.io",
    formula1: "https://v1.formula-1.api-sports.io",
  };
  
  const baseUrl = baseUrls[sport] || baseUrls.football;
  const url = `${baseUrl}/${endpoint}${queryString ? `?${queryString}` : ""}`;
  
  console.log(`[API-Sports/${sport}] Call #${callCount + 1}: ${endpoint}`);
  
  const res = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY || "",
    },
  });
  
  callCount++;
  
  if (!res.ok) {
    console.error(`[API-Sports] Error: ${res.status}`);
    return null;
  }
  
  const data = await res.json();
  
  // Log remaining quota
  const remaining = res.headers.get("x-ratelimit-requests-remaining");
  console.log(`[API-Sports] Remaining daily quota: ${remaining}`);
  
  return data.response || [];
}

function mapMatchStatus(apiStatus: string): string {
  const statusMap: Record<string, string> = {
    // Football statuses
    "TBD": "scheduled",
    "NS": "scheduled",
    "1H": "live",
    "HT": "live",
    "2H": "live",
    "ET": "live",
    "P": "live",
    "FT": "finished",
    "AET": "finished",
    "PEN": "finished",
    "PST": "postponed",
    "CANC": "cancelled",
    "ABD": "abandoned",
    "AWD": "finished",
    "WO": "finished",
    // Basketball statuses
    "Q1": "live",
    "Q2": "live",
    "Q3": "live",
    "Q4": "live",
    "OT": "live",
    "BT": "live",
    "LIVE": "live",
    // F1 statuses
    "Scheduled": "scheduled",
    "In Progress": "live",
    "Finished": "finished",
  };
  return statusMap[apiStatus] || "scheduled";
}

async function fetchLiveMatches(supabase: any) {
  console.log("[APIFootball] Fetching live matches...");
  const live = await apiSportsFetch("football", "fixtures", { live: "all" });
  
  if (!live || live.length === 0) {
    console.log("[APIFootball] No live matches");
    return { count: 0, matches: [] };
  }
  
  console.log(`[APIFootball] Found ${live.length} live matches`);
  
  const matches = live.map((f: any) => ({
    id: `api-football-${f.fixture.id}`,
    fixture_id: f.fixture.id,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_team_id: f.teams.home.id,
    away_team_id: f.teams.away.id,
    home_team_json: f.teams.home,
    away_team_json: f.teams.away,
    home_team_score: f.goals.home,
    away_team_score: f.goals.away,
    status: "live",
    league: f.league.name,
    league_id: null,
    kickoff_time: f.fixture.date,
    venue: f.fixture.venue?.name || null,
    venue_details: f.fixture.venue || null,
    round: f.league.round,
    season: f.league.season,
    score: { home: f.goals.home, away: f.goals.away },
    metadata: {
      fixture_id: f.fixture.id,
      referee: f.fixture.referee,
      elapsed: f.fixture.status.elapsed,
      source: "api-football"
    },
    updated_at: new Date().toISOString(),
  }));
  
  return { count: matches.length, matches };
}

async function fetchUpcomingByLeague(supabase: any, league: typeof PRIORITY_FOOTBALL_LEAGUES[0]) {
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  console.log(`[APIFootball] Fetching ${league.name} from ${today} to ${nextWeek}...`);
  
  const fixtures = await apiSportsFetch("football", "fixtures", {
    league: league.id,
    season: CURRENT_SEASON,
    from: today,
    to: nextWeek,
  });
  
  if (!fixtures || fixtures.length === 0) {
    console.log(`[APIFootball] No upcoming for ${league.name}`);
    return [];
  }
  
  console.log(`[APIFootball] Found ${fixtures.length} fixtures for ${league.name}`);
  
  return fixtures.map((f: any) => ({
    id: `api-football-${f.fixture.id}`,
    fixture_id: f.fixture.id,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_team_id: f.teams.home.id,
    away_team_id: f.teams.away.id,
    home_team_json: f.teams.home,
    away_team_json: f.teams.away,
    home_team_score: f.goals.home,
    away_team_score: f.goals.away,
    status: mapMatchStatus(f.fixture.status.short),
    league: league.name,
    league_id: null, // Will be resolved later
    kickoff_time: f.fixture.date,
    venue: f.fixture.venue?.name || null,
    venue_details: f.fixture.venue || null,
    round: f.league.round,
    season: f.league.season,
    score: { home: f.goals.home, away: f.goals.away },
    metadata: {
      fixture_id: f.fixture.id,
      referee: f.fixture.referee,
      league_code: league.code,
      source: "api-football"
    },
    updated_at: new Date().toISOString(),
  }));
}

async function fetchNBAGames(supabase: any) {
  console.log("[API-Basketball] Fetching NBA games...");
  
  const today = new Date().toISOString().split("T")[0];
  
  // Fetch live NBA games
  const liveGames = await apiSportsFetch("basketball", "games", {
    league: NBA_LEAGUE.id,
    season: "2024-2025",
    live: "all"
  });
  
  // Fetch today's scheduled games
  const scheduledGames = await apiSportsFetch("basketball", "games", {
    league: NBA_LEAGUE.id,
    season: "2024-2025",
    date: today
  });
  
  const allGames = [...(liveGames || []), ...(scheduledGames || [])];
  const uniqueGames = Array.from(new Map(allGames.map(g => [g.id, g])).values());
  
  console.log(`[API-Basketball] Found ${uniqueGames.length} NBA games`);
  
  return uniqueGames.map((g: any) => ({
    id: `nba-${g.id}`,
    fixture_id: g.id,
    home_team: g.teams.home.name,
    away_team: g.teams.away.name,
    home_team_id: g.teams.home.id,
    away_team_id: g.teams.away.id,
    home_team_json: g.teams.home,
    away_team_json: g.teams.away,
    home_team_score: g.scores?.home?.total || null,
    away_team_score: g.scores?.away?.total || null,
    status: mapMatchStatus(g.status?.short || "NS"),
    league: "NBA",
    league_id: null,
    kickoff_time: g.date,
    venue: g.venue || null,
    venue_details: null,
    round: g.stage || null,
    season: 2024,
    score: { 
      home: g.scores?.home?.total || null, 
      away: g.scores?.away?.total || null 
    },
    metadata: {
      fixture_id: g.id,
      quarters: g.scores,
      sport: "basketball",
      source: "api-basketball"
    },
    updated_at: new Date().toISOString(),
  }));
}

async function fetchF1Races(supabase: any) {
  console.log("[API-F1] Fetching F1 races...");
  
  const races = await apiSportsFetch("formula1", "races", {
    season: 2024,
    type: "Race"
  });
  
  if (!races || races.length === 0) {
    console.log("[API-F1] No F1 races found");
    return [];
  }
  
  console.log(`[API-F1] Found ${races.length} F1 races`);
  
  // Get upcoming races only
  const now = new Date();
  const upcomingRaces = races.filter((r: any) => new Date(r.date) >= now).slice(0, 5);
  
  return upcomingRaces.map((r: any) => ({
    id: `f1-${r.id}`,
    fixture_id: r.id,
    home_team: r.competition?.name || r.circuit?.name || "F1 Race",
    away_team: r.circuit?.name || "Circuit",
    home_team_id: null,
    away_team_id: null,
    home_team_json: { name: r.competition?.name },
    away_team_json: { name: r.circuit?.name },
    home_team_score: null,
    away_team_score: null,
    status: mapMatchStatus(r.status || "Scheduled"),
    league: "Formula 1",
    league_id: null,
    kickoff_time: r.date,
    venue: r.circuit?.name || null,
    venue_details: r.circuit || null,
    round: `Round ${r.competition?.round || '?'}`,
    season: 2024,
    score: null,
    metadata: {
      fixture_id: r.id,
      circuit: r.circuit,
      laps: r.laps,
      sport: "formula1",
      source: "api-f1"
    },
    updated_at: new Date().toISOString(),
  }));
}

async function upsertMatches(supabase: any, matches: any[]) {
  if (matches.length === 0) return 0;
  
  const { error } = await supabase
    .from("matches")
    .upsert(matches, { 
      onConflict: "id",
      ignoreDuplicates: false 
    });
  
  if (error) {
    console.error("[DB] Upsert error:", error);
    return 0;
  }
  
  return matches.length;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(
      SUPABASE_URL || "",
      SUPABASE_SERVICE_KEY || ""
    );
    
    callCount = 0;
    let totalLive = 0;
    let totalUpcoming = 0;
    let allMatches: any[] = [];
    
    // 1. Fetch live football matches (always)
    const liveResult = await fetchLiveMatches(supabase);
    allMatches.push(...liveResult.matches);
    totalLive = liveResult.count;
    
    // 2. Fetch upcoming from priority leagues (rotate - 2 leagues per call to save quota)
    const today = new Date().getDay();
    const leaguesToFetch = PRIORITY_FOOTBALL_LEAGUES.slice(
      (today * 2) % PRIORITY_FOOTBALL_LEAGUES.length, 
      ((today * 2) % PRIORITY_FOOTBALL_LEAGUES.length) + 3
    );
    
    for (const league of leaguesToFetch) {
      if (callCount >= MAX_CALLS_PER_RUN) break;
      const upcoming = await fetchUpcomingByLeague(supabase, league);
      allMatches.push(...upcoming);
      totalUpcoming += upcoming.length;
      await sleep(200); // Small delay between calls
    }
    
    // 3. Fetch NBA games (if quota allows)
    if (callCount < MAX_CALLS_PER_RUN - 2) {
      const nbaGames = await fetchNBAGames(supabase);
      allMatches.push(...nbaGames);
      totalUpcoming += nbaGames.length;
    }
    
    // 4. Fetch F1 races (if quota allows)
    if (callCount < MAX_CALLS_PER_RUN - 1) {
      const f1Races = await fetchF1Races(supabase);
      allMatches.push(...f1Races);
      totalUpcoming += f1Races.length;
    }
    
    // 5. Upsert all matches
    const saved = await upsertMatches(supabase, allMatches);
    
    console.log(`[Summary] API calls: ${callCount}, Live: ${totalLive}, Upcoming: ${totalUpcoming}, Saved: ${saved}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        apiCalls: callCount,
        live: totalLive,
        upcoming: totalUpcoming,
        saved,
        sports: ["Football", "NBA", "F1"]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("[Error]", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
