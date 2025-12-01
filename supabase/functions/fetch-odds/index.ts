import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY") ?? Deno.env.get("VITE_API_FOOTBALL_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!API_FOOTBALL_KEY) {
  console.error("Missing API_FOOTBALL_KEY environment variable");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MatchRecord {
  id: string;
  fixture_id: number | null;
  league_id: number | null;
  season: number | null;
  kickoff_time: string | null;
}

interface BookmakerOdds {
  bookmaker: string;
  odds_home: number | null;
  odds_draw: number | null;
  odds_away: number | null;
  updated_at: string;
}

const apiRateLimiter = {
  calls: 0,
  reset: Date.now() + 60000,
  async check() {
    const now = Date.now();
    if (now > this.reset) {
      this.calls = 0;
      this.reset = now + 60000;
    }
    if (this.calls >= 10) {
      const wait = this.reset - now;
      console.log(`⏳ API-Football rate limit reached. Waiting ${wait}ms`);
      await new Promise((resolve) => setTimeout(resolve, wait));
      this.calls = 0;
      this.reset = Date.now() + 60000;
    }
    this.calls += 1;
  },
};

async function apiFootballRequest(endpoint: string, params: Record<string, string | number> = {}) {
  if (!API_FOOTBALL_KEY) {
    throw new Error("API_FOOTBALL_KEY not set");
  }

  await apiRateLimiter.check();
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `https://api-football-v1.p.rapidapi.com/v3${endpoint}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": API_FOOTBALL_KEY,
      "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API-Football error ${response.status}: ${text}`);
  }

  return response.json();
}

function parseBookmakerOdds(data: any): BookmakerOdds[] {
  if (!data?.response || data.response.length === 0) return [];
  const entry = data.response[0];
  const update = entry.update;

  const odds: BookmakerOdds[] = [];
  for (const bookmaker of entry.bookmakers || []) {
    const matchWinnerBet = (bookmaker.bets || []).find(
      (bet: any) => bet.name === "Match Winner" || bet.name === "Winner",
    );
    if (!matchWinnerBet) continue;

    const values = matchWinnerBet.values || [];
    const home = values.find((v: any) => v.value === "Home" || v.value === "1");
    const draw = values.find((v: any) => v.value === "Draw" || v.value === "X");
    const away = values.find((v: any) => v.value === "Away" || v.value === "2");

    odds.push({
      bookmaker: bookmaker.name,
      odds_home: home ? Number(home.odd) : null,
      odds_draw: draw ? Number(draw.odd) : null,
      odds_away: away ? Number(away.odd) : null,
      updated_at: update,
    });
  }

  return odds;
}

async function fetchMatchesNeedingOdds(limit: number): Promise<MatchRecord[]> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // next 7 days

  const { data, error } = await supabase
    .from("matches")
    .select("id, fixture_id, league_id, season, kickoff_time")
    .eq("status", "scheduled")
    .gte("kickoff_time", now.toISOString())
    .lte("kickoff_time", horizon.toISOString())
    .not("fixture_id", "is", null)
    .order("kickoff_time", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return data as MatchRecord[];
}

async function refreshOddsForMatch(match: MatchRecord) {
  if (!match.fixture_id) return null;

  const data = await apiFootballRequest("/odds", {
    fixture: match.fixture_id,
  });

  const bookmakerOdds = parseBookmakerOdds(data);
  if (bookmakerOdds.length === 0) {
    console.log(`⚠️  No odds returned for fixture ${match.fixture_id}`);
    return null;
  }

  await supabase.from("odds").delete().eq("match_id", match.id);

  const inserts = bookmakerOdds.map((entry) => ({
    match_id: match.id,
    bookmaker: entry.bookmaker,
    odds_home: entry.odds_home,
    odds_draw: entry.odds_draw,
    odds_away: entry.odds_away,
    fetched_at: entry.updated_at ? new Date(entry.updated_at).toISOString() : new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from("odds").insert(inserts);
  if (insertError) {
    throw new Error(`Failed to insert odds: ${insertError.message}`);
  }

  const validOdds = bookmakerOdds.filter((o) => o.odds_home && o.odds_away);
  if (validOdds.length > 0) {
    const avg = (key: "odds_home" | "odds_draw" | "odds_away") => {
      const values = validOdds.map((o) => o[key]).filter((v) => typeof v === "number") as number[];
      if (values.length === 0) return null;
      const total = values.reduce((sum, value) => sum + value, 0);
      return Number((total / values.length).toFixed(2));
    };

    await supabase
      .from("matches")
      .update({
        odds_home: avg("odds_home"),
        odds_draw: avg("odds_draw"),
        odds_away: avg("odds_away"),
        odds_source: "api-football",
        odds_updated_at: new Date().toISOString(),
      })
      .eq("id", match.id);
  }

  return { matchId: match.id, bookmakers: bookmakerOdds.length };
}

serve(async (req) => {
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
    if (!API_FOOTBALL_KEY) {
      throw new Error("API_FOOTBALL_KEY environment variable not set");
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || "6");

    const matches = await fetchMatchesNeedingOdds(limit);
    const results = [];

    for (const match of matches) {
      try {
        const result = await refreshOddsForMatch(match);
        if (result) {
          results.push(result);
        }
      } catch (err) {
        console.error(`Failed to refresh odds for ${match.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        matchesProcessed: matches.length,
        matchesWithOdds: results.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error in fetch-odds:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});