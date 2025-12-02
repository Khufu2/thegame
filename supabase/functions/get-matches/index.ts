import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface Match {
  id: string;
  league_id: string | null;
  home_team_json: any;
  away_team_json: any;
  start_time: string;
  status: string;
  score: any;
  venue: string | null;
  venue_details: any;
  metadata: any;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // 'live', 'scheduled', etc.
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = supabase
      .from('matches')
      .select('*')
      .order('start_time', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to frontend format
    const transformedMatches = (data || []).map((match: Match) => ({
      id: match.id,
      league: match.metadata?.league || 'Unknown League',
      homeTeam: match.home_team_json ? {
        id: match.home_team_json.id?.toString() || '',
        name: match.home_team_json.name || 'Unknown',
        logo: match.home_team_json.logo || ''
      } : {
        id: '',
        name: 'Unknown',
        logo: ''
      },
      awayTeam: match.away_team_json ? {
        id: match.away_team_json.id?.toString() || '',
        name: match.away_team_json.name || 'Unknown',
        logo: match.away_team_json.logo || ''
      } : {
        id: '',
        name: 'Unknown',
        logo: ''
      },
      status: match.status === 'live' ? 'LIVE' :
              match.status === 'finished' ? 'FINISHED' : 'SCHEDULED',
      time: formatMatchTime(match.start_time, match.status),
      score: match.score ? {
        home: match.score.home || 0,
        away: match.score.away || 0
      } : undefined,
      venue: match.venue || undefined
    }));

    return new Response(
      JSON.stringify(transformedMatches),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in get-matches:", error);
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

// Helper function to format match time
function formatMatchTime(startTime: string, status: string): string {
  if (status === 'finished') return 'FT';

  const now = new Date();
  const matchTime = new Date(startTime);

  if (status === 'live') {
    const diff = Math.floor((now.getTime() - matchTime.getTime()) / (1000 * 60));
    return `${diff}'`;
  }

  // For scheduled matches, return time like "15:00"
  return matchTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}