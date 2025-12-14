// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Extended league coverage - TheSportsDB league IDs (free API)
// These are soccer leagues available on the free tier
const DEFAULT_LEAGUES = [
  // Top European Leagues
  { id: 4328, name: 'English Premier League' },
  { id: 4331, name: 'German Bundesliga' },
  { id: 4332, name: 'Italian Serie A' },
  { id: 4335, name: 'Spanish La Liga' },
  { id: 4334, name: 'French Ligue 1' },
  // Secondary leagues
  { id: 4329, name: 'English Championship' },
  { id: 4337, name: 'Portuguese Primeira Liga' },
  { id: 4344, name: 'Dutch Eredivisie' },
  { id: 4359, name: 'Scottish Premiership' },
  // African leagues
  { id: 4841, name: 'Tanzanian Premier League' },
  { id: 4609, name: 'Kenyan Premier League' },
  { id: 4696, name: 'Nigerian Professional Football League' },
  // South American
  { id: 4406, name: 'Brazilian Serie A' },
  { id: 4480, name: 'Argentine Primera División' }
];

const LEAGUE_IDS = Deno.env.get('THESPORTSDB_LEAGUE_IDS') 
  ? Deno.env.get('THESPORTSDB_LEAGUE_IDS')!.split(',').map(id => ({
      id: parseInt(id.trim()),
      name: `League ${id.trim()}`
    }))
  : DEFAULT_LEAGUES;

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  console.log(`[cache:hit] ${key}`);
  return cached.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function assertEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`[env] Missing: ${missing.join(', ')}`);
    return { ok: false, missing } as const;
  }
  console.log(`[env] OK. leagues=${LEAGUE_IDS.length}`);
  return { ok: true } as const;
}

interface Match {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string;
  intAwayScore?: string;
  dateEvent: string;
  strTime: string;
  strStatus?: string;
  strLeague: string;
  idLeague: string;
  strSeason: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  strVenue?: string;
  strThumb?: string;
}

// TheSportsDB has no strict rate limits but be conservative
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

  if (reqCount >= 50) { // Conservative limit
    const wait = 60_000 - (now - windowStart) + 200;
    console.log(`[rateLimit] Waiting ${wait}ms before calling ${label}`);
    await sleep(wait);
    reqCount = 0;
    windowStart = Date.now();
  }

  reqCount++;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.warn(`[fetch:${label}] status=${res.status}, body="${body.slice(0,180)}"`);
  }

  return res;
}

async function fetchLiveMatches() {
  const cacheKey = 'sportsdb-live';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await rateLimitedFetch('https://www.thesportsdb.com/api/v1/json/3/eventslive.php', 'live-matches');

    if (!res.ok) return [];

    const data = await res.json();
    const events = data.events || [];

    // Filter for soccer/football events
    const soccerEvents = events.filter((e: any) => e.strSport === 'Soccer');
    setCache(cacheKey, soccerEvents);
    return soccerEvents;
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}

async function fetchPastMatches(leagueId: number, leagueName: string) {
  const cacheKey = `sportsdb-past-${leagueId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${leagueId}`;
    const res = await rateLimitedFetch(url, `past-${leagueId}`);

    if (!res.ok) return [];

    const data = await res.json();
    const events = data.events || [];
    console.log(`[past ${leagueName}] Found ${events.length} matches`);
    setCache(cacheKey, events);
    return events;
  } catch (error) {
    console.error(`Error fetching past matches for ${leagueName}:`, error);
    return [];
  }
}

async function fetchUpcomingMatches(leagueId: number, leagueName: string) {
  const cacheKey = `sportsdb-upcoming-${leagueId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`;
    const res = await rateLimitedFetch(url, `upcoming-${leagueId}`);

    if (!res.ok) return [];

    const data = await res.json();
    const events = data.events || [];
    console.log(`[upcoming ${leagueName}] Found ${events.length} matches`);
    setCache(cacheKey, events);
    return events;
  } catch (error) {
    console.error(`Error fetching upcoming matches for ${leagueName}:`, error);
    return [];
  }
}

async function fetchTeamDetails(teamName: string): Promise<any> {
  const cacheKey = `sportsdb-team-${teamName}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const res = await rateLimitedFetch(url, `team-${teamName}`);

    if (!res.ok) return null;

    const data = await res.json();
    const teams = data.teams || [];
    const team = teams.find((t: any) => 
      t.strTeam?.toLowerCase() === teamName.toLowerCase() ||
      t.strTeamShort?.toLowerCase() === teamName.toLowerCase()
    ) || teams[0];

    if (team) {
      setCache(cacheKey, team);
    }
    return team || null;
  } catch (error) {
    console.error(`Error fetching team details for ${teamName}:`, error);
    return null;
  }
}

async function saveMatches(matches: Match[]) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  let savedCount = 0;
  let errorCount = 0;

  for (const match of matches) {
    const kickoffTime = `${match.dateEvent}T${match.strTime || '12:00:00'}Z`;

    const status =
      match.strStatus === "Match Finished" || match.strStatus === "FT" ? "finished" :
      match.strStatus === "Not Started" || match.strStatus === "NS" ? "scheduled" :
      match.strStatus?.includes("'") ? "live" : // Live match shows minute like "45'"
      "scheduled";

    const homeScore = match.intHomeScore ? parseInt(match.intHomeScore) : null;
    const awayScore = match.intAwayScore ? parseInt(match.intAwayScore) : null;

    const hasScore = homeScore !== null && awayScore !== null && status === "finished";
    const result = hasScore
      ? (homeScore! > awayScore! ? "home_win" : awayScore! > homeScore! ? "away_win" : "draw")
      : null;

    const { error } = await supabase
      .from("matches")
      .upsert(
        {
          id: `thesportsdb-${match.idEvent}`,
          league_id: null,
          home_team: match.strHomeTeam,
          away_team: match.strAwayTeam,
          kickoff_time: kickoffTime,
          status,
          home_team_score: homeScore,
          away_team_score: awayScore,
          result: status === "finished" ? result : null,
          league: match.strLeague,
          season: match.strSeason,
          fixture_id: parseInt(match.idEvent),
          venue: match.strVenue || null,
          home_team_json: {
            name: match.strHomeTeam,
            id: null,
            logo: match.strHomeTeamBadge || null,
            crest: match.strHomeTeamBadge || null
          },
          away_team_json: {
            name: match.strAwayTeam,
            id: null,
            logo: match.strAwayTeamBadge || null,
            crest: match.strAwayTeamBadge || null
          },
          score: {
            home: homeScore,
            away: awayScore
          },
          venue_details: match.strVenue ? { name: match.strVenue } : null,
          metadata: {
            fixture_id: parseInt(match.idEvent),
            league: match.strLeague,
            league_id: parseInt(match.idLeague),
            season: match.strSeason,
            result: status === "finished" ? result : null,
            thumbnail: match.strThumb || null,
            source: 'thesportsdb'
          }
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error(`Error saving match ${match.idEvent}:`, error.message);
      errorCount++;
    } else {
      savedCount++;
    }
  }

  console.log(`[save] Saved ${savedCount} matches, ${errorCount} errors`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const envOk = assertEnv();
    if (!envOk.ok) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables', missing: envOk.missing }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log("🔴 Fetching LIVE matches from TheSportsDB...");
    const liveMatches = await fetchLiveMatches();
    console.log(`✅ Found ${liveMatches.length} live matches`);

    let allUpcoming: any[] = [];
    let allPast: any[] = [];

    // Fetch from all configured leagues
    console.log(`📅 Fetching matches from ${LEAGUE_IDS.length} leagues...`);
    for (const league of LEAGUE_IDS) {
      const upcoming = await fetchUpcomingMatches(league.id, league.name);
      const past = await fetchPastMatches(league.id, league.name);
      allUpcoming.push(...upcoming);
      allPast.push(...past);
      
      // Small delay between leagues to be nice to the API
      await sleep(100);
    }

    console.log(`✅ Found ${allUpcoming.length} upcoming, ${allPast.length} past matches`);

    const allMatches = [...liveMatches, ...allUpcoming, ...allPast];

    // De-duplicate by event ID
    const uniqueMatches = new Map<string, any>();
    for (const match of allMatches) {
      if (match.idEvent && !uniqueMatches.has(match.idEvent)) {
        uniqueMatches.set(match.idEvent, match);
      }
    }

    const dedupedMatches = Array.from(uniqueMatches.values());

    if (dedupedMatches.length > 0) {
      console.log(`💾 Saving ${dedupedMatches.length} unique matches to database...`);
      await saveMatches(dedupedMatches);
      console.log("✅ Matches saved successfully");
    }

    return new Response(
      JSON.stringify({
        status: "success",
        liveCount: liveMatches.length,
        upcomingCount: allUpcoming.length,
        pastCount: allPast.length,
        totalSaved: dedupedMatches.length,
        leagues: LEAGUE_IDS.length,
        timestamp: new Date().toISOString(),
        provider: "thesportsdb"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300" // Cache response for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-matches-thesportsdb:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});