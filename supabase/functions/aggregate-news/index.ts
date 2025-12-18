// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RSS_FEEDS = [
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN', type: 'soccer' },
  { url: 'https://www.goal.com/feeds/en/news', source: 'Goal.com', type: 'soccer' },
  { url: 'https://www.skysports.com/rss/12040', source: 'Sky Sports', type: 'soccer' },
];

// Simple RSS parsing
function parseRSSItem(item: string) {
  const title = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/)?.[1]?.trim() || '';
  const link = item.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() || '';
  const description = item.match(/<description>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/description>/)?.[1]?.trim() || '';
  const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim() || '';
  const imageUrl = item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/)?.[1] || 
                   item.match(/<media:content[^>]*url="([^"]+)"/)?.[1] || '';
  
  return { title, link, description, pubDate, imageUrl };
}

async function fetchRSSFeed(feedConfig: { url: string; source: string; type: string }) {
  try {
    const response = await fetch(feedConfig.url, {
      headers: { 'User-Agent': 'Sheena Sports News Bot/1.0' }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${feedConfig.source}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    return items.slice(0, 5).map(item => {
      const parsed = parseRSSItem(item);
      return {
        type: 'NEWS',
        title: parsed.title,
        excerpt: parsed.description.substring(0, 200),
        content: JSON.stringify([{ type: 'text', content: parsed.description }]),
        image_url: parsed.imageUrl || null,
        source: feedConfig.source,
        tags: [feedConfig.type],
        metadata: { 
          originalUrl: parsed.link,
          pubDate: parsed.pubDate 
        }
      };
    });
  } catch (error) {
    console.error(`Error fetching ${feedConfig.source}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting news aggregation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch from all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(feed => fetchRSSFeed(feed));
    const feedResults = await Promise.all(feedPromises);
    
    // Flatten and deduplicate by title
    const allNews = feedResults.flat();
    const seenTitles = new Set<string>();
    const uniqueNews = allNews.filter(item => {
      if (seenTitles.has(item.title)) return false;
      seenTitles.add(item.title);
      return true;
    });

    console.log(`📰 Collected ${uniqueNews.length} unique news items`);

    if (uniqueNews.length > 0) {
      // Upsert to avoid duplicates
      const { data, error } = await supabase
        .from('feeds')
        .upsert(uniqueNews, { 
          onConflict: 'title',
          ignoreDuplicates: true 
        })
        .select();

      if (error) {
        console.error('Error storing news:', error);
        throw error;
      }

      console.log(`✅ Stored ${data?.length || 0} news stories`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        newsCollected: uniqueNews.length,
        sources: RSS_FEEDS.map(f => f.source),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
