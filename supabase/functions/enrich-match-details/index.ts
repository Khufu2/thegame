// @ts-nocheck
/**
 * Enhanced Match Details Fetcher using API-Football
 * Fetches timeline (events), statistics, and lineups for a specific match
 * Use sparingly - each call uses 3 API calls (events, stats, lineups)
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

async function apiFootballFetch(endpoint: string, params: Record<string, string | number> = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  
  const url = `https://v3.football.api-sports.io/${endpoint}?${queryString}`;
  
  console.log(`[APIFootball] Fetching ${endpoint}...`);
  
  const res = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY || "",
    },
  });
  
  if (!res.ok) {
    console.error(`[APIFootball] Error: ${res.status}`);
    return null;
  }
  
  const data = await res.json();
  return data.response || [];
}

// Fetch match events (goals, cards, subs)
async function fetchEvents(fixtureId: number) {
  const events = await apiFootballFetch("fixtures/events", { fixture: fixtureId });
  if (!events) return [];
  
  return events.map((e: any) => ({
    time: e.time.elapsed + (e.time.extra || 0),
    type: e.type.toLowerCase(),
    detail: e.detail,
    team: e.team.name,
    teamId: e.team.id,
    player: e.player?.name,
    assist: e.assist?.name,
    comments: e.comments,
  }));
}

// Fetch match statistics
async function fetchStatistics(fixtureId: number) {
  const stats = await apiFootballFetch("fixtures/statistics", { fixture: fixtureId });
  if (!stats || stats.length < 2) return null;
  
  const homeStats = stats[0];
  const awayStats = stats[1];
  
  const formatStat = (statArray: any[], type: string) => {
    const stat = statArray.find((s: any) => s.type === type);
    return stat?.value ?? 0;
  };
  
  return {
    homeTeam: homeStats.team.name,
    awayTeam: awayStats.team.name,
    possession: {
      home: parseInt(formatStat(homeStats.statistics, "Ball Possession")) || 50,
      away: parseInt(formatStat(awayStats.statistics, "Ball Possession")) || 50,
    },
    shots: {
      home: formatStat(homeStats.statistics, "Total Shots"),
      away: formatStat(awayStats.statistics, "Total Shots"),
    },
    shotsOnTarget: {
      home: formatStat(homeStats.statistics, "Shots on Goal"),
      away: formatStat(awayStats.statistics, "Shots on Goal"),
    },
    corners: {
      home: formatStat(homeStats.statistics, "Corner Kicks"),
      away: formatStat(awayStats.statistics, "Corner Kicks"),
    },
    fouls: {
      home: formatStat(homeStats.statistics, "Fouls"),
      away: formatStat(awayStats.statistics, "Fouls"),
    },
    yellowCards: {
      home: formatStat(homeStats.statistics, "Yellow Cards"),
      away: formatStat(awayStats.statistics, "Yellow Cards"),
    },
    redCards: {
      home: formatStat(homeStats.statistics, "Red Cards"),
      away: formatStat(awayStats.statistics, "Red Cards"),
    },
    passes: {
      home: formatStat(homeStats.statistics, "Total passes"),
      away: formatStat(awayStats.statistics, "Total passes"),
    },
    passAccuracy: {
      home: parseInt(formatStat(homeStats.statistics, "Passes %")) || 0,
      away: parseInt(formatStat(awayStats.statistics, "Passes %")) || 0,
    },
  };
}

// Fetch match lineups
async function fetchLineups(fixtureId: number) {
  const lineups = await apiFootballFetch("fixtures/lineups", { fixture: fixtureId });
  if (!lineups || lineups.length < 2) return null;
  
  const formatLineup = (lineup: any) => ({
    team: lineup.team.name,
    teamId: lineup.team.id,
    teamLogo: lineup.team.logo,
    formation: lineup.formation,
    coach: lineup.coach?.name,
    startXI: lineup.startXI?.map((p: any) => ({
      id: p.player.id,
      name: p.player.name,
      number: p.player.number,
      pos: p.player.pos,
      grid: p.player.grid,
    })) || [],
    substitutes: lineup.substitutes?.map((p: any) => ({
      id: p.player.id,
      name: p.player.name,
      number: p.player.number,
      pos: p.player.pos,
    })) || [],
  });
  
  return {
    home: formatLineup(lineups[0]),
    away: formatLineup(lineups[1]),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!API_FOOTBALL_KEY) {
      throw new Error("API_FOOTBALL_KEY not configured");
    }

    const url = new URL(req.url);
    const matchId = url.searchParams.get("matchId");
    const fixtureId = url.searchParams.get("fixtureId");
    
    if (!matchId && !fixtureId) {
      throw new Error("matchId or fixtureId required");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    
    // Get fixture ID from match if not provided
    let actualFixtureId = fixtureId ? parseInt(fixtureId) : null;
    
    if (!actualFixtureId && matchId) {
      const { data: match } = await supabase
        .from("matches")
        .select("fixture_id")
        .eq("id", matchId)
        .maybeSingle();
      
      actualFixtureId = match?.fixture_id;
    }
    
    if (!actualFixtureId) {
      throw new Error("Could not determine fixture ID");
    }

    console.log(`[EnrichMatch] Fetching details for fixture ${actualFixtureId}`);

    // Fetch all data in parallel
    const [events, statistics, lineups] = await Promise.all([
      fetchEvents(actualFixtureId),
      fetchStatistics(actualFixtureId),
      fetchLineups(actualFixtureId),
    ]);

    // Update match in database with enriched data
    if (matchId) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (events && events.length > 0) {
        updateData.timeline = events;
      }
      if (statistics) {
        updateData.stats = statistics;
      }
      if (lineups) {
        updateData.lineups = lineups;
      }
      
      const { error } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", matchId);
      
      if (error) {
        console.error("[EnrichMatch] Failed to update match:", error);
      } else {
        console.log("[EnrichMatch] Match updated successfully");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fixtureId: actualFixtureId,
        timeline: events,
        stats: statistics,
        lineups,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[EnrichMatch] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
