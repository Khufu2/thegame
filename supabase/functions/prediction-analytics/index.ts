// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AnalyticsRequest {
  timeframe?: '7d' | '30d' | '90d' | 'all'; // Default: 30d
  league?: string; // Optional: filter by league
  minConfidence?: number; // Optional: filter by minimum confidence
}

async function calculateOverallMetrics(timeframe: string, league?: string, minConfidence?: number) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Build query for resolved predictions
    let query = supabase
      .from('prediction_history')
      .select('*')
      .eq('status', 'RESOLVED');

    // Apply filters
    if (league) {
      query = query.eq('league', league);
    }

    if (minConfidence) {
      query = query.gte('confidence', minConfidence);
    }

    // Apply timeframe filter
    if (timeframe !== 'all') {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('resolved_at', cutoffDate);
    }

    const { data: predictions, error } = await query;

    if (error) {
      console.error('Error fetching predictions:', error);
      return null;
    }

    if (!predictions || predictions.length === 0) {
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        totalPoints: 0,
        averageConfidence: 0,
        roi: 0
      };
    }

    // Calculate metrics
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.is_correct).length;
    const accuracy = (correctPredictions / totalPredictions) * 100;

    const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
    const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions;

    // Calculate ROI (simplified - assuming 1 point = 1 unit bet)
    const totalStaked = totalPredictions; // 1 unit per prediction
    const roi = totalStaked > 0 ? ((totalPoints) / totalStaked) * 100 : 0;

    return {
      totalPredictions,
      correctPredictions,
      accuracy: Math.round(accuracy * 100) / 100,
      totalPoints: Math.round(totalPoints * 100) / 100,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      roi: Math.round(roi * 100) / 100
    };

  } catch (error) {
    console.error('Error calculating overall metrics:', error);
    return null;
  }
}

async function calculateConfidenceAnalysis(timeframe: string, league?: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    let query = supabase
      .from('prediction_history')
      .select('confidence, is_correct')
      .eq('status', 'RESOLVED');

    if (league) {
      query = query.eq('league', league);
    }

    if (timeframe !== 'all') {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('resolved_at', cutoffDate);
    }

    const { data: predictions, error } = await query;

    if (error || !predictions) {
      return null;
    }

    // Group by confidence ranges
    const confidenceRanges = {
      '90-100': { total: 0, correct: 0 },
      '80-89': { total: 0, correct: 0 },
      '70-79': { total: 0, correct: 0 },
      '60-69': { total: 0, correct: 0 },
      '50-59': { total: 0, correct: 0 },
      '0-49': { total: 0, correct: 0 }
    };

    predictions.forEach(p => {
      let range;
      if (p.confidence >= 90) range = '90-100';
      else if (p.confidence >= 80) range = '80-89';
      else if (p.confidence >= 70) range = '70-79';
      else if (p.confidence >= 60) range = '60-69';
      else if (p.confidence >= 50) range = '50-59';
      else range = '0-49';

      confidenceRanges[range].total++;
      if (p.is_correct) confidenceRanges[range].correct++;
    });

    // Calculate accuracy for each range
    const analysis = {};
    Object.keys(confidenceRanges).forEach(range => {
      const { total, correct } = confidenceRanges[range];
      analysis[range] = {
        total,
        correct,
        accuracy: total > 0 ? Math.round((correct / total) * 10000) / 100 : 0
      };
    });

    return analysis;

  } catch (error) {
    console.error('Error calculating confidence analysis:', error);
    return null;
  }
}

async function calculateLeaguePerformance(timeframe: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    let query = supabase
      .from('prediction_history')
      .select('league, is_correct, confidence')
      .eq('status', 'RESOLVED');

    if (timeframe !== 'all') {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('resolved_at', cutoffDate);
    }

    const { data: predictions, error } = await query;

    if (error || !predictions) {
      return null;
    }

    // Group by league
    const leagueStats = {};
    predictions.forEach(p => {
      if (!leagueStats[p.league]) {
        leagueStats[p.league] = { total: 0, correct: 0, totalConfidence: 0 };
      }
      leagueStats[p.league].total++;
      leagueStats[p.league].totalConfidence += p.confidence;
      if (p.is_correct) leagueStats[p.league].correct++;
    });

    // Calculate metrics for each league
    const leaguePerformance = {};
    Object.keys(leagueStats).forEach(league => {
      const stats = leagueStats[league];
      leaguePerformance[league] = {
        totalPredictions: stats.total,
        accuracy: Math.round((stats.correct / stats.total) * 10000) / 100,
        averageConfidence: Math.round((stats.totalConfidence / stats.total) * 100) / 100
      };
    });

    return leaguePerformance;

  } catch (error) {
    console.error('Error calculating league performance:', error);
    return null;
  }
}

async function getRecentPredictions(limit: number = 10) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: predictions, error } = await supabase
      .from('prediction_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent predictions:', error);
      return [];
    }

    return predictions || [];

  } catch (error) {
    console.error('Error in getRecentPredictions:', error);
    return [];
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
    const body: AnalyticsRequest = req.method === "POST" ? await req.json() : {};
    const { timeframe = '30d', league, minConfidence } = body;

    console.log(`📊 Generating prediction analytics for timeframe: ${timeframe}`);

    // Calculate all metrics in parallel
    const [overallMetrics, confidenceAnalysis, leaguePerformance, recentPredictions] = await Promise.all([
      calculateOverallMetrics(timeframe, league, minConfidence),
      calculateConfidenceAnalysis(timeframe, league),
      calculateLeaguePerformance(timeframe),
      getRecentPredictions(20)
    ]);

    const analytics = {
      timeframe,
      filters: { league, minConfidence },
      overall: overallMetrics,
      confidenceAnalysis,
      leaguePerformance,
      recentPredictions,
      generatedAt: new Date().toISOString()
    };

    console.log(`✅ Analytics generated: ${overallMetrics?.totalPredictions || 0} predictions analyzed`);

    return new Response(
      JSON.stringify({
        status: "success",
        analytics
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in prediction-analytics:", error);
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