// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FOOTBALL_DATA_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");

// League code mapping
const LEAGUE_CODES: Record<string, number> = {
  'PL': 2021,   // Premier League
  'BL1': 2002,  // Bundesliga
  'SA': 2019,   // Serie A
  'PD': 2014,   // La Liga
  'FL1': 2015,  // Ligue 1
  'CL': 2001,   // Champions League
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const leagueCode = url.searchParams.get("league") || "PL";
    const season = url.searchParams.get("season") || "2024";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Try to get from database first
    const { data: cached, error: cacheError } = await supabase
      .from('standings')
      .select('standings_data, created_at')
      .eq('league_code', leagueCode)
      .eq('season', season)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if cache is fresh (less than 1 hour old)
    if (cached && !cacheError) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      if (cacheAge < 3600000) { // 1 hour
        console.log(`Returning cached standings for ${leagueCode}`);
        return new Response(
          JSON.stringify(cached.standings_data),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch from API if no cache or cache is stale
    if (!FOOTBALL_DATA_API_KEY) {
      // Return cached data even if stale, or empty array
      return new Response(
        JSON.stringify(cached?.standings_data || []),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leagueId = LEAGUE_CODES[leagueCode];
    if (!leagueId) {
      return new Response(
        JSON.stringify({ error: "Unknown league code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching fresh standings for ${leagueCode} from API`);

    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${leagueId}/standings`,
      {
        headers: {
          'X-Auth-Token': FOOTBALL_DATA_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Football-data.org error: ${response.status}`);
      // Return cached data if API fails
      return new Response(
        JSON.stringify(cached?.standings_data || []),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const standings = data.standings?.[0]?.table || [];

    // Transform to our format
    const formattedStandings = standings.map((team: any, index: number) => ({
      rank: team.position || index + 1,
      teamId: team.team.id.toString(),
      teamName: team.team.name,
      logo: team.team.crest || '',
      played: team.playedGames,
      won: team.won,
      drawn: team.draw,
      lost: team.lost,
      points: team.points,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      goalDifference: team.goalDifference,
      form: team.form?.split(',').map((r: string) => r.trim()) || [],
    }));

    // Cache the result
    await supabase.from('standings').upsert({
      league_code: leagueCode,
      league_id: leagueId,
      season: season,
      standings_data: formattedStandings,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'league_code,season'
    }).catch(console.error);

    return new Response(
      JSON.stringify(formattedStandings),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("get-standings error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
