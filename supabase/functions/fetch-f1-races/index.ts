import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const F1_SEASON = Deno.env.get("F1_SEASON") || "2024";

interface F1Race {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitName: string;
    Location: {
      country: string;
      locality: string;
    };
  };
  date: string;
  time: string;
  Results?: Array<{
    Driver: {
      givenName: string;
      familyName: string;
    };
  }>;
}

async function fetchF1Races(season: string = F1_SEASON) {
  try {
    // Ergast F1 API - completely free, no rate limits
    const url = `https://ergast.com/api/f1/${season}.json`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`F1 API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.MRData.RaceTable.Races || [];
  } catch (error) {
    console.error("Error fetching F1 races:", error);
    return [];
  }
}

async function saveF1Races(races: F1Race[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const race of races) {
    const raceDateTime = `${race.date}T${race.time || '00:00:00'}Z`;
    const winner = race.Results?.[0] ?
      `${race.Results[0].Driver.givenName} ${race.Results[0].Driver.familyName}` :
      null;

    const status = new Date(raceDateTime) < new Date() ? "finished" : "scheduled";

    const { error } = await supabase
      .from("matches")
      .upsert(
        {
          id: `f1-${race.season}-${race.round}`,
          sport: 'formula1',
          event_type: 'race',
          home_team: race.Circuit.circuitName,
          away_team: null, // F1 doesn't have home/away
          kickoff_time: raceDateTime,
          status,
          league: 'Formula 1',
          season: race.season,
          round: `Round ${race.round}`,
          fixture_id: race.round,
          circuit_name: race.Circuit.circuitName,
          venue: `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
          round_info: {
            round: race.round,
            winner: winner
          }
        },
        { onConflict: "id" }
      );

    if (error) console.error(`Error saving F1 race ${race.round}:`, error);
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

    console.log(`🏎️  Fetching F1 ${F1_SEASON} races from Ergast API...`);

    const races = await fetchF1Races(F1_SEASON);
    console.log(`✅ Found ${races.length} F1 races for ${F1_SEASON}`);

    if (races.length > 0) {
      console.log(`💾 Saving ${races.length} F1 races to database...`);
      await saveF1Races(races);
      console.log("✅ F1 races saved successfully");
    }

    return new Response(
      JSON.stringify({
        status: "success",
        raceCount: races.length,
        season: F1_SEASON,
        timestamp: new Date().toISOString(),
        provider: "ergast",
        sport: "formula1"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-f1-races:", error);
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
  console.log(`[env] OK. F1 fetch ready for season ${F1_SEASON}`);
  return { ok: true } as const;
}