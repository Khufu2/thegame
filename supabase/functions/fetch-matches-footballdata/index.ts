import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FOOTBALL_DATA_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const LEAGUE_IDS = (Deno.env.get('LEAGUE_IDS') || '').trim(); // e.g. "PL,BL1,SA,PD"
const SEASON = (Deno.env.get('SEASON') || '').trim(); // e.g. "2024"

function assertEnv() {
  const missing: string[] = [];
  if (!FOOTBALL_DATA_API_KEY) missing.push('FOOTBALL_DATA_API_KEY');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`[env] Missing: ${missing.join(', ')}`);
    return { ok: false, missing } as const;
  }
  console.log(`[env] OK. keyLen=${(FOOTBALL_DATA_API_KEY || '').length}, leagues="${LEAGUE_IDS}", season="${SEASON}"`);
  return { ok: true } as const;
}

interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  stage?: string;
  homeTeam: { id: number; name: string; shortName?: string; tla?: string };
  awayTeam: { id: number; name: string; shortName?: string; tla?: string };
  score: {
    home?: number | null;
    away?: number | null;
    fullTime?: { home?: number | null; away?: number | null };
    halfTime?: { home?: number | null; away?: number | null };
  };
  competition: {
    id: number;
    name: string;
    code: string;
  };
  season: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday?: number;
  };
}

// Rate limiter: Football-Data.org free tier is 10 requests per minute
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

  if (reqCount >= 10) { // 10 per minute for free tier
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
      'X-Auth-Token': FOOTBALL_DATA_API_KEY || '',
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
  try {
    const res = await rateLimitedFetch(`https://api.football-data.org/v4/matches?status=LIVE`, 'live-matches');

    if (!res.ok) return [];

    const data = await res.json();
    return data.matches || [];
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}

async function fetchUpcomingMatches() {
  try {
    const leagues = LEAGUE_IDS
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (leagues.length === 0) {
      console.log('[upcoming] No leagues configured');
      return [];
    }

    const datesToFetch = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      datesToFetch.push(date.toISOString().split('T')[0]);
    }

    console.log(`[upcoming] Fetching for dates: ${datesToFetch.join(', ')}, leagues: ${leagues.join(', ')}`);

    let allMatches: any[] = [];
    for (const date of datesToFetch) {
      for (const leagueCode of leagues) {
        const url = `https://api.football-data.org/v4/competitions/${leagueCode}/matches?status=SCHEDULED&dateFrom=${date}&dateTo=${date}`;
        const res = await rateLimitedFetch(url, `matches-${leagueCode}-${date}`);

        if (!res.ok) continue;

        const data = await res.json();
        const matches = data.matches || [];
        console.log(`[league ${leagueCode}] date=${date} count=${matches.length}`);
        allMatches.push(...matches);
      }
    }

    // De-duplicate by match id
    const uniqueMatches = new Map<number, any>();
    for (const match of allMatches) {
      if (typeof match.id === 'number' && !uniqueMatches.has(match.id)) {
        uniqueMatches.set(match.id, match);
      }
    }

    return Array.from(uniqueMatches.values());

  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return [];
  }
}

async function saveMatches(matches: Match[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const match of matches) {
    const status =
      match.status === "IN_PLAY" ? "live" :
      match.status === "PAUSED" ? "live" :
      match.status === "FINISHED" ? "finished" :
      "scheduled";

    const hasScore = match.score.fullTime?.home !== null && match.score.fullTime?.home !== undefined &&
                     match.score.fullTime?.away !== null && match.score.fullTime?.away !== undefined;

    const homeScore = hasScore ? match.score.fullTime!.home : match.score.home;
    const awayScore = hasScore ? match.score.fullTime!.away : match.score.away;

    const result = hasScore && status === "finished"
      ? (homeScore! > awayScore! ? "home_win" : awayScore! > homeScore! ? "away_win" : "draw")
      : null;

    const { error } = await supabase
      .from("matches")
      .upsert(
        {
          id: `football-data-${match.id}`,
          league_id: null, // TODO: Map to league uuid
          // Old fields for backward compatibility
          home_team: match.homeTeam.name,
          away_team: match.awayTeam.name,
          kickoff_time: match.utcDate,
          status,
          home_team_score: homeScore,
          away_team_score: awayScore,
          result: status === "finished" ? result : null,
          league: match.competition.name,
          season: match.season.startDate ? new Date(match.season.startDate).getFullYear() : null,
          round: match.matchday ? `Matchday ${match.matchday}` : null,
          fixture_id: match.id,
          home_team_id: match.homeTeam.id,
          away_team_id: match.awayTeam.id,
          // New jsonb fields
          home_team_json: {
            name: match.homeTeam.name,
            id: match.homeTeam.id,
            logo: null // Football-Data.org doesn't provide logos in basic plan
          },
          away_team_json: {
            name: match.awayTeam.name,
            id: match.awayTeam.id,
            logo: null
          },
          score: {
            home: homeScore,
            away: awayScore
          },
          venue: null, // Not provided in matches endpoint
          venue_details: null,
          metadata: {
            fixture_id: match.id,
            league: match.competition.name,
            league_code: match.competition.code,
            season: match.season.startDate ? new Date(match.season.startDate).getFullYear() : null,
            round: match.matchday ? `Matchday ${match.matchday}` : null,
            result: status === "finished" ? result : null
          }
        },
        { onConflict: "id" }
      );

    if (error) console.error(`Error saving match ${match.id}:`, error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
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

    console.log("🔴 Fetching LIVE matches from Football-Data.org...");
    const liveMatches = await fetchLiveMatches();
    console.log(`✅ Found ${liveMatches.length} live matches`);

    console.log("📅 Fetching UPCOMING matches from Football-Data.org...");
    const upcomingMatches = await fetchUpcomingMatches();
    console.log(`✅ Found ${upcomingMatches.length} upcoming matches`);

    const allMatches = [...liveMatches, ...upcomingMatches];

    if (allMatches.length > 0) {
      console.log(`💾 Saving ${allMatches.length} matches to database...`);
      await saveMatches(allMatches);
      console.log("✅ Matches saved successfully");
    }

    return new Response(
      JSON.stringify({
        status: "success",
        liveCount: liveMatches.length,
        upcomingCount: upcomingMatches.length,
        timestamp: new Date().toISOString(),
        provider: "football-data"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-matches-footballdata:", error);
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