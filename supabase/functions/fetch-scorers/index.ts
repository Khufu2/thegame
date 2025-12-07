// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const LEAGUES = [
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 78, name: "Bundesliga" },
  { id: 135, name: "Serie A" },
  { id: 61, name: "Ligue 1" },
];

let requestCount = 0;
let lastReset = Date.now();

async function rateLimitedFetch(url: string, options: RequestInit) {
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
  return fetch(url, options);
}

async function fetchTopScorers(leagueId: number, leagueName: string) {
  try {
    const currentSeason = new Date().getFullYear();
    const res = await rateLimitedFetch(
      `https://api-football-v1.p.rapidapi.com/v3/players/topscorers?league=${leagueId}&season=${currentSeason}`,
      {
        headers: {
          "x-rapidapi-key": API_FOOTBALL_KEY,
          "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      }
    );

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();

    // Format top 10 scorers
    const scorers = (data.response || [])
      .slice(0, 10)
      .map((scorer: { player: { id: number; name: string }; statistics: Array<{ goals: { total: number } }> }) => ({
        rank: scorer.player.id,
        player_name: scorer.player.name,
        goals: scorer.statistics?.[0]?.goals?.total || 0,
        league: leagueName,
      }));

    return scorers;
  } catch (error) {
    console.error(
      `Error fetching top scorers for league ${leagueId}:`,
      error
    );
    return [];
  }
}

async function saveScorers(
  leagueName: string,
  scorers: { rank: number; player_name: string; goals: number; league: string }[]
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { error } = await supabase.from("feeds").insert({
    title: `Top Scorers - ${leagueName}`,
    content: JSON.stringify(scorers),
    source: "API-Football",
    type: "stats",
    created_at: new Date().toISOString(),
  });

  if (error) console.error(`Error saving scorers for ${leagueName}:`, error);
}

serve(async (req) => {
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
    console.log("⚽ Fetching top scorers...");

    for (const league of LEAGUES) {
      console.log(`📊 Fetching top scorers for ${league.name}...`);
      const scorers = await fetchTopScorers(league.id, league.name);

      if (scorers.length > 0) {
        await saveScorers(league.name, scorers);
        console.log(`✅ Saved top 10 scorers for ${league.name}`);
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        leaguesProcessed: LEAGUES.length,
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
    console.error("Error in fetch-scorers:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
