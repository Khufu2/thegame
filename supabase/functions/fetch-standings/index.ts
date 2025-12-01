import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Major football leagues with their API IDs
const LEAGUES = [
  { id: 39, name: "Premier League", country: "England" },
  { id: 140, name: "La Liga", country: "Spain" },
  { id: 78, name: "Bundesliga", country: "Germany" },
  { id: 135, name: "Serie A", country: "Italy" },
  { id: 61, name: "Ligue 1", country: "France" },
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

async function fetchLeagueStandings(leagueId: number) {
  try {
    const currentSeason = new Date().getFullYear();
    const res = await rateLimitedFetch(
      `https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=${currentSeason}`,
      {
        headers: {
          "x-rapidapi-key": API_FOOTBALL_KEY,
          "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      }
    );

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    return data.response?.[0]?.league?.standings || [];
  } catch (error) {
    console.error(`Error fetching standings for league ${leagueId}:`, error);
    return [];
  }
}

async function saveStandings(
  leagueId: number,
  standings: unknown[][]
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { error } = await supabase
    .from("standings")
    .insert({
      league_id: leagueId,
      standings_data: standings,
      created_at: new Date().toISOString(),
    });

  if (error) console.error(`Error saving standings for league ${leagueId}:`, error);
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
    console.log("🏆 Fetching league standings...");

    for (const league of LEAGUES) {
      console.log(`📊 Fetching standings for ${league.name}...`);
      const standings = await fetchLeagueStandings(league.id);

      if (standings.length > 0) {
        await saveStandings(league.id, standings);
        console.log(`✅ Saved ${standings.length} teams for ${league.name}`);
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
    console.error("Error in fetch-standings:", error);
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
