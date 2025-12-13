// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface OptimizeRequest {
  action?: 'ANALYZE' | 'OPTIMIZE' | 'GET_BEST';
  league?: string;
  minPredictions?: number;
}

async function analyzePromptPerformance(league?: string, minPredictions: number = 10) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get all resolved predictions with their prompt templates
    let query = supabase
      .from('prediction_history')
      .select('*')
      .eq('status', 'RESOLVED')
      .not('prompt_template', 'is', null);

    if (league) {
      query = query.eq('league', league);
    }

    const { data: predictions, error } = await query;

    if (error || !predictions) {
      console.error('Error fetching predictions:', error);
      return null;
    }

    // Group predictions by prompt template
    const promptStats = {};

    predictions.forEach(prediction => {
      const promptKey = prediction.prompt_template || 'default';

      if (!promptStats[promptKey]) {
        promptStats[promptKey] = {
          prompt: promptKey,
          total: 0,
          correct: 0,
          totalConfidence: 0,
          totalPoints: 0,
          predictions: []
        };
      }

      promptStats[promptKey].total++;
      promptStats[promptKey].totalConfidence += prediction.confidence;
      promptStats[promptKey].totalPoints += prediction.points_earned || 0;
      promptStats[promptKey].predictions.push(prediction);

      if (prediction.is_correct) {
        promptStats[promptKey].correct++;
      }
    });

    // Calculate performance metrics for each prompt
    const performanceData = Object.values(promptStats)
      .filter((stats: any) => stats.total >= minPredictions)
      .map((stats: any) => ({
        prompt: stats.prompt,
        totalPredictions: stats.total,
        accuracy: Math.round((stats.correct / stats.total) * 10000) / 100,
        averageConfidence: Math.round((stats.totalConfidence / stats.total) * 100) / 100,
        averagePoints: Math.round((stats.totalPoints / stats.total) * 100) / 100,
        roi: stats.total > 0 ? Math.round((stats.totalPoints / stats.total) * 10000) / 100 : 0,
        promptHash: await generatePromptHash(stats.prompt)
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    // Update prompt_performance table
    for (const perf of performanceData) {
      const { error: upsertError } = await supabase
        .from('prompt_performance')
        .upsert({
          prompt_template: perf.prompt,
          prompt_hash: perf.promptHash,
          total_predictions: perf.totalPredictions,
          correct_predictions: perf.correct,
          accuracy: perf.accuracy,
          average_confidence: perf.averageConfidence,
          total_points: perf.totalPoints,
          roi: perf.roi,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'prompt_hash'
        });

      if (upsertError) {
        console.error('Error updating prompt performance:', upsertError);
      }
    }

    return {
      totalPrompts: performanceData.length,
      bestPerforming: performanceData.slice(0, 5),
      worstPerforming: performanceData.slice(-5),
      league: league || 'all'
    };

  } catch (error) {
    console.error('Error in analyzePromptPerformance:', error);
    return null;
  }
}

async function generatePromptHash(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);
}

async function getBestPrompt(league?: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    let query = supabase
      .from('prompt_performance')
      .select('*')
      .order('accuracy', { ascending: false })
      .limit(1);

    if (league) {
      // For now, we use global best. Could be enhanced to league-specific
      query = query;
    }

    const { data: bestPrompt, error } = await query;

    if (error || !bestPrompt || bestPrompt.length === 0) {
      return null;
    }

    return bestPrompt[0];

  } catch (error) {
    console.error('Error getting best prompt:', error);
    return null;
  }
}

async function generateOptimizedPrompt(basePrompt: string, performanceData: any) {
  // This is a simplified optimization. In a real system, you'd use more sophisticated ML

  let optimizedPrompt = basePrompt;

  // Add performance-based adjustments
  if (performanceData.accuracy > 60) {
    // High-performing prompt - reinforce successful elements
    optimizedPrompt += "\n\nIMPORTANT: Focus on historical head-to-head data and current form trends, as these have proven most predictive.";
  } else if (performanceData.accuracy < 50) {
    // Low-performing prompt - add more analytical elements
    optimizedPrompt += "\n\nENHANCED ANALYSIS: Consider weather impact, player injuries, and league-specific patterns. Weight recent form more heavily than historical data.";
  }

  // Adjust confidence calibration based on performance
  if (performanceData.averageConfidence > 70 && performanceData.accuracy < 60) {
    optimizedPrompt += "\n\nCONFIDENCE CALIBRATION: Be more conservative with confidence scores. High confidence should only be assigned when multiple strong indicators align.";
  }

  return optimizedPrompt;
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
    const body: OptimizeRequest = req.method === "POST" ? await req.json() : {};
    const { action = 'ANALYZE', league, minPredictions = 10 } = body;

    console.log(`🤖 Starting prompt optimization: ${action}`);

    let result;

    switch (action) {
      case 'ANALYZE':
        result = await analyzePromptPerformance(league, minPredictions);
        break;

      case 'GET_BEST':
        result = await getBestPrompt(league);
        break;

      case 'OPTIMIZE':
        // Analyze current performance and generate optimized prompts
        const analysis = await analyzePromptPerformance(league, minPredictions);
        if (analysis && analysis.bestPerforming.length > 0) {
          const bestPrompt = analysis.bestPerforming[0];
          const optimizedPrompt = await generateOptimizedPrompt(bestPrompt.prompt, bestPrompt);

          result = {
            originalPrompt: bestPrompt,
            optimizedPrompt: optimizedPrompt,
            expectedImprovement: '5-15%' // Rough estimate
          };
        } else {
          result = { error: 'Insufficient data for optimization' };
        }
        break;

      default:
        result = { error: 'Invalid action' };
    }

    console.log(`✅ Prompt optimization complete: ${action}`);

    return new Response(
      JSON.stringify({
        status: "success",
        action,
        result,
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
    console.error("Error in optimize-prompts:", error);
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