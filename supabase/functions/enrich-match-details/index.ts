// @ts-nocheck
/**
 * Match Details Enricher using TheSportsDB (FREE) and cached DB data
 * Fetches timeline, statistics and lineups without consuming paid API quotas
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory cache for match details (5 min TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// TheSportsDB (free) event lookup
async function fetchTheSportsDBEvent(eventId: string): Promise<any | null> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${eventId}`;
    console.log(`[TheSportsDB] Fetching event ${eventId}`);
    
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.events?.[0] || null;
  } catch (e) {
    console.error("[TheSportsDB] Error:", e);
    return null;
  }
}

// Search for event by teams and date - improved matching
async function searchTheSportsDBEvent(homeTeam: string, awayTeam: string, date: string): Promise<any | null> {
  try {
    // Clean team names - remove common suffixes/prefixes
    const cleanName = (name: string) => 
      name.replace(/ FC$/, '')
          .replace(/ CF$/, '')
          .replace(/^FC /, '')
          .replace(/ SC$/, '')
          .replace(/ United$/, '')
          .replace(/ City$/, '')
          .trim();
    
    const home = cleanName(homeTeam);
    const away = cleanName(awayTeam);
    
    // Try searching by home team first
    const url1 = `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(home)}&d=${date}`;
    console.log(`[TheSportsDB] Searching: ${home} on ${date}`);
    
    const res1 = await fetch(url1);
    if (res1.ok) {
      const data1 = await res1.json();
      const events1 = data1.event || [];
      
      // Find matching event with away team
      const awayLower = away.toLowerCase();
      const match1 = events1.find((e: any) => 
        e.strAwayTeam?.toLowerCase().includes(awayLower) || 
        awayLower.includes(e.strAwayTeam?.toLowerCase()?.replace(/ fc$/i, '')?.trim() || '')
      );
      
      if (match1) return match1;
    }
    
    // Try searching by away team as fallback
    const url2 = `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(away)}&d=${date}`;
    console.log(`[TheSportsDB] Fallback search: ${away} on ${date}`);
    
    const res2 = await fetch(url2);
    if (res2.ok) {
      const data2 = await res2.json();
      const events2 = data2.event || [];
      
      // Find matching event with home team
      const homeLower = home.toLowerCase();
      const match2 = events2.find((e: any) => 
        e.strHomeTeam?.toLowerCase().includes(homeLower) || 
        homeLower.includes(e.strHomeTeam?.toLowerCase()?.replace(/ fc$/i, '')?.trim() || '')
      );
      
      if (match2) return match2;
    }
    
    return null;
  } catch (e) {
    console.error("[TheSportsDB] Search error:", e);
    return null;
  }
}

// Parse timeline from TheSportsDB event
function parseTimeline(event: any): any[] {
  const timeline: any[] = [];
  
  // TheSportsDB stores goal details in strHomeGoalDetails and strAwayGoalDetails
  const parseGoals = (details: string, isHome: boolean) => {
    if (!details) return;
    // Format: "Player Name:45';Another Player:67'"
    details.split(';').forEach((goal, idx) => {
      const match = goal.match(/(.+?):(\d+)/);
      if (match) {
        timeline.push({
          id: `goal-${isHome ? 'home' : 'away'}-${idx}`,
          type: 'GOAL',
          minute: `${match[2]}'`,
          player: match[1].trim(),
          team: isHome ? event.strHomeTeam : event.strAwayTeam,
          description: `Goal! ${match[1].trim()}`
        });
      }
    });
  };
  
  parseGoals(event.strHomeGoalDetails, true);
  parseGoals(event.strAwayGoalDetails, false);
  
  // Parse cards if available
  const parseCards = (details: string, isHome: boolean, cardType: string) => {
    if (!details) return;
    details.split(';').forEach((card, idx) => {
      const match = card.match(/(.+?):(\d+)/);
      if (match) {
        timeline.push({
          id: `card-${cardType}-${isHome ? 'home' : 'away'}-${idx}`,
          type: 'CARD',
          cardType,
          minute: `${match[2]}'`,
          player: match[1].trim(),
          team: isHome ? event.strHomeTeam : event.strAwayTeam,
          description: `${cardType} card for ${match[1].trim()}`
        });
      }
    });
  };
  
  parseCards(event.strHomeYellowCards, true, 'YELLOW');
  parseCards(event.strAwayYellowCards, false, 'YELLOW');
  parseCards(event.strHomeRedCards, true, 'RED');
  parseCards(event.strAwayRedCards, false, 'RED');
  
  // Sort by minute
  timeline.sort((a, b) => {
    const minA = parseInt(a.minute) || 0;
    const minB = parseInt(b.minute) || 0;
    return minA - minB;
  });
  
  return timeline;
}

// Generate basic stats from event data
function generateStats(event: any): any {
  // TheSportsDB free tier has limited stats, but we can derive some
  const homeScore = parseInt(event.intHomeScore) || 0;
  const awayScore = parseInt(event.intAwayScore) || 0;
  
  return {
    possession: { home: 50, away: 50 }, // Not available in free API
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    yellowCards: { 
      home: (event.strHomeYellowCards?.split(';').filter(Boolean).length) || 0,
      away: (event.strAwayYellowCards?.split(';').filter(Boolean).length) || 0
    },
    redCards: {
      home: (event.strHomeRedCards?.split(';').filter(Boolean).length) || 0,
      away: (event.strAwayRedCards?.split(';').filter(Boolean).length) || 0
    },
    // Calculate goals from score
    goals: { home: homeScore, away: awayScore }
  };
}

// Parse lineups from event
function parseLineups(event: any): any | null {
  const parseTeamLineup = (lineupStr: string, formation: string, teamName: string) => {
    if (!lineupStr) return null;
    
    const players = lineupStr.split(';').filter(Boolean).map((name, idx) => ({
      id: `player-${idx}`,
      name: name.trim(),
      number: idx + 1,
      position: idx === 0 ? 'GK' : (idx < 5 ? 'DEF' : (idx < 8 ? 'MID' : 'FWD'))
    }));
    
    return {
      formation: formation || '4-4-2',
      team: teamName,
      starting: players.slice(0, 11),
      subs: players.slice(11)
    };
  };
  
  const homeLineup = parseTeamLineup(
    event.strHomeLineupGoalkeeper + ';' + event.strHomeLineupDefense + ';' + 
    event.strHomeLineupMidfield + ';' + event.strHomeLineupForward,
    event.strHomeFormation,
    event.strHomeTeam
  );
  
  const awayLineup = parseTeamLineup(
    event.strAwayLineupGoalkeeper + ';' + event.strAwayLineupDefense + ';' + 
    event.strAwayLineupMidfield + ';' + event.strAwayLineupForward,
    event.strAwayFormation,
    event.strAwayTeam
  );
  
  if (!homeLineup && !awayLineup) return null;
  
  return { home: homeLineup, away: awayLineup };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const matchId = url.searchParams.get("matchId");
    const fixtureId = url.searchParams.get("fixtureId");
    
    if (!matchId && !fixtureId) {
      throw new Error("matchId or fixtureId required");
    }

    // Check cache first
    const cacheKey = matchId || fixtureId || '';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache] Hit for ${cacheKey}`);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    
    // Get match from database first
    let dbMatch: any = null;
    if (matchId) {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();
      dbMatch = data;
    }
    
    // If we already have enriched data in DB, return it
    if (dbMatch?.timeline?.length > 0 || dbMatch?.stats || dbMatch?.lineups) {
      const result = {
        success: true,
        source: "database",
        matchId: dbMatch.id,
        timeline: dbMatch.timeline || [],
        stats: dbMatch.stats,
        lineups: dbMatch.lineups,
      };
      
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Try to enrich from TheSportsDB
    let sportsDbEvent: any = null;
    
    // If we have TheSportsDB event ID in metadata
    const eventId = dbMatch?.metadata?.thesportsdb_id || dbMatch?.metadata?.event_id;
    if (eventId) {
      sportsDbEvent = await fetchTheSportsDBEvent(eventId);
    }
    
    // Otherwise search by team names and date
    if (!sportsDbEvent && dbMatch) {
      const matchDate = dbMatch.kickoff_time?.split('T')[0];
      if (matchDate) {
        sportsDbEvent = await searchTheSportsDBEvent(
          dbMatch.home_team,
          dbMatch.away_team,
          matchDate
        );
      }
    }
    
    let timeline: any[] = [];
    let stats: any = null;
    let lineups: any = null;
    
    if (sportsDbEvent) {
      console.log(`[TheSportsDB] Found event: ${sportsDbEvent.strEvent}`);
      timeline = parseTimeline(sportsDbEvent);
      stats = generateStats(sportsDbEvent);
      lineups = parseLineups(sportsDbEvent);
      
      // Update match in database with enriched data
      if (matchId && (timeline.length > 0 || stats || lineups)) {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (timeline.length > 0) updateData.timeline = timeline;
        if (stats) updateData.stats = stats;
        if (lineups) updateData.lineups = lineups;
        
        // Store TheSportsDB event ID for future lookups
        if (!eventId) {
          updateData.metadata = {
            ...(dbMatch?.metadata || {}),
            thesportsdb_id: sportsDbEvent.idEvent
          };
        }
        
        await supabase
          .from("matches")
          .update(updateData)
          .eq("id", matchId);
        
        console.log(`[EnrichMatch] Updated match ${matchId} with TheSportsDB data`);
      }
    } else {
      console.log("[EnrichMatch] No TheSportsDB data found, using DB fallback");
    }

    const result = {
      success: true,
      source: sportsDbEvent ? "thesportsdb" : "database",
      matchId: matchId || fixtureId,
      timeline,
      stats,
      lineups,
    };
    
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return new Response(
      JSON.stringify(result),
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
