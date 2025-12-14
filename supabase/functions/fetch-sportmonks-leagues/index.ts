// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SportMonks API configuration
const SPORTMONKS_API_KEY = Deno.env.get('SPORTMONKS_API_KEY');
const BASE_URL = 'https://api.sportmonks.com/v3/football';

// League IDs for free tier
const LEAGUES = {
  'Danish Superliga': 271,
  'Scottish Premiership': 501
};

interface SportMonksFixture {
  id: number;
  name: string;
  starting_at: string;
  result_info: string;
  league_id: number;
  season_id: number;
  stage_id: number;
  round_id: number;
  aggregate_id: number;
  venue_id: number;
  referee_id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number;
  away_score: number;
  status: string;
  details: any;
  standings: any;
  events: any[];
  stats: any[];
  lineups: any[];
  predictions: any;
  weather: any;
  participants: any[];
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': SPORTMONKS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response.status === 429) {
        // Rate limited, wait longer
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function fetchLeagueFixtures(leagueId: number, season: string): Promise<SportMonksFixture[]> {
  const fixtures: SportMonksFixture[] = [];
  let page = 1;
  const perPage = 50;

  while (true) {
    const url = `${BASE_URL}/fixtures?league_id=${leagueId}&season_id=${season}&per_page=${perPage}&page=${page}&include=participants;venue;referee;events;stats;lineups;predictions;weather`;

    try {
      const data = await fetchWithRetry(url);

      if (!data.data || data.data.length === 0) break;

      fixtures.push(...data.data);

      if (data.pagination?.has_more !== true) break;

      page++;

      // Rate limiting - 180 calls per hour = ~3 per minute, so 20 second delay
      await new Promise(resolve => setTimeout(resolve, 20000));

    } catch (error) {
      console.error(`Error fetching fixtures for league ${leagueId}, page ${page}:`, error);
      break;
    }
  }

  return fixtures;
}

async function fetchLeagueStandings(leagueId: number, season: string): Promise<any[]> {
  const url = `${BASE_URL}/standings?league_id=${leagueId}&season_id=${season}`;
  try {
    const data = await fetchWithRetry(url);
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching standings for league ${leagueId}:`, error);
    return [];
  }
}

async function fetchLeagueTopScorers(leagueId: number, season: string): Promise<any[]> {
  const url = `${BASE_URL}/topscorers?league_id=${leagueId}&season_id=${season}`;
  try {
    const data = await fetchWithRetry(url);
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching top scorers for league ${leagueId}:`, error);
    return [];
  }
}

function transformFixture(fixture: SportMonksFixture, leagueName: string) {
  const statusMap: Record<string, string> = {
    'NS': 'SCHEDULED',
    'LIVE': 'LIVE',
    'FT': 'FINISHED',
    'HT': 'LIVE',
    'PST': 'POSTPONED',
    'CANC': 'CANCELLED'
  };

  const homeTeam = fixture.participants?.find(p => p.id === fixture.home_team_id);
  const awayTeam = fixture.participants?.find(p => p.id === fixture.away_team_id);

  return {
    id: `sm_${fixture.id}`,
    league: leagueName,
    home_team: homeTeam?.name || 'Unknown',
    away_team: awayTeam?.name || 'Unknown',
    home_team_id: fixture.home_team_id,
    away_team_id: fixture.away_team_id,
    home_team_score: fixture.home_score,
    away_team_score: fixture.away_score,
    kickoff_time: fixture.starting_at,
    status: statusMap[fixture.status] || 'SCHEDULED',
    venue: fixture.details?.venue?.name,
    referee: fixture.details?.referee?.name,
    events: fixture.events || [],
    stats: fixture.stats || [],
    lineups: fixture.lineups || [],
    predictions: fixture.predictions,
    weather: fixture.weather,
    home_team_json: {
      id: fixture.home_team_id,
      name: homeTeam?.name,
      logo: homeTeam?.image_path,
      crest: homeTeam?.image_path
    },
    away_team_json: {
      id: fixture.away_team_id,
      name: awayTeam?.name,
      logo: awayTeam?.image_path,
      crest: awayTeam?.image_path
    },
    metadata: {
      sportmonks_id: fixture.id,
      league_id: fixture.league_id,
      season_id: fixture.season_id
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SPORTMONKS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'SportMonks API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const leagueParam = url.searchParams.get('league');
    const season = url.searchParams.get('season') || '2024'; // Default to current season

    console.log('Fetching SportMonks data for:', { league: leagueParam, season });

    const results = [];

    for (const [leagueName, leagueId] of Object.entries(LEAGUES)) {
      if (leagueParam && leagueParam !== leagueName) continue;

      console.log(`Fetching ${leagueName} (ID: ${leagueId})`);

      try {
        // Fetch fixtures
        const fixtures = await fetchLeagueFixtures(leagueId, season);
        console.log(`Fetched ${fixtures.length} fixtures for ${leagueName}`);

        // Fetch standings
        const standings = await fetchLeagueStandings(leagueId, season);
        console.log(`Fetched standings for ${leagueName}`);

        // Fetch top scorers
        const topScorers = await fetchLeagueTopScorers(leagueId, season);
        console.log(`Fetched top scorers for ${leagueName}`);

        // Transform and save fixtures
        const transformedFixtures = fixtures.map(f => transformFixture(f, leagueName));

        // Save to database
        for (const fixture of transformedFixtures) {
          const { error } = await supabase
            .from('matches')
            .upsert(fixture, {
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`Error saving fixture ${fixture.id}:`, error);
          }
        }

        // Save standings (you might want a separate table for this)
        // For now, we'll store in metadata or create a standings table

        results.push({
          league: leagueName,
          fixtures: transformedFixtures.length,
          standings: standings.length,
          topScorers: topScorers.length
        });

        // Rate limiting between leagues
        await new Promise(resolve => setTimeout(resolve, 30000));

      } catch (error) {
        console.error(`Error processing ${leagueName}:`, error);
        results.push({
          league: leagueName,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'SportMonks data fetched successfully',
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in fetch-sportmonks-leagues:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});