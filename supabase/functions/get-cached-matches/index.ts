// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cache TTL in seconds
const CACHE_TTL = {
  MATCHES: 300,        // 5 minutes for matches
  PREDICTIONS: 600,    // 10 minutes for predictions
  STANDINGS: 1800,     // 30 minutes for standings
  NEWS: 300,          // 5 minutes for news
};

interface CacheRequest {
  type?: 'matches' | 'predictions' | 'standings' | 'news' | 'all';
  league?: string;
  limit?: number;
  force_refresh?: boolean;
}

// Simple in-memory cache (in production, use Redis)
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCacheKey(type: string, params: any = {}): string {
  return `${type}_${JSON.stringify(params)}`;
}

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  const age = (now - cached.timestamp) / 1000; // age in seconds

  if (age > cached.ttl) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedData(key: string, data: any, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

async function getMatchesWithPredictions(league?: string, limit: number = 100, forceRefresh: boolean = false) {
  const cacheKey = getCacheKey('matches', { league, limit });

  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for matches: ${cacheKey}`);
      return cached;
    }
  }

  console.log(`🔄 Cache miss for matches: ${cacheKey}, fetching from DB`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get matches
    let matchesQuery = supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true })
      .limit(limit);

    if (league) {
      matchesQuery = matchesQuery.eq('league', league);
    }

    const { data: matches, error: matchesError } = await matchesQuery;

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return [];
    }

    // Get predictions for these matches
    const matchIds = matches.map(m => m.id);
    const { data: predictions, error: predictionsError } = await supabase
      .from('prediction_history')
      .select('*')
      .in('match_id', matchIds)
      .eq('status', 'PENDING')
      .order('confidence', { ascending: false });

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError);
    }

    // Combine matches with predictions
    const matchesWithPredictions = matches.map(match => {
      const matchPredictions = predictions?.filter(p => p.match_id === match.id) || [];
      const bestPrediction = matchPredictions.length > 0 ? matchPredictions[0] : null;

      return {
        ...match,
        prediction: bestPrediction ? {
          outcome: bestPrediction.predicted_outcome,
          confidence: bestPrediction.confidence,
          scorePrediction: bestPrediction.predicted_score,
          aiReasoning: bestPrediction.ai_reasoning,
          keyInsight: bestPrediction.key_insight,
          bettingAngle: bestPrediction.betting_angle,
          odds: bestPrediction.odds,
          probability: bestPrediction.probability,
          isValuePick: bestPrediction.is_value_pick,
          riskLevel: bestPrediction.risk_level,
          modelEdge: bestPrediction.model_edge,
          systemRecord: bestPrediction.system_record
        } : null
      };
    });

    // Cache the result
    setCachedData(cacheKey, matchesWithPredictions, CACHE_TTL.MATCHES);

    return matchesWithPredictions;

  } catch (error) {
    console.error('Error in getMatchesWithPredictions:', error);
    return [];
  }
}

async function getStandings(league?: string, forceRefresh: boolean = false) {
  const cacheKey = getCacheKey('standings', { league });

  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    let query = supabase
      .from('standings')
      .select('*')
      .order('position', { ascending: true });

    if (league) {
      query = query.eq('league', league);
    }

    const { data: standings, error } = await query;

    if (error) {
      console.error('Error fetching standings:', error);
      return [];
    }

    setCachedData(cacheKey, standings, CACHE_TTL.STANDINGS);
    return standings;

  } catch (error) {
    console.error('Error in getStandings:', error);
    return [];
  }
}

async function getNews(limit: number = 50, forceRefresh: boolean = false) {
  const cacheKey = getCacheKey('news', { limit });

  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: news, error } = await supabase
      .from('feeds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching news:', error);
      return [];
    }

    setCachedData(cacheKey, news, CACHE_TTL.NEWS);
    return news;

  } catch (error) {
    console.error('Error in getNews:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "public, max-age=300", // 5 minutes browser cache
      },
    });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') as any || 'matches';
    const league = url.searchParams.get('league') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const forceRefresh = url.searchParams.get('force_refresh') === 'true';

    console.log(`📊 Fetching cached ${type} data`);

    let result;

    switch (type) {
      case 'matches':
        result = await getMatchesWithPredictions(league, limit, forceRefresh);
        break;
      case 'standings':
        result = await getStandings(league, forceRefresh);
        break;
      case 'news':
        result = await getNews(limit, forceRefresh);
        break;
      case 'all':
        const [matches, standings, news] = await Promise.all([
          getMatchesWithPredictions(league, limit, forceRefresh),
          getStandings(league, forceRefresh),
          getNews(20, forceRefresh)
        ]);
        result = { matches, standings, news };
        break;
      default:
        result = { error: 'Invalid type' };
    }

    console.log(`✅ Returning ${Array.isArray(result) ? result.length : 'object'} ${type} items`);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": `public, max-age=${CACHE_TTL.MATCHES}`, // Browser cache
          "X-Cache-Status": "HIT", // You could enhance this to show actual cache status
        },
      }
    );
  } catch (error) {
    console.error("Error in get-cached-matches:", error);
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