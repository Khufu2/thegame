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

// Extended league coverage for SportMonks
// Check your subscription tier for available leagues
const LEAGUES = {
  // Free tier leagues
  'Danish Superliga': 271,
  'Scottish Premiership': 501,
  // Additional leagues (may require higher tier)
  'English Premier League': 8,
  'German Bundesliga': 82,
  'Italian Serie A': 384,
  'Spanish La Liga': 564,
  'French Ligue 1': 301,
  'Dutch Eredivisie': 72,
  'Portuguese Primeira Liga': 462,
  'Belgian Pro League': 27,
};

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  console.log(`[cache:hit] ${key}`);
  return cached.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

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
          'Authorization': SPORTMONKS_API_KEY!,
          'Accept': 'application/json'
        }
      });

      if (response.status === 429) {
        // Rate limited, wait longer
        const waitTime = 2000 * (i + 1);
        console.log(`[rateLimit] 429 received, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (response.status === 403) {
        console.warn(`[auth] 403 Forbidden - check API key or subscription tier`);
        return null;
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
  return null;
}

async function fetchUpcomingFixtures(leagueId: number, leagueName: string): Promise<SportMonksFixture[]> {
  const cacheKey = `sm-upcoming-${leagueId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Get today's date and 14 days from now
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `${BASE_URL}/fixtures?filters=fixtureLeagues:${leagueId};fixtureStartDate:${today};fixtureEndDate:${future}&include=participants;venue&per_page=50`;

    console.log(`[${leagueName}] Fetching upcoming fixtures...`);
    const data = await fetchWithRetry(url);

    if (!data || !data.data) {
      console.warn(`[${leagueName}] No data returned`);
      return [];
    }

    console.log(`[${leagueName}] Found ${data.data.length} upcoming fixtures`);
    setCache(cacheKey, data.data);
    return data.data;
  } catch (error) {
    console.error(`[${leagueName}] Error fetching fixtures:`, error);
    return [];
  }
}

async function fetchLiveFixtures(): Promise<SportMonksFixture[]> {
  const cacheKey = 'sm-live';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/livescores/inplay?include=participants;venue`;
    
    console.log('[live] Fetching live fixtures...');
    const data = await fetchWithRetry(url);

    if (!data || !data.data) {
      console.warn('[live] No data returned');
      return [];
    }

    console.log(`[live] Found ${data.data.length} live fixtures`);
    setCache(cacheKey, data.data);
    return data.data;
  } catch (error) {
    console.error('[live] Error fetching fixtures:', error);
    return [];
  }
}

async function fetchLeagueStandings(leagueId: number, seasonId: number): Promise<any[]> {
  const cacheKey = `sm-standings-${leagueId}-${seasonId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/standings/seasons/${seasonId}?include=participant`;
    const data = await fetchWithRetry(url);
    
    if (!data || !data.data) return [];
    
    setCache(cacheKey, data.data);
    return data.data;
  } catch (error) {
    console.error(`Error fetching standings for league ${leagueId}:`, error);
    return [];
  }
}

function transformFixture(fixture: SportMonksFixture, leagueName: string) {
  const statusMap: Record<string, string> = {
    'NS': 'scheduled',
    'LIVE': 'live',
    '1H': 'live',
    '2H': 'live',
    'HT': 'live',
    'FT': 'finished',
    'AET': 'finished',
    'PEN': 'finished',
    'PST': 'postponed',
    'CANC': 'cancelled',
    'ABD': 'cancelled',
    'SUSP': 'postponed'
  };

  const homeTeam = fixture.participants?.find((p: any) => p.meta?.location === 'home');
  const awayTeam = fixture.participants?.find((p: any) => p.meta?.location === 'away');

  const status = statusMap[fixture.status] || 'scheduled';
  const hasScore = fixture.home_score !== null && fixture.away_score !== null && status === 'finished';
  const result = hasScore
    ? (fixture.home_score > fixture.away_score ? 'home_win' : 
       fixture.away_score > fixture.home_score ? 'away_win' : 'draw')
    : null;

  return {
    id: `sportmonks-${fixture.id}`,
    league: leagueName,
    home_team: homeTeam?.name || 'Unknown',
    away_team: awayTeam?.name || 'Unknown',
    home_team_id: fixture.home_team_id,
    away_team_id: fixture.away_team_id,
    home_team_score: fixture.home_score,
    away_team_score: fixture.away_score,
    kickoff_time: fixture.starting_at,
    status: status,
    result: status === 'finished' ? result : null,
    venue: fixture.details?.venue?.name || null,
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
    score: {
      home: fixture.home_score,
      away: fixture.away_score
    },
    metadata: {
      sportmonks_id: fixture.id,
      league_id: fixture.league_id,
      season_id: fixture.season_id,
      source: 'sportmonks'
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

    console.log('Fetching SportMonks data...');

    const results: any[] = [];
    let totalSaved = 0;

    // Fetch live fixtures first
    console.log('🔴 Fetching live fixtures...');
    const liveFixtures = await fetchLiveFixtures();
    console.log(`✅ Found ${liveFixtures.length} live fixtures`);

    // Save live fixtures
    for (const fixture of liveFixtures) {
      const leagueName = Object.entries(LEAGUES).find(([_, id]) => id === fixture.league_id)?.[0] || 'Unknown League';
      const transformed = transformFixture(fixture, leagueName);
      
      const { error } = await supabase
        .from('matches')
        .upsert(transformed, { onConflict: 'id' });

      if (!error) totalSaved++;
    }

    // Fetch from configured leagues
    for (const [leagueName, leagueId] of Object.entries(LEAGUES)) {
      if (leagueParam && leagueParam !== leagueName) continue;

      console.log(`📅 Fetching ${leagueName}...`);

      try {
        const fixtures = await fetchUpcomingFixtures(leagueId, leagueName);

        // Transform and save fixtures
        for (const fixture of fixtures) {
          const transformed = transformFixture(fixture, leagueName);

          const { error } = await supabase
            .from('matches')
            .upsert(transformed, { onConflict: 'id' });

          if (!error) totalSaved++;
          else console.error(`Error saving ${transformed.id}:`, error.message);
        }

        results.push({
          league: leagueName,
          fixtures: fixtures.length
        });

        // Small delay between leagues
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing ${leagueName}:`, error);
        results.push({
          league: leagueName,
          error: error.message
        });
      }
    }

    console.log(`✅ Saved ${totalSaved} total fixtures`);

    return new Response(
      JSON.stringify({
        message: 'SportMonks data fetched successfully',
        liveCount: liveFixtures.length,
        totalSaved,
        results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes
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