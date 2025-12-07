// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MatchForWeather {
  id: string;
  fixture_id: number | null;
  kickoff_time: string | null;
  venue_city: string | null;
  venue_country: string | null;
  weather_last_checked: string | null;
}

async function fetchMatchesNeedingWeather(limit: number): Promise<MatchForWeather[]> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // next 4 hours

  const { data, error } = await supabase
    .from("matches")
    .select("id, fixture_id, kickoff_time, venue_city, venue_country, weather_last_checked")
    .in("status", ["scheduled", "live"])
    .gte("kickoff_time", now.toISOString())
    .lte("kickoff_time", windowEnd.toISOString())
    .order("kickoff_time", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase weather query failed: ${error.message}`);
  }

  return data as MatchForWeather[];
}

async function fetchWeatherForCity(city: string, country?: string) {
  if (!OPENWEATHER_API_KEY) throw new Error("OPENWEATHER_API_KEY not set");

  const query = country ? `${city},${country}` : city;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    query,
  )}&appid=${OPENWEATHER_API_KEY}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenWeather error ${response.status}: ${text}`);
  }

  return response.json();
}

async function upsertWeather(match: MatchForWeather, weather: any) {
  const payload = {
    match_id: match.id,
    fixture_id: match.fixture_id,
    temperature: weather.main?.temp ?? null,
    humidity: weather.main?.humidity ?? null,
    wind_speed: weather.wind?.speed ?? null,
    conditions: weather.weather?.[0]?.description ?? null,
    icon: weather.weather?.[0]?.icon ?? null,
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("match_weather")
    .upsert(payload, { onConflict: "match_id" });

  await supabase
    .from("matches")
    .update({
      weather_last_checked: new Date().toISOString(),
    })
    .eq("id", match.id);
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
    if (!OPENWEATHER_API_KEY) {
      throw new Error("OPENWEATHER_API_KEY environment variable not set");
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || "6");

    const matches = await fetchMatchesNeedingWeather(limit);
    const results = [];

    for (const match of matches) {
      if (!match.venue_city) continue;
      try {
        const weather = await fetchWeatherForCity(match.venue_city, match.venue_country ?? undefined);
        await upsertWeather(match, weather);
        results.push({ matchId: match.id, city: match.venue_city });
      } catch (err) {
        console.error(`Failed to fetch weather for ${match.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        matchesProcessed: matches.length,
        matchesUpdated: results.length,
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
    console.error("Error in fetch-weather:", error);
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

