// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RSS_FEEDS = [
  // ESPN feeds - comprehensive sports coverage
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer', type: 'soccer', tags: ['EPL', 'LaLiga', 'Bundesliga', 'SerieA', 'Ligue1', 'soccer'] },
  { url: 'https://www.espn.com/espn/rss/nba/news', source: 'ESPN NBA', type: 'basketball', tags: ['NBA', 'basketball'] },
  { url: 'https://www.espn.com/espn/rss/nfl/news', source: 'ESPN NFL', type: 'football', tags: ['NFL', 'football'] },
  { url: 'https://www.espn.com/espn/rss/mlb/news', source: 'ESPN MLB', type: 'baseball', tags: ['MLB', 'baseball'] },
  { url: 'https://www.espn.com/espn/rss/nhl/news', source: 'ESPN NHL', type: 'hockey', tags: ['NHL', 'hockey'] },
  { url: 'https://www.espn.com/espn/rss/golf/news', source: 'ESPN Golf', type: 'golf', tags: ['PGA', 'golf'] },
  { url: 'https://www.espn.com/espn/rss/tennis/news', source: 'ESPN Tennis', type: 'tennis', tags: ['ATP', 'WTA', 'tennis'] },
  { url: 'https://www.espn.com/espn/rss/mma/news', source: 'ESPN MMA', type: 'mma', tags: ['UFC', 'MMA'] },
  { url: 'https://www.espn.com/espn/rss/f1/news', source: 'ESPN F1', type: 'motorsport', tags: ['F1', 'Formula1'] },

  // BBC Sport - multiple sports
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Football', type: 'soccer', tags: ['EPL', 'soccer'] },
  { url: 'https://feeds.bbci.co.uk/sport/rugby-union/rss.xml', source: 'BBC Rugby', type: 'rugby', tags: ['SixNations', 'Rugby'] },
  { url: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml', source: 'BBC Cricket', type: 'cricket', tags: ['TestCricket', 'ODI', 'T20'] },
  { url: 'https://feeds.bbci.co.uk/sport/tennis/rss.xml', source: 'BBC Tennis', type: 'tennis', tags: ['Wimbledon', 'tennis'] },

  // Sky Sports - comprehensive UK sports
  { url: 'https://www.skysports.com/rss/12040', source: 'Sky Sports Football', type: 'soccer', tags: ['EPL', 'Championship', 'soccer'] },
  { url: 'https://www.skysports.com/rss/12150', source: 'Sky Sports Premier League', type: 'soccer', tags: ['EPL', 'soccer'] },
  { url: 'https://www.skysports.com/rss/12060', source: 'Sky Sports Cricket', type: 'cricket', tags: ['IPL', 'cricket'] },
  { url: 'https://www.skysports.com/rss/12080', source: 'Sky Sports Golf', type: 'golf', tags: ['PGA', 'EuropeanTour', 'golf'] },
  { url: 'https://www.skysports.com/rss/12100', source: 'Sky Sports F1', type: 'motorsport', tags: ['F1', 'Formula1'] },

  // Goal.com - soccer focused
  { url: 'https://www.goal.com/feeds/en/news', source: 'Goal.com', type: 'soccer', tags: ['soccer', 'transfers'] },
  { url: 'https://www.goal.com/feeds/en/premier-league', source: 'Goal.com EPL', type: 'soccer', tags: ['EPL', 'soccer'] },
  { url: 'https://www.goal.com/feeds/en/la-liga', source: 'Goal.com LaLiga', type: 'soccer', tags: ['LaLiga', 'soccer'] },
  { url: 'https://www.goal.com/feeds/en/bundesliga', source: 'Goal.com Bundesliga', type: 'soccer', tags: ['Bundesliga', 'soccer'] },
  { url: 'https://www.goal.com/feeds/en/serie-a', source: 'Goal.com Serie A', type: 'soccer', tags: ['SerieA', 'soccer'] },
  { url: 'https://www.goal.com/feeds/en/ligue-1', source: 'Goal.com Ligue 1', type: 'soccer', tags: ['Ligue1', 'soccer'] },

  // The Athletic - premium sports news
  { url: 'https://theathletic.com/feed/', source: 'The Athletic', type: 'multi-sport', tags: ['EPL', 'NBA', 'NFL', 'MLB'] },

  // Eurosport - European sports
  { url: 'https://www.eurosport.com/rss.xml', source: 'Eurosport', type: 'multi-sport', tags: ['soccer', 'tennis', 'cycling'] },

  // African football specific
  { url: 'https://www.bbc.com/afrique/sport/rss.xml', source: 'BBC Afrique Sport', type: 'soccer', tags: ['AfricanFootball', 'CAF'] },
  { url: 'https://www.goal.com/feeds/en/africa', source: 'Goal.com Africa', type: 'soccer', tags: ['AfricanFootball', 'CAF'] },
];

// Get sport-specific fallback image
function getSportFallbackImage(tags: string[]): string {
  const sportImages: Record<string, string> = {
    // Soccer/Football
    'soccer': 'https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=800&auto=format&fit=crop',
    'EPL': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=800&auto=format&fit=crop',
    'LaLiga': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    'Bundesliga': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800&auto=format&fit=crop',
    'SerieA': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=800&auto=format&fit=crop',
    'Ligue1': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop',
    'AfricanFootball': 'https://images.unsplash.com/photo-1552657244-5f6e1e6b152b?q=80&w=800&auto=format&fit=crop',

    // Basketball
    'NBA': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    'basketball': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',

    // American Football
    'NFL': 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=800&auto=format&fit=crop',
    'football': 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=800&auto=format&fit=crop',

    // Baseball
    'MLB': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800&auto=format&fit=crop',
    'baseball': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800&auto=format&fit=crop',

    // Hockey
    'NHL': 'https://images.unsplash.com/photo-1552657244-5f6e1e6b152b?q=80&w=800&auto=format&fit=crop',
    'hockey': 'https://images.unsplash.com/photo-1552657244-5f6e1e6b152b?q=80&w=800&auto=format&fit=crop',

    // Other sports
    'golf': 'https://images.unsplash.com/photo-1587174486073-ae27630f3ed3?q=80&w=800&auto=format&fit=crop',
    'tennis': 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?q=80&w=800&auto=format&fit=crop',
    'cricket': 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop',
    'rugby': 'https://images.unsplash.com/photo-1552657244-5f6e1e6b152b?q=80&w=800&auto=format&fit=crop',
    'mma': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop',
    'motorsport': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
  };

  // Check for specific league/sport matches
  for (const tag of tags) {
    if (sportImages[tag]) {
      return sportImages[tag];
    }
  }

  // Default fallback
  return 'https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=800&auto=format&fit=crop';
}

// Simple RSS parsing with robust CDATA handling
function parseRSSItem(item: string) {
  // Extract title
  let title = '';
  const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1]
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  // Extract link
  let link = '';
  const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (linkMatch) {
    link = linkMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
  }
  // Also try guid as fallback
  if (!link) {
    const guidMatch = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    if (guidMatch) {
      link = guidMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
    }
  }

  // Extract description
  let description = '';
  const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
  if (descMatch) {
    description = descMatch[1]
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .substring(0, 500);
  }

  // Extract pubDate
  let pubDate = '';
  const dateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
  if (dateMatch) {
    pubDate = dateMatch[1].trim();
  }

  // Extract image URL from various sources
  let imageUrl = '';
  const mediaMatch = item.match(/<media:content[^>]*url=["']([^"']+)["']/i);
  const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i);
  const thumbnailMatch = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
  const imgSrcMatch = item.match(/<img[^>]*src=["']([^"']+)["']/i);
  imageUrl = mediaMatch?.[1] || enclosureMatch?.[1] || thumbnailMatch?.[1] || imgSrcMatch?.[1] || '';

  // Extract video URL (YouTube, etc.)
  let videoUrl = '';
  const youtubeMatch = item.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (youtubeMatch) {
    videoUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  } else {
    // Check for other video links in the content
    const videoLinkMatch = item.match(/https?:\/\/(?:www\.)?(?:youtube\.com|vimeo\.com|dailymotion\.com|twitch\.tv)\/[^\s<>"']+/i);
    if (videoLinkMatch) {
      videoUrl = videoLinkMatch[0];
      // Convert YouTube watch URLs to embed
      if (videoUrl.includes('youtube.com/watch?v=')) {
        const videoId = videoUrl.match(/v=([a-zA-Z0-9_-]{11})/)?.[1];
        if (videoId) {
          videoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
    }
  }

  return { title, link, description, pubDate, imageUrl, videoUrl };
}

async function fetchRSSFeed(feedConfig: { url: string; source: string; type: string; tags: string[] }) {
  try {
    console.log(`📡 Fetching ${feedConfig.source} from ${feedConfig.url}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(feedConfig.url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch ${feedConfig.source}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    
    console.log(`📰 Found ${items.length} items from ${feedConfig.source}`);
    
    // Take up to 10 items per feed
    const parsed = items.slice(0, 10).map(item => {
      const data = parseRSSItem(item);
      if (!data.title || data.title.length < 10) return null;
      
      // Create a unique hash based on title + source to avoid cross-source duplicates
      const uniqueTitle = `${data.title}`;
      
      return {
        type: 'news',
        title: uniqueTitle,
        excerpt: data.description || data.title,
        content: data.description,
        image_url: data.imageUrl || getSportFallbackImage(feedConfig.tags),
        video_url: data.videoUrl || null,
        source: feedConfig.source,
        tags: feedConfig.tags,
        metadata: {
          originalUrl: data.link,
          pubDate: data.pubDate,
          fetchedAt: new Date().toISOString()
        }
      };
    }).filter(Boolean);
    
    console.log(`✅ Parsed ${parsed.length} valid items from ${feedConfig.source}`);
    return parsed;
  } catch (error) {
    console.error(`❌ Error fetching ${feedConfig.source}:`, error.message || error);
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
    
    // Flatten results
    const allNews = feedResults.flat().filter(Boolean);
    console.log(`📰 Total items collected: ${allNews.length}`);
    
    // Deduplicate by title within this batch
    const seenTitles = new Set<string>();
    const uniqueNews = allNews.filter(item => {
      if (!item || seenTitles.has(item.title)) return false;
      seenTitles.add(item.title);
      return true;
    });

    console.log(`📰 Unique items after dedup: ${uniqueNews.length}`);

    let storedCount = 0;
    let duplicateCount = 0;

    if (uniqueNews.length > 0) {
      // Get existing titles from the last 7 days only (allow re-fetch of older news)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: existingFeeds, error: fetchError } = await supabase
        .from('feeds')
        .select('title')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (fetchError) {
        console.error('Error fetching existing feeds:', fetchError);
      }
      
      const existingTitles = new Set((existingFeeds || []).map(f => f.title));
      console.log(`📊 Existing titles in last 7 days: ${existingTitles.size}`);
      
      const newItems = uniqueNews.filter(item => !existingTitles.has(item.title));
      duplicateCount = uniqueNews.length - newItems.length;
      
      console.log(`📊 New items to store: ${newItems.length}, Duplicates: ${duplicateCount}`);
      
      if (newItems.length > 0) {
        // Insert in smaller batches to avoid issues
        const batchSize = 10;
        for (let i = 0; i < newItems.length; i += batchSize) {
          const batch = newItems.slice(i, i + batchSize);
          const { data, error } = await supabase
            .from('feeds')
            .insert(batch)
            .select();

          if (error) {
            console.error(`Error storing batch ${i / batchSize + 1}:`, error);
          } else {
            storedCount += data?.length || 0;
            console.log(`✅ Stored batch ${i / batchSize + 1}: ${data?.length || 0} items`);
          }
        }
        
        console.log(`✅ Total stored: ${storedCount} news stories`);
      } else {
        console.log('ℹ️ No new stories to store - all are recent duplicates');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalFetched: allNews.length,
          unique: uniqueNews.length,
          stored: storedCount,
          duplicates: duplicateCount
        },
        sources: RSS_FEEDS.map(f => f.source),
        newsStored: storedCount,
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
