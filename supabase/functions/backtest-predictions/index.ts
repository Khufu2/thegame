// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface BacktestRequest {
  days?: number;
  model?: string;
  league?: string;
}

async function calculateBacktestResults(supabase: any, days: number = 30, model?: string, league?: string): Promise<any> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Get predictions with actual results
  let query = supabase
    .from('prediction_history')
    .select(`
      *,
      matches:match_id (
        home_score,
        away_score,
        status
      )
    `)
    .gte('created_at', cutoffDate.toISOString())
    .not('matches.home_score', 'is', null)
    .not('matches.away_score', 'is', null);

  if (model) {
    query = query.eq('model_used', model);
  }

  if (league) {
    query = query.eq('league', league);
  }

  const { data: predictions, error } = await query;

  if (error) {
    console.error('Error fetching predictions for backtest:', error);
    throw error;
  }

  if (!predictions || predictions.length === 0) {
    return {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      avgConfidence: 0,
      profitLoss: 0,
      modelBreakdown: {},
      confidenceBreakdown: {}
    };
  }

  let correctPredictions = 0;
  let totalProfitLoss = 0;
  let totalConfidence = 0;
  const modelBreakdown: { [key: string]: { correct: number, total: number, accuracy: number } } = {};
  const confidenceBreakdown: { [key: string]: { correct: number, total: number, accuracy: number } } = {};

  predictions.forEach((pred: any) => {
    const match = pred.matches;
    if (!match) return;

    // Determine actual outcome
    let actualOutcome = 'DRAW';
    if (match.home_score > match.away_score) actualOutcome = 'HOME_WIN';
    else if (match.away_score > match.home_score) actualOutcome = 'AWAY_WIN';

    // Check if prediction was correct
    const isCorrect = pred.predicted_outcome === actualOutcome;
    if (isCorrect) correctPredictions++;

    // Calculate profit/loss (simplified - assuming $10 stake)
    const stake = 10;
    let payout = 0;
    if (isCorrect) {
      const odds = pred.predicted_outcome === 'HOME_WIN' ? pred.odds?.home :
                   pred.predicted_outcome === 'AWAY_WIN' ? pred.odds?.away :
                   pred.odds?.draw;
      payout = stake * (odds - 1); // Subtract stake back
    } else {
      payout = -stake;
    }
    totalProfitLoss += payout;

    totalConfidence += pred.confidence || 0;

    // Model breakdown
    const modelName = pred.model_used || 'Unknown';
    if (!modelBreakdown[modelName]) {
      modelBreakdown[modelName] = { correct: 0, total: 0, accuracy: 0 };
    }
    modelBreakdown[modelName].total++;
    if (isCorrect) modelBreakdown[modelName].correct++;

    // Confidence breakdown
    const confRange = Math.floor((pred.confidence || 0) / 10) * 10; // 0-9, 10-19, etc.
    const confKey = `${confRange}-${confRange + 9}%`;
    if (!confidenceBreakdown[confKey]) {
      confidenceBreakdown[confKey] = { correct: 0, total: 0, accuracy: 0 };
    }
    confidenceBreakdown[confKey].total++;
    if (isCorrect) confidenceBreakdown[confKey].correct++;
  });

  // Calculate accuracies
  Object.keys(modelBreakdown).forEach(model => {
    const stats = modelBreakdown[model];
    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
  });

  Object.keys(confidenceBreakdown).forEach(conf => {
    const stats = confidenceBreakdown[conf];
    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
  });

  return {
    totalPredictions: predictions.length,
    correctPredictions,
    accuracy: (correctPredictions / predictions.length) * 100,
    avgConfidence: totalConfidence / predictions.length,
    profitLoss: totalProfitLoss,
    roi: totalProfitLoss / (predictions.length * 10) * 100, // Based on $10 stakes
    modelBreakdown,
    confidenceBreakdown,
    period: `${days} days`,
    analyzedAt: new Date().toISOString()
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
    const body: BacktestRequest = await req.json();
    const { days = 30, model, league } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log(`🔍 Running backtest for ${days} days${model ? `, model: ${model}` : ''}${league ? `, league: ${league}` : ''}`);

    const results = await calculateBacktestResults(supabase, days, model, league);

    return new Response(
      JSON.stringify({
        status: "success",
        backtest: results,
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
    console.error("Error in backtest-predictions:", error);
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