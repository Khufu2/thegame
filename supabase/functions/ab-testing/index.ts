// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ABTestRequest {
  action?: 'CREATE' | 'LIST' | 'UPDATE' | 'DELETE' | 'ANALYZE' | 'GET_VARIANT';
  experimentId?: string;
  experimentName?: string;
  experimentType?: 'PROMPT' | 'STRATEGY' | 'CONFIDENCE';
  variantA?: any;
  variantB?: any;
  matchId?: string; // For getting variant assignment
}

async function createExperiment(experimentName: string, experimentType: string, variantA: any, variantB: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: experiment, error } = await supabase
      .from('ab_test_experiments')
      .insert({
        experiment_name: experimentName,
        experiment_type: experimentType,
        variant_a: JSON.stringify(variantA),
        variant_b: JSON.stringify(variantB),
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating experiment:', error);
      return null;
    }

    return experiment;

  } catch (error) {
    console.error('Error in createExperiment:', error);
    return null;
  }
}

async function listExperiments() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: experiments, error } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing experiments:', error);
      return [];
    }

    return experiments || [];

  } catch (error) {
    console.error('Error in listExperiments:', error);
    return [];
  }
}

async function updateExperiment(experimentId: string, updates: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: experiment, error } = await supabase
      .from('ab_test_experiments')
      .update(updates)
      .eq('id', experimentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating experiment:', error);
      return null;
    }

    return experiment;

  } catch (error) {
    console.error('Error in updateExperiment:', error);
    return null;
  }
}

async function analyzeExperiment(experimentId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get experiment details
    const { data: experiment, error: expError } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (expError || !experiment) {
      console.error('Experiment not found:', expError);
      return null;
    }

    // Get predictions for this experiment (we'd need to add experiment_id to prediction_history)
    // For now, we'll simulate analysis based on the experiment data

    const variantAAccuracy = experiment.variant_a_accuracy || 0;
    const variantBAccuracy = experiment.variant_b_accuracy || 0;

    let winner = 'INCONCLUSIVE';
    let confidence = 0;

    if (experiment.total_predictions >= 50) { // Minimum sample size
      const difference = Math.abs(variantAAccuracy - variantBAccuracy);

      if (difference >= 5) { // 5% accuracy difference threshold
        winner = variantAAccuracy > variantBAccuracy ? 'A' : 'B';
        confidence = Math.min(95, 50 + (difference * 2)); // Rough confidence calculation
      } else {
        winner = 'TIE';
        confidence = 80;
      }
    }

    // Update experiment with results
    await updateExperiment(experimentId, {
      winner,
      confidence_level: confidence,
      end_date: new Date().toISOString()
    });

    return {
      experimentId,
      experimentName: experiment.experiment_name,
      variantAAccuracy,
      variantBAccuracy,
      winner,
      confidence,
      totalPredictions: experiment.total_predictions,
      recommendation: winner === 'A' ? 'Use Variant A' :
                     winner === 'B' ? 'Use Variant B' :
                     winner === 'TIE' ? 'Both variants perform similarly' :
                     'Insufficient data for conclusion'
    };

  } catch (error) {
    console.error('Error in analyzeExperiment:', error);
    return null;
  }
}

async function getVariantForMatch(experimentId: string, matchId: string) {
  // Simple A/B assignment based on match ID hash
  // In production, you'd want more sophisticated assignment

  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(matchId));
  const hashArray = Array.from(new Uint8Array(hash));
  const hashValue = hashArray.reduce((a, b) => a + b, 0);

  // Simple 50/50 split based on hash
  return (hashValue % 2) === 0 ? 'A' : 'B';
}

async function deleteExperiment(experimentId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { error } = await supabase
      .from('ab_test_experiments')
      .delete()
      .eq('id', experimentId);

    if (error) {
      console.error('Error deleting experiment:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error in deleteExperiment:', error);
    return false;
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
    const body: ABTestRequest = req.method === "POST" ? await req.json() : {};
    const {
      action = 'LIST',
      experimentId,
      experimentName,
      experimentType,
      variantA,
      variantB,
      matchId
    } = body;

    console.log(`🧪 A/B Testing action: ${action}`);

    let result;

    switch (action) {
      case 'CREATE':
        if (!experimentName || !experimentType || !variantA || !variantB) {
          throw new Error('Missing required fields for experiment creation');
        }
        result = await createExperiment(experimentName, experimentType, variantA, variantB);
        break;

      case 'LIST':
        result = await listExperiments();
        break;

      case 'UPDATE':
        if (!experimentId) {
          throw new Error('experimentId required for update');
        }
        result = await updateExperiment(experimentId, body);
        break;

      case 'DELETE':
        if (!experimentId) {
          throw new Error('experimentId required for deletion');
        }
        result = await deleteExperiment(experimentId);
        break;

      case 'ANALYZE':
        if (!experimentId) {
          throw new Error('experimentId required for analysis');
        }
        result = await analyzeExperiment(experimentId);
        break;

      case 'GET_VARIANT':
        if (!experimentId || !matchId) {
          throw new Error('experimentId and matchId required for variant assignment');
        }
        result = await getVariantForMatch(experimentId, matchId);
        break;

      default:
        throw new Error('Invalid action');
    }

    console.log(`✅ A/B Testing ${action} complete`);

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
    console.error("Error in ab-testing:", error);
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