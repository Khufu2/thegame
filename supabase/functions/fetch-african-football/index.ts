// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FOOTBALL_DATA_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");
// African leagues: CAF Champions League, AFCON qualifiers, local leagues
const AFRICAN_LEAGUES = (Deno.env.get('AFRICAN_LEAGUES') || 'CL,EC').trim(); // CAF CL, Europa Conference

interface AfricanMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: { home: number | null; away: number | null };
  competition: { name: string; code: string };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitedFetch(url: string, label?: string) {
  // Conservative rate limiting for free tier
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': FOOTBALL_DATA_API_KEY || '',
      'Accept': 'application/json'
    },
  });

  if (!response.ok && response.status !== 429) {
    console.warn(`African football API error: ${response.status} for ${label}`);
  }

  return response;
}

async function fetchCAFMatches() {
  try {
    const matches: AfricanMatch[] = [];

    // Try Football-Data.org for CAF competitions (limited free access)
    for (const league of AFRICAN_LEAGUES.split(',')) {
      try {
        const url = `https://api.football-data.org/v4/competitions/${league.trim()}/matches?status=SCHEDULED&limit=10`;
        const response = await rateLimitedFetch(url, `CAF-${league}`);

        if (response.ok) {
          const data = await response.json();
          matches.push(...(data.matches || []));
        }

        // Rate limiting - wait between requests
        await sleep(2000);
      } catch (error) {
        console.warn(`Error fetching CAF league ${league}:`, error);
      }
    }

    return matches;
  } catch (error) {
    console.error("Error fetching CAF matches:", error);
    return [];
  }
}

async function fetchLocalAfricanLeagues() {
  try {
    // TheSportsDB has some African leagues
    const africanLeagues = [
      { id: '4348', name: 'South African Premier League' },
      { id: '4350', name: 'Egyptian Premier League' },
      { id: '4351', name: 'Moroccan Botola' }
    ];

    const matches: any[] = [];

    for (const league of africanLeagues) {
      try {
        // Get next league events
        const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${league.id}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          const leagueMatches = (data.events || []).map((match: any) => ({
            ...match,
            competition: { name: league.name, code: league.id }
          }));
          matches.push(...leagueMatches);
        }

        await sleep(1000); // Respectful delay
      } catch (error) {
        console.warn(`Error fetching ${league.name}:`, error);
      }
    }

    return matches;
  } catch (error) {
    console.error("Error fetching local African leagues:", error);
    return [];
  }
}

async function saveAfricanMatches(matches: any[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const match of matches) {
    let kickoffTime: string;
    let homeTeam: string;
    let awayTeam: string;
    let homeScore: number | null = null;
    let awayScore: number | null = null;
    let league: string;
    let fixtureId: string;

    // Handle different API formats
    if (match.utcDate) {
      // Football-Data.org format
      kickoffTime = match.utcDate;
      homeTeam = match.homeTeam.name;
      awayTeam = match.awayTeam.name;
      homeScore = match.score.home;
      awayScore = match.score.away;
      league = match.competition.name;
      fixtureId = match.id.toString();
    } else {
      // TheSportsDB format
      kickoffTime = `${match.dateEvent}T${match.strTime || '00:00:00'}Z`;
      homeTeam = match.strHomeTeam;
      awayTeam = match.strAwayTeam;
      homeScore = match.intHomeScore ? parseInt(match.intHomeScore) : null;
      awayScore = match.intAwayScore ? parseInt(match.intAwayScore) : null;
      league = match.competition?.name || match.strLeague || 'African Football';
      fixtureId = match.idEvent || match.id;
    }

    const status =
      match.status === "FINISHED" || match.strStatus === "Match Finished" ? "finished" :
      match.status === "IN_PLAY" || match.strStatus === "Live" ? "live" :
      "scheduled";

    const { error } = await supabase
      .from("matches")
      .upsert(
        {
          id: `african-${fixtureId}`,
          sport: 'soccer',
          home_team: homeTeam,
          away_team: awayTeam,
          kickoff_time: kickoffTime,
          status,
          home_team_score: homeScore,
          away_team_score: awayScore,
          league,
          season: new Date().getFullYear().toString(),
          fixture_id: fixtureId,
        },
        { onConflict: "id" }
      );

    if (error) console.error(`Error saving African match ${fixtureId}:`, error);
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

    console.log("⚽ Fetching African football matches...");

    // Fetch CAF competitions (Champions League, etc.)
    const cafMatches = await fetchCAFMatches();
    console.log(`✅ Found ${cafMatches.length} CAF matches`);

    // Fetch local African leagues
    const localMatches = await fetchLocalAfricanLeagues();
    console.log(`✅ Found ${localMatches.length} local African league matches`);

    const allMatches = [...cafMatches, ...localMatches];

    if (allMatches.length > 0) {
      console.log(`💾 Saving ${allMatches.length} African football matches to database...`);
      await saveAfricanMatches(allMatches);
      console.log("✅ African football matches saved successfully");
    }

    return new Response(
      JSON.stringify({
        status: "success",
        cafCount: cafMatches.length,
        localCount: localMatches.length,
        totalCount: allMatches.length,
        timestamp: new Date().toISOString(),
        providers: ["football-data", "thesportsdb"],
        sport: "soccer",
        region: "africa"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-african-football:", error);
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

function assertEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`[env] Missing: ${missing.join(', ')}`);
    return { ok: false, missing } as const;
  }
  console.log(`[env] OK. African football fetch ready`);
  return { ok: true } as const;
}