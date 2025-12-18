// Edge Function for News Aggregation
// Triggers comprehensive news collection from all sources

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import our news aggregator (this will be bundled)
import { newsAggregator } from "../../../services/newsAggregator/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting news aggregation via edge function...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Run the aggregation
    const result = await newsAggregator.aggregateAllSources();

    console.log('📊 Aggregation results:', result.stats);

    // Store news in database
    const newsInserts = result.news.map(story => ({
      type: story.type,
      title: story.title,
      excerpt: story.summary,
      content: JSON.stringify(story.contentBlocks || []),
      image_url: story.imageUrl,
      source: story.source,
      author: story.author,
      tags: story.tags || [],
      metadata: {
        likes: story.likes || 0,
        comments: story.comments || 0,
        isHero: story.isHero || false,
        readingTimeMinutes: story.readingTimeMinutes || 1,
        entities: story.entities || [],
        contentTags: story.contentTags || []
      }
    }));

    if (newsInserts.length > 0) {
      console.log(`💾 Storing ${newsInserts.length} news stories...`);

      const { data, error } = await supabase
        .from('feeds')
        .insert(newsInserts)
        .select();

      if (error) {
        console.error('Error storing news:', error);
        throw error;
      }

      console.log(`✅ Successfully stored ${data?.length || 0} news stories`);
    }

    // Store alerts in database
    const alertInserts = result.alerts.map(alert => ({
      type: 'ALERT',
      title: alert.title,
      excerpt: alert.description,
      content: JSON.stringify({
        dataPoint: alert.dataPoint,
        signalStrength: alert.signalStrength,
        actionableBet: alert.actionableBet
      }),
      tags: [alert.league],
      metadata: {
        alertType: alert.alertType
      }
    }));

    if (alertInserts.length > 0) {
      console.log(`🚨 Storing ${alertInserts.length} alerts...`);

      const { data, error } = await supabase
        .from('feeds')
        .insert(alertInserts)
        .select();

      if (error) {
        console.error('Error storing alerts:', error);
        // Don't throw here, alerts are optional
      } else {
        console.log(`✅ Successfully stored ${data?.length || 0} alerts`);
      }
    }

    // Return comprehensive results
    return new Response(
      JSON.stringify({
        success: true,
        stats: result.stats,
        newsStored: newsInserts.length,
        alertsStored: alertInserts.length,
        cacheStats: newsAggregator.getCacheStats(),
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ News aggregation failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});