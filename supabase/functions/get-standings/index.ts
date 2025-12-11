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

// League code mapping for football-data.org
const FOOTBALL_LEAGUE_CODES: Record<string, number> = {
  'PL': 2021,   // Premier League
  'BL1': 2002,  // Bundesliga
  'SA': 2019,   // Serie A
  'PD': 2014,   // La Liga
  'FL1': 2015,  // Ligue 1
  'CL': 2001,   // Champions League
};

// Sports type detection
const BASKETBALL_LEAGUES = ['NBA'];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let leagueCode = url.searchParams.get("league") || "PL";
    const season = url.searchParams.get("season") || "2024";
    
    // Handle body parameters for POST requests
    if (req.method === "POST") {
      try {
        const body = await req.json();
        leagueCode = body.league || leagueCode;
      } catch (e) {
        // Ignore body parse errors
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Determine sport type
    const isBasketball = BASKETBALL_LEAGUES.includes(leagueCode);

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

    // For basketball leagues, return cached or mock data
    if (isBasketball) {
      console.log(`Returning ${cached ? 'cached' : 'mock'} NBA standings`);
      
      if (cached?.standings_data) {
        return new Response(
          JSON.stringify(cached.standings_data),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Return mock NBA standings if no cache
      const mockNBAStandings = generateMockNBAStandings();
      return new Response(
        JSON.stringify(mockNBAStandings),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from football API if no cache or cache is stale
    if (!FOOTBALL_DATA_API_KEY) {
      // Return cached data even if stale, or empty array
      return new Response(
        JSON.stringify(cached?.standings_data || []),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leagueId = FOOTBALL_LEAGUE_CODES[leagueCode];
    if (!leagueId) {
      console.log(`Unknown league code: ${leagueCode}, returning cached or empty`);
      return new Response(
        JSON.stringify(cached?.standings_data || []),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    const { error: upsertError } = await supabase.from('standings').upsert({
      league_code: leagueCode,
      league_id: leagueId,
      season: season,
      standings_data: formattedStandings,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'league_code,season'
    });
    
    if (upsertError) {
      console.error('Failed to cache standings:', upsertError);
    }

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

function generateMockNBAStandings() {
  const eastTeams = [
    { name: 'Boston Celtics', logo: 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg' },
    { name: 'Cleveland Cavaliers', logo: 'https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg' },
    { name: 'New York Knicks', logo: 'https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg' },
    { name: 'Milwaukee Bucks', logo: 'https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg' },
    { name: 'Orlando Magic', logo: 'https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg' },
    { name: 'Indiana Pacers', logo: 'https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg' },
    { name: 'Philadelphia 76ers', logo: 'https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg' },
    { name: 'Miami Heat', logo: 'https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg' },
    { name: 'Chicago Bulls', logo: 'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg' },
    { name: 'Atlanta Hawks', logo: 'https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg' },
    { name: 'Brooklyn Nets', logo: 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg' },
    { name: 'Toronto Raptors', logo: 'https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg' },
    { name: 'Charlotte Hornets', logo: 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg' },
    { name: 'Detroit Pistons', logo: 'https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg' },
    { name: 'Washington Wizards', logo: 'https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg' },
  ];
  
  return eastTeams.map((team, idx) => {
    const wins = Math.max(1, 30 - idx * 2 + Math.floor(Math.random() * 5));
    const losses = Math.max(1, 10 + idx * 2 + Math.floor(Math.random() * 5));
    const played = wins + losses;
    const winPct = ((wins / played) * 100).toFixed(1);
    
    return {
      rank: idx + 1,
      teamId: `nba-${idx}`,
      teamName: team.name,
      logo: team.logo,
      played,
      won: wins,
      lost: losses,
      winPct: parseFloat(winPct),
      conference: 'Eastern',
      streak: Math.random() > 0.5 ? `W${Math.floor(Math.random() * 5) + 1}` : `L${Math.floor(Math.random() * 3) + 1}`,
    };
  });
}
