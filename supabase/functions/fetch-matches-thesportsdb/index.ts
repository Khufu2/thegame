import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const LEAGUE_IDS = (Deno.env.get('THESPORTSDB_LEAGUE_IDS') || '').trim(); // e.g. "4328,4331,4332,4334" (Premier League, La Liga, etc.)
const SEASON = (Deno.env.get('SEASON') || '').trim(); // e.g. "2024-2025"

function assertEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`[env] Missing: ${missing.join(', ')}`);
    return { ok: false, missing } as const;
  }
  console.log(`[env] OK. leagues="${LEAGUE_IDS}", season="${SEASON}"`);
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
}

// TheSportsDB has no rate limits mentioned, but be conservative
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

  if (reqCount >= 30) { // Conservative limit
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
  try {
    const res = await rateLimitedFetch('https://www.thesportsdb.com/api/v1/json/3/eventslive.php', 'live-matches');

    if (!res.ok) return [];

    const data = await res.json();
    const events = data.events || [];

    // Filter for soccer/football events
    return events.filter((e: any) => e.strSport === 'Soccer');
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

    console.log(`[upcoming] Fetching for leagues: ${leagues.join(', ')}`);

    let allMatches: any[] = [];
    for (const leagueId of leagues) {
      const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`;
      const res = await rateLimitedFetch(url, `upcoming-${leagueId}`);

      if (!res.ok) continue;

      const data = await res.json();
      const events = data.events || [];
      console.log(`[league ${leagueId}] count=${events.length}`);
      allMatches.push(...events);
    }

    // Limit to next 50 matches to avoid too much data
    return allMatches.slice(0, 50);

  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return [];
  }
}

async function saveMatches(matches: Match[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const match of matches) {
    const kickoffTime = `${match.dateEvent}T${match.strTime || '00:00:00'}Z`;

    const status =
      match.strStatus === "Match Finished" ? "finished" :
      match.strStatus === "Not Started" ? "scheduled" :
      "scheduled"; // TheSportsDB doesn't have live status

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
          fixture_id: parseInt(match.idEvent),
          home_team: match.strHomeTeam,
          away_team: match.strAwayTeam,
          kickoff_time: kickoffTime,
          status,
          home_team_score: homeScore,
          away_team_score: awayScore,
          result,
          league: match.strLeague,
          league_id: parseInt(match.idLeague),
          season: match.strSeason,
          home_team_logo: match.strHomeTeamBadge,
          away_team_logo: match.strAwayTeamBadge,
        },
        { onConflict: "id" }
      );

    if (error) console.error(`Error saving match ${match.idEvent}:`, error);
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

    console.log("🔴 Fetching LIVE matches from TheSportsDB...");
    const liveMatches = await fetchLiveMatches();
    console.log(`✅ Found ${liveMatches.length} live matches`);

    console.log("📅 Fetching UPCOMING matches from TheSportsDB...");
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
        provider: "thesportsdb"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
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