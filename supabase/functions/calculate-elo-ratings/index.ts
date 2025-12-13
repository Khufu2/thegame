// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface EloCalculationRequest {
  league?: string;
  season?: string;
  kFactor?: number; // Default K-factor for Elo calculations
}

interface TeamElo {
  team_id: string;
  team_name: string;
  elo_rating: number;
  matches_played: number;
  last_updated: string;
}

// Elo rating constants
const DEFAULT_K_FACTOR = 32;
const INITIAL_ELO = 1500;
const HOME_ADVANTAGE = 100; // Points added to home team rating

function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calculateEloChange(winnerRating: number, loserRating: number, kFactor: number = DEFAULT_K_FACTOR): number {
  const expectedScore = calculateExpectedScore(winnerRating, loserRating);
  return Math.round(kFactor * (1 - expectedScore));
}

function calculateDrawEloChange(ratingA: number, ratingB: number, kFactor: number = DEFAULT_K_FACTOR): { changeA: number, changeB: number } {
  const expectedA = calculateExpectedScore(ratingA, ratingB);
  const expectedB = calculateExpectedScore(ratingB, ratingA);

  // For draws, both teams get partial points
  const changeA = Math.round(kFactor * (0.5 - expectedA));
  const changeB = Math.round(kFactor * (0.5 - expectedB));

  return { changeA, changeB };
}

async function updateTeamElo(supabase: any, teamId: string, teamName: string, newElo: number): Promise<void> {
  const { error } = await supabase
    .from('team_elo_ratings')
    .upsert({
      team_id: teamId,
      team_name: teamName,
      elo_rating: newElo,
      matches_played: 1,
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'team_id',
      update: {
        elo_rating: newElo,
        matches_played: supabase.rpc('increment_matches_played', { team_id: teamId }),
        last_updated: new Date().toISOString()
      }
    });

  if (error) {
    console.error(`Error updating Elo for team ${teamName}:`, error);
    throw error;
  }
}

async function getTeamElo(supabase: any, teamId: string): Promise<number> {
  const { data, error } = await supabase
    .from('team_elo_ratings')
    .select('elo_rating')
    .eq('team_id', teamId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error(`Error fetching Elo for team ${teamId}:`, error);
    throw error;
  }

  return data?.elo_rating || INITIAL_ELO;
}

async function processFinishedMatches(supabase: any, league?: string, kFactor: number = DEFAULT_K_FACTOR): Promise<void> {
  // Get all finished matches that haven't been processed for Elo yet
  let query = supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, status, league')
    .eq('status', 'FINISHED')
    .is('elo_processed', null); // Only process matches not yet processed

  if (league) {
    query = query.eq('league', league);
  }

  const { data: matches, error } = await query.limit(50); // Process in batches

  if (error) {
    console.error('Error fetching matches for Elo calculation:', error);
    throw error;
  }

  if (!matches || matches.length === 0) {
    console.log('No new matches to process for Elo ratings');
    return;
  }

  console.log(`Processing ${matches.length} matches for Elo calculations`);

  for (const match of matches) {
    try {
      // Get current Elo ratings
      const homeElo = await getTeamElo(supabase, match.home_team);
      const awayElo = await getTeamElo(supabase, match.away_team);

      // Apply home advantage
      const adjustedHomeElo = homeElo + HOME_ADVANTAGE;

      let homeEloChange = 0;
      let awayEloChange = 0;

      // Determine match result
      if (match.home_score > match.away_score) {
        // Home win
        homeEloChange = calculateEloChange(adjustedHomeElo, awayElo, kFactor);
        awayEloChange = -homeEloChange;
      } else if (match.away_score > match.home_score) {
        // Away win
        awayEloChange = calculateEloChange(awayElo, adjustedHomeElo, kFactor);
        homeEloChange = -awayEloChange;
      } else {
        // Draw
        const drawChanges = calculateDrawEloChange(adjustedHomeElo, awayElo, kFactor);
        homeEloChange = drawChanges.changeA;
        awayEloChange = drawChanges.changeB;
      }

      // Update team Elo ratings
      await updateTeamElo(supabase, match.home_team, match.home_team, homeElo + homeEloChange);
      await updateTeamElo(supabase, match.away_team, match.away_team, awayElo + awayEloChange);

      // Mark match as processed
      await supabase
        .from('matches')
        .update({
          elo_processed: true,
          home_elo_change: homeEloChange,
          away_elo_change: awayEloChange
        })
        .eq('id', match.id);

      console.log(`${match.home_team} (${homeElo}→${homeElo + homeEloChange}) vs ${match.away_team} (${awayElo}→${awayElo + awayEloChange})`);

    } catch (matchError) {
      console.error(`Error processing match ${match.id}:`, matchError);
      // Continue with other matches
    }
  }
}

async function getEloPredictions(supabase: any, homeTeam: string, awayTeam: string): Promise<{
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  expectedScore: string;
  eloDifference: number;
}> {
  const homeElo = await getTeamElo(supabase, homeTeam);
  const awayElo = await getTeamElo(supabase, awayTeam);

  const adjustedHomeElo = homeElo + HOME_ADVANTAGE;

  // Calculate win probabilities using Elo
  const homeWinProb = calculateExpectedScore(adjustedHomeElo, awayElo);
  const awayWinProb = calculateExpectedScore(awayElo, adjustedHomeElo);

  // For draw probability, use a simplified model
  // In reality, this would be trained on historical data
  const drawProb = Math.max(0.1, Math.min(0.3, 0.25 - Math.abs(homeWinProb - awayWinProb) * 0.5));

  // Normalize probabilities
  const totalProb = homeWinProb + drawProb + awayWinProb;
  const normalizedHomeWin = homeWinProb / totalProb;
  const normalizedDraw = drawProb / totalProb;
  const normalizedAwayWin = awayWinProb / totalProb;

  // Estimate score based on Elo difference
  const eloDiff = adjustedHomeElo - awayElo;
  let expectedGoalsHome = 1.5 + (eloDiff / 800); // Rough estimation
  let expectedGoalsAway = 1.2 - (eloDiff / 1000); // Rough estimation

  expectedGoalsHome = Math.max(0, Math.min(5, expectedGoalsHome));
  expectedGoalsAway = Math.max(0, Math.min(5, expectedGoalsAway));

  const expectedScore = `${Math.round(expectedGoalsHome * 10) / 10}-${Math.round(expectedGoalsAway * 10) / 10}`;

  return {
    homeWinProbability: Math.round(normalizedHomeWin * 100),
    drawProbability: Math.round(normalizedDraw * 100),
    awayWinProbability: Math.round(normalizedAwayWin * 100),
    expectedScore,
    eloDifference: eloDiff
  };
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
    const body: EloCalculationRequest = await req.json();
    const { league, season, kFactor = DEFAULT_K_FACTOR } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (req.method === "POST") {
      // Process new matches and update Elo ratings
      console.log(`🔄 Processing Elo ratings for ${league || 'all leagues'} with K-factor ${kFactor}`);
      await processFinishedMatches(supabase, league, kFactor);

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Elo ratings updated successfully",
          processed: true
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

    } else if (req.method === "GET") {
      // Get Elo ratings or predictions
      const url = new URL(req.url);
      const homeTeam = url.searchParams.get('homeTeam');
      const awayTeam = url.searchParams.get('awayTeam');

      if (homeTeam && awayTeam) {
        // Return prediction based on Elo
        const prediction = await getEloPredictions(supabase, homeTeam, awayTeam);

        return new Response(
          JSON.stringify({
            status: "success",
            prediction,
            model: "Elo Rating System"
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } else {
        // Return current Elo ratings
        let query = supabase
          .from('team_elo_ratings')
          .select('*')
          .order('elo_rating', { ascending: false });

        if (league) {
          query = query.eq('league', league);
        }

        const { data: ratings, error } = await query.limit(50);

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({
            status: "success",
            ratings: ratings || [],
            league: league || 'all'
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Error in calculate-elo-ratings:", error);
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