// @ts-nocheck
/**
 * API-Football Match Fetcher
 * Optimized for FREE TIER: ~100 calls/day
 * 
 * Strategy:
 * - Fetch live matches (1 call)
 * - Fetch upcoming for top leagues only (1 call per league/day)
 * - Total: ~10-15 calls per invocation
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

// Top leagues to fetch - prioritized for free tier
const PRIORITY_LEAGUES = [
  { id: 39, name: "Premier League", country: "England" },
  { id: 2, name: "Champions League", country: "Europe" },
  { id: 3, name: "Europa League", country: "Europe" },
  { id: 78, name: "Bundesliga", country: "Germany" },
  { id: 140, name: "La Liga", country: "Spain" },
  { id: 135, name: "Serie A", country: "Italy" },
  { id: 61, name: "Ligue 1", country: "France" },
];

const CURRENT_SEASON = 2024;

// Rate limiter - conservative for free tier
let callCount = 0;
const MAX_CALLS_PER_RUN = 15;

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function apiFootballFetch(endpoint: string, params: Record<string, string | number> = {}) {
  if (callCount >= MAX_CALLS_PER_RUN) {
    console.log(`[APIFootball] Rate limit reached (${MAX_CALLS_PER_RUN} calls), skipping...`);
    return null;
  }
  
  const queryString = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  
  const url = `https://v3.football.api-sports.io/${endpoint}${queryString ? `?${queryString}` : ""}`;
  
  console.log(`[APIFootball] Call #${callCount + 1}: ${endpoint}`);
  
  const res = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY || "",
    },
  });
  
  callCount++;
  
  if (!res.ok) {
    console.error(`[APIFootball] Error: ${res.status}`);
    return null;
  }
  
  const data = await res.json();
  
  // Log remaining quota
  const remaining = res.headers.get("x-ratelimit-requests-remaining");
  console.log(`[APIFootball] Remaining daily quota: ${remaining}`);
  
  return data.response || [];
}

function mapMatchStatus(apiStatus: string): string {
  const statusMap: Record<string, string> = {
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
  };
  return statusMap[apiStatus] || "scheduled";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!API_FOOTBALL_KEY) {
      throw new Error("API_FOOTBALL_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    callCount = 0;
    
    const url = new URL(req.url);
    const liveOnly = url.searchParams.get("live") === "1";
    const leagueFilter = url.searchParams.get("league");
    
    const results = {
      live: 0,
      upcoming: 0,
      saved: 0,
    };
    
    // 1. Fetch LIVE matches (1 API call)
    console.log("[APIFootball] Fetching live matches...");
    const liveMatches = await apiFootballFetch("fixtures", { live: "all" });
    
    if (liveMatches && liveMatches.length > 0) {
      results.live = liveMatches.length;
      console.log(`[APIFootball] Found ${liveMatches.length} live matches`);
      
      // Save live matches
      for (const match of liveMatches) {
        await saveMatch(supabase, match);
        results.saved++;
      }
    }
    
    // 2. Fetch UPCOMING matches for priority leagues (if not live-only mode)
    if (!liveOnly) {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      
      const leaguesToFetch = leagueFilter 
        ? PRIORITY_LEAGUES.filter(l => l.id === parseInt(leagueFilter))
        : PRIORITY_LEAGUES;
      
      for (const league of leaguesToFetch) {
        if (callCount >= MAX_CALLS_PER_RUN) break;
        
        // Add delay between requests to be nice to the API
        await sleep(500);
        
        console.log(`[APIFootball] Fetching ${league.name} fixtures...`);
        const fixtures = await apiFootballFetch("fixtures", {
          league: league.id,
          season: CURRENT_SEASON,
          from: today,
          to: tomorrow,
        });
        
        if (fixtures && fixtures.length > 0) {
          results.upcoming += fixtures.length;
          
          for (const match of fixtures) {
            await saveMatch(supabase, match);
            results.saved++;
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        apiCalls: callCount,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[APIFootball] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function saveMatch(supabase: any, match: any) {
  const fixture = match.fixture;
  const teams = match.teams;
  const goals = match.goals;
  const league = match.league;
  const score = match.score;
  
  const status = mapMatchStatus(fixture.status.short);
  
  // Determine result if finished
  let result = null;
  if (status === "finished" && goals.home !== null && goals.away !== null) {
    if (goals.home > goals.away) result = "HOME_WIN";
    else if (goals.away > goals.home) result = "AWAY_WIN";
    else result = "DRAW";
  }
  
  const matchData = {
    id: `apifootball-${fixture.id}`,
    fixture_id: fixture.id,
    home_team: teams.home.name,
    away_team: teams.away.name,
    home_team_id: teams.home.id,
    away_team_id: teams.away.id,
    home_team_json: {
      id: teams.home.id,
      name: teams.home.name,
      logo: teams.home.logo,
    },
    away_team_json: {
      id: teams.away.id,
      name: teams.away.name,
      logo: teams.away.logo,
    },
    kickoff_time: fixture.date,
    status: status.toUpperCase(),
    home_team_score: goals.home,
    away_team_score: goals.away,
    score: {
      fullTime: { home: score?.fulltime?.home, away: score?.fulltime?.away },
      halfTime: { home: score?.halftime?.home, away: score?.halftime?.away },
    },
    result,
    league: league.name,
    season: league.season,
    round: league.round,
    venue: fixture.venue?.name,
    venue_details: fixture.venue ? {
      id: fixture.venue.id,
      name: fixture.venue.name,
      city: fixture.venue.city,
    } : null,
    metadata: {
      league_id: league.id,
      league_country: league.country,
      league_logo: league.logo,
      referee: fixture.referee,
      timezone: fixture.timezone,
    },
    updated_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from("matches")
    .upsert(matchData, { onConflict: "id" });
  
  if (error) {
    console.error(`[APIFootball] Failed to save match ${fixture.id}:`, error.message);
  }
}
