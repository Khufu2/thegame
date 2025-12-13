// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface QueueRequest {
  batchSize?: number; // How many predictions to generate (default: 10)
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'; // Priority level
  league?: string; // Specific league to focus on
  forceRegenerate?: boolean; // Regenerate existing predictions
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
    const body: QueueRequest = await req.json();
    const {
      batchSize = 10,
      priority = 'MEDIUM',
      league,
      forceRegenerate = false
    } = body;

    console.log(`🎯 Starting prediction generation queue: ${batchSize} predictions, priority: ${priority}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Find matches that need predictions
    let matchesQuery = supabase
      .from('matches')
      .select('id, league, home_team, away_team, kickoff_time, status')
      .eq('status', 'scheduled')
      .gte('kickoff_time', new Date().toISOString()) // Future matches only
      .order('kickoff_time', { ascending: true });

    if (league) {
      matchesQuery = matchesQuery.eq('league', league);
    }

    // Limit based on priority
    const limit = priority === 'HIGH' ? batchSize * 2 :
                 priority === 'LOW' ? Math.max(1, batchSize / 2) :
                 batchSize;

    matchesQuery = matchesQuery.limit(limit * 2); // Get more to filter

    const { data: matches, error: matchesError } = await matchesQuery;

    if (matchesError) {
      console.error('Error fetching matches for queue:', matchesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch matches', details: matchesError }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!matches || matches.length === 0) {
      console.log('ℹ️ No matches found for prediction generation');
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'No matches found for prediction generation',
          processed: 0
        }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check which matches already have recent predictions
    const matchIds = matches.map(m => m.id);
    const { data: existingPredictions, error: predictionsError } = await supabase
      .from('prediction_history')
      .select('match_id, created_at')
      .in('match_id', matchIds)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (predictionsError) {
      console.error('Error checking existing predictions:', predictionsError);
    }

    // Create a map of recent predictions (within last 6 hours)
    const recentPredictions = new Map();
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    if (existingPredictions) {
      existingPredictions.forEach(pred => {
        if (new Date(pred.created_at) > sixHoursAgo) {
          recentPredictions.set(pred.match_id, pred.created_at);
        }
      });
    }

    // Filter matches that need predictions
    const matchesNeedingPredictions = matches.filter(match => {
      if (forceRegenerate) return true;
      return !recentPredictions.has(match.id);
    });

    console.log(`📊 Found ${matchesNeedingPredictions.length} matches needing predictions (from ${matches.length} total matches)`);

    if (matchesNeedingPredictions.length === 0) {
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'All matches already have recent predictions',
          processed: 0,
          skipped: matches.length
        }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Process predictions in batches to avoid overwhelming the system
    const batchSizeActual = Math.min(batchSize, matchesNeedingPredictions.length);
    const matchesToProcess = matchesNeedingPredictions.slice(0, batchSizeActual);

    console.log(`🚀 Processing ${matchesToProcess.length} predictions in background`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each match (with small delay between requests to avoid rate limits)
    for (let i = 0; i < matchesToProcess.length; i++) {
      const match = matchesToProcess[i];

      try {
        console.log(`🤖 Generating prediction for ${match.home_team} vs ${match.away_team}`);

        // Call the generate-predictions function
        const predictionResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/generate-predictions`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              matchId: match.id,
              league: match.league,
              homeTeam: match.home_team,
              awayTeam: match.away_team,
            }),
          }
        );

        if (predictionResponse.ok) {
          const predictionData = await predictionResponse.json();
          results.push({
            matchId: match.id,
            status: 'success',
            prediction: predictionData.prediction
          });
          successCount++;
          console.log(`✅ Generated prediction for match ${match.id}`);
        } else {
          const errorText = await predictionResponse.text();
          results.push({
            matchId: match.id,
            status: 'error',
            error: `HTTP ${predictionResponse.status}: ${errorText}`
          });
          errorCount++;
          console.error(`❌ Failed to generate prediction for match ${match.id}: ${errorText}`);
        }

        // Small delay between requests to avoid overwhelming
        if (i < matchesToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }

      } catch (error) {
        results.push({
          matchId: match.id,
          status: 'error',
          error: error.message
        });
        errorCount++;
        console.error(`❌ Error generating prediction for match ${match.id}:`, error);
      }
    }

    console.log(`📈 Queue processing complete: ${successCount} successful, ${errorCount} failed`);

    // Log queue execution for monitoring
    try {
      await supabase
        .from('prediction_history')
        .insert({
          match_id: 'QUEUE_EXECUTION',
          predicted_outcome: 'SYSTEM',
          confidence: 100,
          ai_reasoning: `Queue processed ${batchSizeActual} predictions: ${successCount} success, ${errorCount} failed`,
          prompt_source: 'QUEUE_SYSTEM',
          status: 'COMPLETED',
          league: league || 'ALL',
          system_record: `${successCount}/${batchSizeActual}`
        });
    } catch (logError) {
      console.warn('Failed to log queue execution:', logError);
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: `Processed ${batchSizeActual} predictions`,
        processed: successCount,
        failed: errorCount,
        total: matchesNeedingPredictions.length,
        results: results.slice(0, 5), // Only return first 5 results for brevity
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Error in prediction queue:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
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