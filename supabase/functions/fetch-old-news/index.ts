// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface FetchOldNewsRequest {
  days?: number; // How many days back to fetch
  limit?: number; // Max articles to fetch
  league?: string; // Filter by league
}

async function fetchNewsAPIArticles(query: string, daysBack: number = 7, limit: number = 10) {
  if (!NEWS_API_KEY) {
    console.log("NewsAPI key not configured, returning mock data");
    // Fallback mock data
    return [
      {
        title: `Transfer News: ${query} Market Heating Up`,
        content: `The transfer window is bringing exciting developments in ${query} football...`,
        source: "Sports News API",
        publishedAt: new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com/transfer-news",
        imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000&auto=format&fit=crop"
      }
    ];
  }

  try {
    const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];

    const searchQuery = `${query} football OR soccer`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&from=${fromDate}&to=${toDate}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}&pageSize=${limit}&language=en`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();

    return data.articles.map((article: any) => ({
      title: article.title,
      content: article.description || article.content || "Content not available",
      source: article.source.name,
      publishedAt: article.publishedAt,
      url: article.url,
      imageUrl: article.urlToImage || "https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000&auto=format&fit=crop"
    }));
  } catch (error) {
    console.error("Error fetching from NewsAPI:", error);
    // Fallback to mock data
    return [
      {
        title: `News: ${query} Developments`,
        content: `Recent developments in ${query} sports...`,
        source: "News API Fallback",
        publishedAt: new Date().toISOString(),
        url: "https://example.com/news",
        imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000&auto=format&fit=crop"
      }
    ];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const league = url.searchParams.get('league') || 'football';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: "Database configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch old news articles
    console.log(`Fetching ${limit} old ${league} articles from ${days} days back...`);
    const articles = await fetchNewsAPIArticles(league, days, limit);

    // Store in feeds table
    let stored = 0;
    for (const article of articles) {
      try {
        const { error } = await supabase
          .from("feeds")
          .insert({
            title: article.title,
            content: article.content,
            source: article.source,
            type: "news",
            language: "en",
            word_count: article.content.split(' ').length,
            reading_time_minutes: Math.ceil(article.content.split(' ').length / 200),
            excerpt: article.content.substring(0, 150) + "...",
            image_url: article.imageUrl,
            external_url: article.url,
            created_at: article.publishedAt
          });

        if (!error) {
          stored++;
        } else {
          console.error("Error storing article:", error);
        }
      } catch (error) {
        console.error("Error processing article:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fetched: articles.length,
        stored: stored,
        articles: articles
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fetch old news error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch old news",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});