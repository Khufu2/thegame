// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Team strength ratings based on real-world data (higher = stronger)
const TEAM_RATINGS: Record<string, number> = {
  // Premier League - Updated Dec 2024
  'Manchester City FC': 92,
  'Liverpool FC': 91,
  'Arsenal FC': 89,
  'Chelsea FC': 84,
  'Manchester United FC': 80,
  'Tottenham Hotspur FC': 81,
  'Newcastle United FC': 82,
  'Brighton & Hove Albion FC': 78,
  'Aston Villa FC': 80,
  'West Ham United FC': 76,
  'Fulham FC': 75,
  'Crystal Palace FC': 72,
  'Brentford FC': 74,
  'Wolverhampton Wanderers FC': 71,
  'AFC Bournemouth': 73,
  'Nottingham Forest FC': 75,
  'Everton FC': 70,
  'Leicester City FC': 73,
  'Ipswich Town FC': 64,
  'Southampton FC': 62,
  // La Liga
  'Real Madrid CF': 92,
  'FC Barcelona': 91,
  'Atlético de Madrid': 85,
  'Athletic Club': 81,
  'Real Sociedad de Fútbol': 79,
  'Real Betis Balompié': 77,
  'Villarreal CF': 78,
  'Sevilla FC': 76,
  // Serie A
  'SSC Napoli': 86,
  'FC Internazionale Milano': 88,
  'AC Milan': 84,
  'Juventus FC': 83,
  'AS Roma': 79,
  'SS Lazio': 78,
  'Atalanta BC': 84,
  // Bundesliga
  'FC Bayern München': 90,
  'Borussia Dortmund': 85,
  'RB Leipzig': 83,
  'Bayer 04 Leverkusen': 87,
  'VfB Stuttgart': 79,
  // Ligue 1
  'Paris Saint-Germain FC': 89,
  'AS Monaco FC': 80,
  'Olympique de Marseille': 78,
  'Olympique Lyonnais': 77,
};

const HOME_ADVANTAGE = 4;

function getTeamRating(teamName: string): number {
  if (TEAM_RATINGS[teamName]) return TEAM_RATINGS[teamName];
  
  const normalizedName = teamName.toLowerCase();
  for (const [key, value] of Object.entries(TEAM_RATINGS)) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes(normalizedName) || normalizedName.includes(keyLower.split(' ')[0])) {
      return value;
    }
  }
  
  return 70;
}

interface PredictionResult {
  outcome: 'HOME' | 'AWAY' | 'DRAW';
  winner: string;
  confidence: number;
  predictedScore: { home: number; away: number };
  scorePrediction: string;
  reasoning: string;
  aiReasoning: string;
  keyInsight: string;
  bettingAngle: string;
  insights: string[];
  bettingAngles: string[];
  odds: { home: number; draw: number; away: number };
  probability: { home: number; draw: number; away: number };
  isValuePick: boolean;
  riskLevel: string;
  modelEdge: number;
  systemRecord: string;
}

function generateSmartPrediction(homeTeam: string, awayTeam: string, dbOdds?: { home?: number; draw?: number; away?: number }): PredictionResult {
  const homeRating = getTeamRating(homeTeam) + HOME_ADVANTAGE;
  const awayRating = getTeamRating(awayTeam);
  
  const ratingDiff = homeRating - awayRating;
  const totalRating = homeRating + awayRating;
  
  // Calculate win probabilities using Elo-style formula
  const expectedHome = 1 / (1 + Math.pow(10, (awayRating - homeRating) / 400));
  const expectedAway = 1 - expectedHome;
  
  // Adjust for draw probability
  const drawProb = Math.max(0.15, 0.30 - Math.abs(ratingDiff) / 150);
  let homeWinProb = expectedHome * (1 - drawProb);
  let awayWinProb = expectedAway * (1 - drawProb);
  
  // Normalize
  const total = homeWinProb + awayWinProb + drawProb;
  homeWinProb /= total;
  awayWinProb /= total;
  
  let outcome: 'HOME' | 'AWAY' | 'DRAW';
  let winner: string;
  let confidence: number;
  
  if (homeWinProb > awayWinProb && homeWinProb > drawProb) {
    outcome = 'HOME';
    winner = homeTeam;
    confidence = Math.round(homeWinProb * 100);
  } else if (awayWinProb > homeWinProb && awayWinProb > drawProb) {
    outcome = 'AWAY';
    winner = awayTeam;
    confidence = Math.round(awayWinProb * 100);
  } else {
    outcome = 'DRAW';
    winner = 'Draw likely';
    confidence = Math.round(drawProb * 100);
  }
  
  // Predict score
  const avgGoals = 2.7;
  const homeExpected = avgGoals * (homeRating / totalRating) * 1.08;
  const awayExpected = avgGoals * (awayRating / totalRating) * 0.92;
  
  const predictedScore = {
    home: Math.round(homeExpected),
    away: Math.round(awayExpected)
  };
  
  const insights: string[] = [];
  const bettingAngles: string[] = [];
  
  if (ratingDiff > 12) {
    insights.push(`${homeTeam} are strong favorites at home with a significant quality advantage`);
    bettingAngles.push(`${homeTeam} -1.5 Asian Handicap`);
  } else if (ratingDiff > 5) {
    insights.push(`${homeTeam} have the edge with home advantage`);
    bettingAngles.push(`${homeTeam} to win and Over 1.5 goals`);
  } else if (ratingDiff < -12) {
    insights.push(`${awayTeam} are favorites despite playing away`);
    bettingAngles.push(`${awayTeam} Double Chance`);
  } else if (ratingDiff < -5) {
    insights.push(`${awayTeam} slight favorites with quality edge`);
    bettingAngles.push(`Draw No Bet ${awayTeam}`);
  } else {
    insights.push('Tight contest expected - home advantage could be decisive');
    bettingAngles.push('Both Teams To Score');
  }
  
  if (homeRating > 82 && awayRating > 82) {
    insights.push('High-quality encounter between two strong sides');
    bettingAngles.push('Over 2.5 goals');
  }
  
  if (homeRating < 72 && awayRating < 72) {
    insights.push('Lower table clash - defensive approach likely');
    bettingAngles.push('Under 2.5 goals');
  }
  
  const odds = dbOdds?.home ? {
    home: dbOdds.home,
    draw: dbOdds.draw || 3.5,
    away: dbOdds.away || Math.max(1.2, 1 / awayWinProb)
  } : {
    home: Math.max(1.15, 1 / homeWinProb),
    draw: Math.max(2.8, 1 / drawProb),
    away: Math.max(1.15, 1 / awayWinProb)
  };
  
  const reasoning = `Based on team ratings (${homeTeam}: ${homeRating - HOME_ADVANTAGE}, ${awayTeam}: ${awayRating}) with home advantage factored in. ${outcome === 'DRAW' ? 'Teams are closely matched, making a draw the most likely outcome.' : `${winner} are predicted to win.`} ${insights[0]}.`;
  
  return {
    outcome,
    winner,
    confidence,
    predictedScore,
    scorePrediction: `${predictedScore.home}-${predictedScore.away}`,
    reasoning,
    aiReasoning: reasoning,
    keyInsight: insights[0] || 'Analysis based on team ratings and form',
    bettingAngle: bettingAngles[0] || 'Moneyline',
    insights,
    bettingAngles,
    odds: {
      home: Number(odds.home.toFixed(2)),
      draw: Number(odds.draw.toFixed(2)),
      away: Number(odds.away.toFixed(2))
    },
    probability: {
      home: Math.round(homeWinProb * 100),
      draw: Math.round(drawProb * 100),
      away: Math.round(awayWinProb * 100)
    },
    isValuePick: confidence > 65,
    riskLevel: confidence > 75 ? 'LOW' : confidence > 55 ? 'MEDIUM' : 'HIGH',
    modelEdge: Math.abs(ratingDiff) / 10,
    systemRecord: 'Elo-based'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const league = url.searchParams.get('league');
    const status = url.searchParams.get('status');
    const date = url.searchParams.get('date'); // YYYY-MM-DD format
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const limit = parseInt(url.searchParams.get('limit') || '200');

    console.log('Fetching matches with params:', { league, status, date, dateFrom, dateTo, limit });

    // Determine date range
    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (date) {
      // Specific date requested
      startDate = `${date}T00:00:00Z`;
      endDate = `${date}T23:59:59Z`;
    } else if (dateFrom && dateTo) {
      startDate = `${dateFrom}T00:00:00Z`;
      endDate = `${dateTo}T23:59:59Z`;
    } else {
      // Default: 7 days ago to 14 days in future (wider range)
      const defaultStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const defaultEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      startDate = `${defaultStartDate}T00:00:00Z`;
      endDate = `${defaultEndDate}T23:59:59Z`;
    }

    let query = supabase
      .from('matches')
      .select('*')
      .gte('kickoff_time', startDate)
      .lte('kickoff_time', endDate)
      .order('kickoff_time', { ascending: true });

    if (league) {
      query = query.eq('league', league);
    }

    if (status) {
      const statusMap: Record<string, string> = {
        'SCHEDULED': 'scheduled',
        'LIVE': 'live',
        'IN_PLAY': 'live',
        'FINISHED': 'finished',
        'POSTPONED': 'postponed'
      };
      const dbStatus = statusMap[status.toUpperCase()] || status.toLowerCase();
      query = query.eq('status', dbStatus);
    }

    const { data: matches, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }

    console.log(`Found ${matches?.length || 0} matches`);

    // Logo fallback: fetch from TheSportsDB if missing
    const getTeamLogo = async (teamName: string, existingLogo?: string): Promise<string> => {
      if (existingLogo && existingLogo !== 'null' && !existingLogo.includes('ui-avatars')) {
        return existingLogo;
      }
      
      // Use football-data.org's logo URL pattern (they're usually available)
      // Or fallback to UI Avatars
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=1E1E1E&color=fff&bold=true&size=128`;
    };

    const transformedMatches = await Promise.all((matches || []).map(async match => {
      const dbStatus = (match.status || 'scheduled').toLowerCase();
      let normalizedStatus = 'SCHEDULED';
      
      if (dbStatus === 'finished' || dbStatus === 'ft') {
        normalizedStatus = 'FINISHED';
      } else if (dbStatus === 'live' || dbStatus === 'in_play' || dbStatus === '1h' || dbStatus === '2h' || dbStatus === 'ht') {
        normalizedStatus = 'LIVE';
      } else if (dbStatus === 'postponed' || dbStatus === 'pst') {
        normalizedStatus = 'POSTPONED';
      } else if (dbStatus === 'cancelled' || dbStatus === 'canc') {
        normalizedStatus = 'CANCELLED';
      }
      
      const existingHomeLogo = match.home_team_json?.crest || match.home_team_json?.logo;
      const existingAwayLogo = match.away_team_json?.crest || match.away_team_json?.logo;
      
      const homeLogo = await getTeamLogo(match.home_team, existingHomeLogo);
      const awayLogo = await getTeamLogo(match.away_team, existingAwayLogo);
      
      const transformed: Record<string, unknown> = {
        ...match,
        status: normalizedStatus,
        homeTeam: {
          id: match.home_team_id || match.home_team,
          name: match.home_team,
          shortName: match.home_team?.split(' ').slice(0, 2).join(' '),
          crest: homeLogo,
          logo: homeLogo
        },
        awayTeam: {
          id: match.away_team_id || match.away_team,
          name: match.away_team,
          shortName: match.away_team?.split(' ').slice(0, 2).join(' '),
          crest: awayLogo,
          logo: awayLogo
        },
        score: {
          home: match.home_team_score,
          away: match.away_team_score,
          fullTime: {
            home: match.home_team_score,
            away: match.away_team_score
          }
        },
        utcDate: match.kickoff_time,
        time: match.kickoff_time,
        kickoff_time: match.kickoff_time,
        league: match.league || 'Football',
        metadata: match.metadata || {}
      };

      if (normalizedStatus === 'SCHEDULED') {
        const prediction = generateSmartPrediction(
          match.home_team,
          match.away_team,
          { home: match.odds_home, draw: match.odds_draw, away: match.odds_away }
        );
        transformed.prediction = prediction;
      }

      return transformed;
    }));

    // Return flat array for consistency with frontend expectations
    return new Response(
      JSON.stringify(transformedMatches),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120' // Cache for 2 minutes for fresher data
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in get-matches:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
