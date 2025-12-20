// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RSS_FEEDS = [
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer', type: 'soccer' },
  { url: 'https://www.espn.com/espn/rss/nba/news', source: 'ESPN NBA', type: 'NBA' },
  { url: 'https://www.espn.com/espn/rss/nfl/news', source: 'ESPN NFL', type: 'NFL' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml', source: 'NY Times Sports', type: 'general' },
];

// Simple RSS parsing with better CDATA handling
function parseRSSItem(item: string) {
  // Extract title with CDATA handling
  let title = '';
  const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
  }

  // Extract link
  let link = '';
  const linkMatch = item.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (linkMatch) {
    link = linkMatch[1].trim();
  }

  // Extract description with CDATA handling
  let description = '';
  const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
  if (descMatch) {
    description = descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
  }

  // Extract pubDate
  let pubDate = '';
  const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/i);
  if (dateMatch) {
    pubDate = dateMatch[1].trim();
  }

  // Extract image URL from various sources
  let imageUrl = '';
  const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i);
  const mediaMatch = item.match(/<media:content[^>]*url="([^"]+)"/i);
  const imgMatch = item.match(/<img[^>]*src="([^"]+)"/i);
  imageUrl = enclosureMatch?.[1] || mediaMatch?.[1] || imgMatch?.[1] || '';

  return { title, link, description, pubDate, imageUrl };
}

async function fetchRSSFeed(feedConfig: { url: string; source: string; type: string }) {
  try {
    console.log(`📡 Fetching ${feedConfig.source}...`);
    
    const response = await fetch(feedConfig.url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; SheenaSportsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch ${feedConfig.source}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    
    console.log(`📰 Found ${items.length} items from ${feedConfig.source}`);
    
    return items.slice(0, 5).map(item => {
      const parsed = parseRSSItem(item);
      if (!parsed.title) return null;
      
      return {
        type: 'news',
        title: parsed.title,
        excerpt: parsed.description.substring(0, 300) || parsed.title,
        content: parsed.description,
        image_url: parsed.imageUrl || 'https://images.unsplash.com/photo-1461896836934- voices-of-black?q=80&w=800&auto=format&fit=crop',
        source: feedConfig.source,
        tags: [feedConfig.type],
        metadata: { 
          originalUrl: parsed.link,
          pubDate: parsed.pubDate 
        }
      };
    }).filter(Boolean);
  } catch (error) {
    console.error(`❌ Error fetching ${feedConfig.source}:`, error);
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
    const allNews = feedResults.flat().filter(Boolean);
    const seenTitles = new Set<string>();
    const uniqueNews = allNews.filter(item => {
      if (!item || seenTitles.has(item.title)) return false;
      seenTitles.add(item.title);
      return true;
    });

    console.log(`📰 Collected ${uniqueNews.length} unique news items from ${RSS_FEEDS.length} sources`);

    let storedCount = 0;
    let duplicateCount = 0;

    if (uniqueNews.length > 0) {
      // Get existing titles to avoid duplicates
      const { data: existingFeeds } = await supabase
        .from('feeds')
        .select('title')
        .in('title', uniqueNews.map(n => n.title));
      
      const existingTitles = new Set(existingFeeds?.map(f => f.title) || []);
      const newItems = uniqueNews.filter(item => !existingTitles.has(item.title));
      duplicateCount = uniqueNews.length - newItems.length;
      
      if (newItems.length > 0) {
        const { data, error } = await supabase
          .from('feeds')
          .insert(newItems)
          .select();

        if (error) {
          console.error('Error storing news:', error);
          throw error;
        }

        storedCount = data?.length || 0;
        console.log(`✅ Stored ${storedCount} news stories`);
      } else {
        console.log('ℹ️ No new stories to store (all duplicates)');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalFetched: allNews.length,
          processed: uniqueNews.length,
          stored: storedCount,
          duplicates: duplicateCount
        },
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
