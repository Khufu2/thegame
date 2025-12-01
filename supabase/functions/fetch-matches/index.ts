import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface Match {
  id: string;
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
    };
    venue?: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
  teams: {
    home: { id: number; name: string; logo: string | null };
    away: { id: number; name: string; logo: string | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

// Rate limiter: max 10 requests per minute
let requestCount = 0;
let lastReset = Date.now();

async function rateLimitedFetch(url: string) {
  const now = Date.now();
  if (now - lastReset > 60000) {
    requestCount = 0;
    lastReset = now;
  }

  if (requestCount >= 10) {
    const waitTime = 60000 - (now - lastReset);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    requestCount = 0;
    lastReset = Date.now();
  }

  requestCount++;
  return fetch(url.url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_FOOTBALL_KEY,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      'Accept': 'application/json'
    }
  });
}

async function fetchLiveMatches() {
  try {
    const res = await rateLimitedFetch({
      url: "https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all"
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    return data.response || [];
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}

async function fetchUpcomingMatches(daysAhead = 7) {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const fromDate = now.toISOString().split("T")[0];
    const toDate = futureDate.toISOString().split("T")[0];

    const res = await rateLimitedFetch({
      url: `https://api-football-v1.p.rapidapi.com/v3/fixtures?from=${fromDate}&to=${toDate}&status=NS`
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    return data.response || [];
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return [];
  }
}

async function saveMatches(matches: Match[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const match of matches) {
    const status =
      match.fixture.status.short === "NS"
        ? "scheduled"
        : match.fixture.status.short === "1H" ||
            match.fixture.status.short === "2H" ||
            match.fixture.status.short === "ET"
          ? "live"
          : "finished";

    const hasScore =
      match.goals.home !== null &&
      match.goals.home !== undefined &&
      match.goals.away !== null &&
      match.goals.away !== undefined;
    const result = hasScore
      ? match.goals.home > match.goals.away
        ? "home_win"
        : match.goals.away > match.goals.home
          ? "away_win"
          : "draw"
      : null;

    const { error } = await supabase
      .from("matches")
      .upsert(
        {
          id: `match-${match.fixture.id}`,
          fixture_id: match.fixture.id,
          home_team: match.teams.home.name,
          home_team_id: match.teams.home.id,
          home_team_logo: match.teams.home.logo,
          away_team: match.teams.away.name,
          away_team_id: match.teams.away.id,
          away_team_logo: match.teams.away.logo,
          kickoff_time: new Date(match.fixture.date).toISOString(),
          status,
          home_team_score: match.goals.home,
          away_team_score: match.goals.away,
          result: status === "finished" ? result : null,
          league: match.league.name,
          league_id: match.league.id,
          season: match.fixture.date ? new Date(match.fixture.date).getFullYear() : null,
          round: match.league?.round || null,
          venue_id: match.fixture.venue?.id || null,
          venue_name: match.fixture.venue?.name || null,
          venue_city: match.fixture.venue?.city || null,
          venue_country: match.league.country,
          odds_home: match.odds?.home ?? null,
          odds_draw: match.odds?.draw ?? null,
          odds_away: match.odds?.away ?? null,
        },
        { onConflict: "id" }
      );

    if (error) console.error(`Error saving match ${match.fixture.id}:`, error);
  }
}

serve(async (req) => {
  // CORS headers
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
    console.log("🔴 Fetching LIVE matches...");
    const liveMatches = await fetchLiveMatches();
    console.log(`✅ Found ${liveMatches.length} live matches`);

    console.log("📅 Fetching UPCOMING matches (7 days)...");
    const upcomingMatches = await fetchUpcomingMatches(7);
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
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-matches:", error);
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
