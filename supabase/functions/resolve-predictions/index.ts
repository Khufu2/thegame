// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ResolveRequest {
  matchId?: string; // Optional: resolve specific match, otherwise resolve all finished matches
  limit?: number; // Optional: limit number of predictions to process
}

async function resolveMatchPredictions(matchId: string): Promise<{ resolved: number, errors: number }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get match result
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, home_score, away_score, status, kickoff_time')
      .eq('id', matchId)
      .eq('status', 'FINISHED')
      .single();

    if (matchError || !match) {
      console.log(`Match ${matchId} not found or not finished`);
      return { resolved: 0, errors: 0 };
    }

    if (!match.home_score || !match.away_score) {
      console.log(`Match ${matchId} has no score data yet`);
      return { resolved: 0, errors: 0 };
    }

    // Determine actual outcome
    let actualOutcome: string;
    if (match.home_score > match.away_score) {
      actualOutcome = 'HOME_WIN';
    } else if (match.away_score > match.home_score) {
      actualOutcome = 'AWAY_WIN';
    } else {
      actualOutcome = 'DRAW';
    }

    const actualScore = `${match.home_score}-${match.away_score}`;

    // Get all pending predictions for this match
    const { data: predictions, error: predictionsError } = await supabase
      .from('prediction_history')
      .select('*')
      .eq('match_id', matchId)
      .eq('status', 'PENDING');

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError);
      return { resolved: 0, errors: 1 };
    }

    if (!predictions || predictions.length === 0) {
      console.log(`No pending predictions found for match ${matchId}`);
      return { resolved: 0, errors: 0 };
    }

    let resolvedCount = 0;
    let errorCount = 0;

    // Update each prediction
    for (const prediction of predictions) {
      try {
        // Calculate if prediction was correct
        const isCorrect = prediction.predicted_outcome === actualOutcome;

        // Calculate points based on confidence and correctness
        let points = 0;
        if (isCorrect) {
          // Base points for correct prediction
          points = 10;
          // Bonus points for high confidence correct predictions
          if (prediction.confidence >= 80) points += 5;
          else if (prediction.confidence >= 60) points += 2;
        } else {
          // Penalty points for wrong predictions (more penalty for high confidence)
          if (prediction.confidence >= 80) points = -5;
          else if (prediction.confidence >= 60) points = -2;
          else points = -1;
        }

        // Update prediction record
        const { error: updateError } = await supabase
          .from('prediction_history')
          .update({
            actual_outcome: actualOutcome,
            actual_score: actualScore,
            status: 'RESOLVED',
            resolved_at: new Date().toISOString(),
            is_correct: isCorrect,
            points_earned: points
          })
          .eq('id', prediction.id);

        if (updateError) {
          console.error(`Error updating prediction ${prediction.id}:`, updateError);
          errorCount++;
        } else {
          resolvedCount++;
          console.log(`✅ Resolved prediction ${prediction.id}: ${prediction.predicted_outcome} → ${actualOutcome} (${isCorrect ? 'CORRECT' : 'WRONG'})`);
        }
      } catch (error) {
        console.error(`Error processing prediction ${prediction.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Match ${matchId} resolution complete: ${resolvedCount} resolved, ${errorCount} errors`);
    return { resolved: resolvedCount, errors: errorCount };

  } catch (error) {
    console.error(`Error resolving predictions for match ${matchId}:`, error);
    return { resolved: 0, errors: 1 };
  }
}

async function resolveAllFinishedMatches(limit?: number): Promise<{ totalResolved: number, totalErrors: number, matchesProcessed: number }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Find matches that finished recently but have pending predictions
    const recentTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days

    const { data: finishedMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, status, kickoff_time')
      .eq('status', 'FINISHED')
      .gte('kickoff_time', recentTime)
      .order('kickoff_time', { ascending: false })
      .limit(limit || 50);

    if (matchesError) {
      console.error('Error fetching finished matches:', matchesError);
      return { totalResolved: 0, totalErrors: 1, matchesProcessed: 0 };
    }

    if (!finishedMatches || finishedMatches.length === 0) {
      console.log('No recently finished matches found');
      return { totalResolved: 0, totalErrors: 0, matchesProcessed: 0 };
    }

    console.log(`Found ${finishedMatches.length} recently finished matches to check`);

    let totalResolved = 0;
    let totalErrors = 0;
    let matchesProcessed = 0;

    // Check each match for pending predictions and resolve them
    for (const match of finishedMatches) {
      try {
        // Check if this match has any pending predictions
        const { data: pendingPredictions, error: checkError } = await supabase
          .from('prediction_history')
          .select('id')
          .eq('match_id', match.id)
          .eq('status', 'PENDING')
          .limit(1);

        if (checkError) {
          console.error(`Error checking predictions for match ${match.id}:`, checkError);
          totalErrors++;
          continue;
        }

        if (pendingPredictions && pendingPredictions.length > 0) {
          console.log(`🔄 Resolving predictions for ${match.home_team} vs ${match.away_team}`);
          const result = await resolveMatchPredictions(match.id);
          totalResolved += result.resolved;
          totalErrors += result.errors;
          matchesProcessed++;
        }
      } catch (error) {
        console.error(`Error processing match ${match.id}:`, error);
        totalErrors++;
      }
    }

    console.log(`Resolution complete: ${totalResolved} predictions resolved, ${totalErrors} errors, ${matchesProcessed} matches processed`);
    return { totalResolved, totalErrors, matchesProcessed };

  } catch (error) {
    console.error('Error in resolveAllFinishedMatches:', error);
    return { totalResolved: 0, totalErrors: 1, matchesProcessed: 0 };
  }
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
    const body: ResolveRequest = req.method === "POST" ? await req.json() : {};
    const { matchId, limit } = body;

    console.log('🎯 Starting prediction resolution process...');

    let result;
    if (matchId) {
      // Resolve specific match
      console.log(`🎯 Resolving predictions for specific match: ${matchId}`);
      result = await resolveMatchPredictions(matchId);
    } else {
      // Resolve all finished matches
      console.log('🎯 Resolving predictions for all recently finished matches');
      result = await resolveAllFinishedMatches(limit);
    }

    return new Response(
      JSON.stringify({
        status: "success",
        ...result,
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
    console.error("Error in resolve-predictions:", error);
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