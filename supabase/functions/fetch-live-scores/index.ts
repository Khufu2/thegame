// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FOOTBALL_DATA_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Parse timeline events from API match data
function parseTimelineEvents(matchData: any): any[] {
  const events: any[] = [];
  const goals = matchData.goals || [];
  const bookings = matchData.bookings || [];
  const substitutions = matchData.substitutions || [];
  
  // Process goals
  if (Array.isArray(goals)) {
    goals.forEach((goal: any, idx: number) => {
      events.push({
        id: `goal-${idx}`,
        type: 'GOAL',
        minute: `${goal.minute}'`,
        teamId: goal.team?.id,
        player: goal.scorer?.name || 'Unknown',
        subPlayer: goal.assist?.name || null,
        description: goal.assist?.name 
          ? `Goal! ${goal.scorer?.name} (Assist: ${goal.assist?.name})`
          : `Goal! ${goal.scorer?.name}`,
        timestamp: Date.now() - (90 - goal.minute) * 60000
      });
    });
  }
  
  // Process bookings (cards)
  if (Array.isArray(bookings)) {
    bookings.forEach((booking: any, idx: number) => {
      events.push({
        id: `card-${idx}`,
        type: 'CARD',
        minute: `${booking.minute}'`,
        teamId: booking.team?.id,
        player: booking.player?.name || 'Unknown',
        description: `${booking.card === 'YELLOW' ? 'Yellow' : 'Red'} card for ${booking.player?.name}`,
        cardType: booking.card,
        timestamp: Date.now() - (90 - booking.minute) * 60000
      });
    });
  }
  
  // Process substitutions
  if (Array.isArray(substitutions)) {
    substitutions.forEach((sub: any, idx: number) => {
      events.push({
        id: `sub-${idx}`,
        type: 'SUB',
        minute: `${sub.minute}'`,
        teamId: sub.team?.id,
        player: sub.playerIn?.name || 'Unknown',
        subPlayer: sub.playerOut?.name || 'Unknown',
        description: `Substitution: ${sub.playerIn?.name} replaces ${sub.playerOut?.name}`,
        timestamp: Date.now() - (90 - sub.minute) * 60000
      });
    });
  }
  
  // Sort by minute
  events.sort((a, b) => {
    const minA = parseInt(a.minute) || 0;
    const minB = parseInt(b.minute) || 0;
    return minB - minA; // Most recent first
  });
  
  return events;
}

// Parse match statistics
function parseMatchStats(statistics: any[]): any {
  if (!statistics || !Array.isArray(statistics) || statistics.length < 2) {
    return null;
  }
  
  const homeStats = statistics[0]?.statistics || [];
  const awayStats = statistics[1]?.statistics || [];
  
  const findStat = (stats: any[], type: string) => {
    const stat = stats.find((s: any) => s.type === type);
    return stat?.value ?? 0;
  };
  
  const parsePercent = (val: any) => {
    if (typeof val === 'string' && val.includes('%')) {
      return parseInt(val.replace('%', '')) || 0;
    }
    return parseInt(val) || 0;
  };
  
  return {
    possession: {
      home: parsePercent(findStat(homeStats, 'Ball Possession')),
      away: parsePercent(findStat(awayStats, 'Ball Possession'))
    },
    shots: {
      home: parseInt(findStat(homeStats, 'Total Shots')) || 0,
      away: parseInt(findStat(awayStats, 'Total Shots')) || 0
    },
    shotsOnTarget: {
      home: parseInt(findStat(homeStats, 'Shots on Goal')) || 0,
      away: parseInt(findStat(awayStats, 'Shots on Goal')) || 0
    },
    shotsOffTarget: {
      home: parseInt(findStat(homeStats, 'Shots off Goal')) || 0,
      away: parseInt(findStat(awayStats, 'Shots off Goal')) || 0
    },
    corners: {
      home: parseInt(findStat(homeStats, 'Corner Kicks')) || 0,
      away: parseInt(findStat(awayStats, 'Corner Kicks')) || 0
    },
    fouls: {
      home: parseInt(findStat(homeStats, 'Fouls')) || 0,
      away: parseInt(findStat(awayStats, 'Fouls')) || 0
    },
    yellowCards: {
      home: parseInt(findStat(homeStats, 'Yellow Cards')) || 0,
      away: parseInt(findStat(awayStats, 'Yellow Cards')) || 0
    },
    redCards: {
      home: parseInt(findStat(homeStats, 'Red Cards')) || 0,
      away: parseInt(findStat(awayStats, 'Red Cards')) || 0
    },
    offsides: {
      home: parseInt(findStat(homeStats, 'Offsides')) || 0,
      away: parseInt(findStat(awayStats, 'Offsides')) || 0
    },
    saves: {
      home: parseInt(findStat(homeStats, 'Goalkeeper Saves')) || 0,
      away: parseInt(findStat(awayStats, 'Goalkeeper Saves')) || 0
    },
    passes: {
      home: parseInt(findStat(homeStats, 'Total passes')) || 0,
      away: parseInt(findStat(awayStats, 'Total passes')) || 0
    },
    passesCompleted: {
      home: parseInt(findStat(homeStats, 'Passes accurate')) || 0,
      away: parseInt(findStat(awayStats, 'Passes accurate')) || 0
    },
    expectedGoals: {
      home: parseFloat(findStat(homeStats, 'expected_goals')) || 0,
      away: parseFloat(findStat(awayStats, 'expected_goals')) || 0
    }
  };
}

// Parse lineups from API data
function parseLineups(lineups: any[]): any {
  if (!lineups || !Array.isArray(lineups) || lineups.length < 2) {
    return null;
  }
  
  const homeLineup = lineups[0];
  const awayLineup = lineups[1];
  
  const parseTeamLineup = (lineup: any) => {
    const startXI = lineup.startXI || [];
    const substitutes = lineup.substitutes || [];
    
    return {
      formation: lineup.formation || '4-4-2',
      coach: lineup.coach?.name || 'Unknown',
      starting: startXI.map((p: any, idx: number) => ({
        id: `player-${p.player?.id || idx}`,
        name: p.player?.name || 'Unknown',
        number: p.player?.number || idx + 1,
        position: p.player?.pos || 'Unknown',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${p.player?.name || 'Player'}`
      })),
      subs: substitutes.slice(0, 7).map((p: any, idx: number) => ({
        id: `sub-${p.player?.id || idx}`,
        name: p.player?.name || 'Unknown',
        number: p.player?.number || idx + 12,
        position: p.player?.pos || 'SUB',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${p.player?.name || 'Player'}`
      }))
    };
  };
  
  return {
    home: parseTeamLineup(homeLineup),
    away: parseTeamLineup(awayLineup)
  };
}

// Fetch live match data and update database
async function fetchAndUpdateLiveMatches() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  
  // Get all live matches from database
  const { data: liveMatches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'live');
  
  if (error) {
    console.error('Error fetching live matches:', error);
    return { updated: 0, matches: [] };
  }
  
  if (!liveMatches || liveMatches.length === 0) {
    console.log('No live matches to update');
    return { updated: 0, matches: [] };
  }
  
  console.log(`Found ${liveMatches.length} live matches to update`);
  
  let updatedCount = 0;
  const updatedMatches: any[] = [];
  
  for (const match of liveMatches) {
    if (!match.fixture_id || !FOOTBALL_DATA_API_KEY) {
      continue;
    }
    
    try {
      // Fetch match details from Football-Data.org
      const res = await rateLimitedFetch(
        `https://api.football-data.org/v4/matches/${match.fixture_id}`,
        `match-${match.fixture_id}`
      );
      
      if (!res.ok) {
        console.warn(`Failed to fetch match ${match.fixture_id}: ${res.status}`);
        continue;
      }
      
      const matchData = await res.json();
      
      // Parse data
      const timeline = parseTimelineEvents(matchData);
      const stats = parseMatchStats(matchData.statistics);
      const lineups = parseLineups(matchData.lineups);
      
      // Determine new status
      const apiStatus = matchData.status;
      let newStatus = match.status;
      if (apiStatus === 'FINISHED' || apiStatus === 'FT') {
        newStatus = 'finished';
      } else if (['IN_PLAY', 'PAUSED', 'HALFTIME', '1H', '2H', 'HT'].includes(apiStatus)) {
        newStatus = 'live';
      }
      
      // Update match in database
      const updateData: any = {
        home_team_score: matchData.score?.fullTime?.home ?? matchData.score?.home ?? match.home_team_score,
        away_team_score: matchData.score?.fullTime?.away ?? matchData.score?.away ?? match.away_team_score,
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Only update if we have data
      if (timeline.length > 0) {
        updateData.timeline = timeline;
      }
      if (stats) {
        updateData.stats = stats;
      }
      if (lineups) {
        updateData.lineups = lineups;
      }
      
      // Calculate result if finished
      if (newStatus === 'finished' && updateData.home_team_score !== null && updateData.away_team_score !== null) {
        if (updateData.home_team_score > updateData.away_team_score) {
          updateData.result = 'home_win';
        } else if (updateData.away_team_score > updateData.home_team_score) {
          updateData.result = 'away_win';
        } else {
          updateData.result = 'draw';
        }
      }
      
      const { error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', match.id);
      
      if (updateError) {
        console.error(`Error updating match ${match.id}:`, updateError);
      } else {
        updatedCount++;
        updatedMatches.push({
          id: match.id,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          score: `${updateData.home_team_score}-${updateData.away_team_score}`,
          status: newStatus,
          eventsCount: timeline.length
        });
        console.log(`Updated match ${match.id}: ${match.home_team} ${updateData.home_team_score}-${updateData.away_team_score} ${match.away_team}`);
      }
    } catch (err) {
      console.error(`Error processing match ${match.id}:`, err);
    }
  }
  
  return { updated: updatedCount, matches: updatedMatches };
}

// Fetch single match details for client polling
async function fetchSingleMatchDetails(matchId: string) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  
  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle();
  
  if (error || !match) {
    return null;
  }
  
  // If match is live and has fixture_id, try to get fresh data
  if (match.status === 'live' && match.fixture_id && FOOTBALL_DATA_API_KEY) {
    try {
      const res = await rateLimitedFetch(
        `https://api.football-data.org/v4/matches/${match.fixture_id}`,
        `single-match-${match.fixture_id}`
      );
      
      if (res.ok) {
        const matchData = await res.json();
        const timeline = parseTimelineEvents(matchData);
        const stats = parseMatchStats(matchData.statistics);
        const lineups = parseLineups(matchData.lineups);
        
        // Return enriched data without saving (for quick polling)
        return {
          ...match,
          home_team_score: matchData.score?.fullTime?.home ?? matchData.score?.home ?? match.home_team_score,
          away_team_score: matchData.score?.fullTime?.away ?? matchData.score?.away ?? match.away_team_score,
          timeline: timeline.length > 0 ? timeline : match.timeline,
          stats: stats || match.stats,
          lineups: lineups || match.lineups,
          lastPolled: new Date().toISOString()
        };
      }
    } catch (err) {
      console.error(`Error fetching fresh data for ${matchId}:`, err);
    }
  }
  
  return {
    ...match,
    lastPolled: new Date().toISOString()
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const matchId = url.searchParams.get("matchId");
    const mode = url.searchParams.get("mode") || "batch";
    
    // Single match polling mode
    if (matchId) {
      console.log(`Polling single match: ${matchId}`);
      const matchData = await fetchSingleMatchDetails(matchId);
      
      if (!matchData) {
        return new Response(
          JSON.stringify({ error: "Match not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({
          match: {
            id: matchData.id,
            homeTeam: matchData.home_team,
            awayTeam: matchData.away_team,
            homeScore: matchData.home_team_score,
            awayScore: matchData.away_team_score,
            status: matchData.status,
            timeline: matchData.timeline || [],
            stats: matchData.stats,
            lineups: matchData.lineups,
            lastPolled: matchData.lastPolled
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Batch update mode (for cron job)
    console.log("Running batch live score update...");
    const result = await fetchAndUpdateLiveMatches();
    
    return new Response(
      JSON.stringify({
        status: "success",
        updated: result.updated,
        matches: result.matches,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-live-scores:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
