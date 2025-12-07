// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// #region Environment Variables
const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");
const API_FOOTBALL_PROVIDER = (Deno.env.get("API_FOOTBALL_PROVIDER") || "apisports").toLowerCase();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ODDS_BOOKMAKER_ID = Deno.env.get("ODDS_BOOKMAKER_ID") || "8"; // Default to Bet365
const ODDS_BET_ID = Deno.env.get("ODDS_BET_ID") || "1"; // Default to Match Winner
// #endregion

// #region Rate Limiter
let reqCount = 0;
let windowStart = Date.now();

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitedFetch(opts: { url: string; label?: string; maxPerMinute?: number; retries?: number }) {
  const label = opts.label || "api-football-odds";
  const limit = opts.maxPerMinute ?? 6;
  const maxRetries = opts.retries ?? 4;

  const now = Date.now();
  if (now - windowStart > 60_000) {
    reqCount = 0;
    windowStart = now;
  }

  if (reqCount >= limit) {
    const wait = 60_000 - (now - windowStart) + 200;
    console.log(`[rateLimit] Waiting ${wait}ms before calling ${label}`);
    await sleep(wait);
    reqCount = 0;
    windowStart = Date.now();
  }

  let attempt = 0;
  while (attempt <= maxRetries) {
    reqCount++;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (API_FOOTBALL_PROVIDER === "rapidapi") {
      headers["X-RapidAPI-Key"] = API_FOOTBALL_KEY || "";
      headers["X-RapidAPI-Host"] = "api-football-v1.p.rapidapi.com";
    } else {
      headers["x-apisports-key"] = API_FOOTBALL_KEY || "";
    }

    const res = await fetch(opts.url, { method: "GET", headers });

    if (res.ok) return res;

    const status = res.status;
    let bodyText = "";
    try { bodyText = await res.text(); } catch {}
    console.warn(`[fetch:${label}] status=${status}, attempt=${attempt}/${maxRetries}, body="${(bodyText||'').slice(0,180)}"`);

    if (status === 429 || status === 403 || status >= 500) {
      attempt++;
      if (attempt > maxRetries) return res;
      const retryAfter = res.headers.get("retry-after");
      const base = Math.min(1000 * 2 ** attempt, 15_000);
      const jitter = Math.floor(Math.random() * 400);
      const waitMs = retryAfter ? Number(retryAfter) * 1000 : base + jitter;
      await sleep(waitMs);
      continue;
    }
    return res;
  }
  return new Response(null, { status: 500 });
}
// #endregion

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

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // 1. Find upcoming matches that need odds
    const { data: matches, error: queryError } = await supabase
      .from("matches")
      .select("id, fixture_id")
      .eq("status", "scheduled")
      .is("odds_home", null)
      .order("kickoff_time", { ascending: true })
      .limit(20);

    if (queryError) throw new Error(`Supabase query failed: ${queryError.message}`);
    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming matches found needing odds." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${matches.length} matches to fetch odds for.`);

    const base = API_FOOTBALL_PROVIDER === "rapidapi"
      ? "https://api-football-v1.p.rapidapi.com/v3"
      : "https://v3.football.api-sports.io";

    let updatedCount = 0;
    for (const match of matches) {
      const url = `${base}/odds?fixture=${match.fixture_id}&bookmaker=${ODDS_BOOKMAKER_ID}&bet=${ODDS_BET_ID}`;
      const res = await rateLimitedFetch({ url, label: `odds-fixture-${match.fixture_id}` });

      if (!res.ok) {
        console.warn(`Failed to fetch odds for fixture ${match.fixture_id}, status: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const oddsData = data.response?.[0]?.bookmakers?.[0]?.bets?.[0]?.values;

      if (!oddsData || oddsData.length < 3) {
        console.log(`No 'Match Winner' odds found for fixture ${match.fixture_id}`);
        continue;
      }

      const homeOdds = oddsData.find((o: any) => o.value === "Home")?.odd;
      const drawOdds = oddsData.find((o: any) => o.value === "Draw")?.odd;
      const awayOdds = oddsData.find((o: any) => o.value === "Away")?.odd;

      if (homeOdds && drawOdds && awayOdds) {
        const { error: updateError } = await supabase
          .from("matches")
          .update({
            odds_home: parseFloat(homeOdds),
            odds_draw: parseFloat(drawOdds),
            odds_away: parseFloat(awayOdds),
          })
          .eq("id", match.id);

        if (updateError) {
          console.error(`Failed to update odds for match ${match.id}:`, updateError.message);
        } else {
          console.log(`Successfully updated odds for match ${match.id}`);
          updatedCount++;
        }
      }
    }

    return new Response(JSON.stringify({ message: `Odds fetch complete. Updated ${updatedCount} matches.` }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-odds function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});