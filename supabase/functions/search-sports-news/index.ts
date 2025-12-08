// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, topic = "sports", maxResults = 5 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!TAVILY_API_KEY) {
      console.error("TAVILY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Search service not configured", results: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching Tavily for: ${query}`);

    // Call Tavily API
    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${query} ${topic === 'sports' ? 'football soccer betting odds' : ''}`,
        search_depth: "basic",
        max_results: maxResults,
        include_domains: [
          "espn.com",
          "bbc.com/sport",
          "skysports.com",
          "theguardian.com/football",
          "goal.com",
          "transfermarkt.com",
          "whoscored.com",
          "sofascore.com",
          "flashscore.com",
          "oddschecker.com",
          "sportsbook.com"
        ],
      }),
    });

    if (!tavilyResponse.ok) {
      const errorText = await tavilyResponse.text();
      console.error("Tavily API error:", tavilyResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Search failed", results: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tavilyData = await tavilyResponse.json();
    
    // Transform results
    const results = (tavilyData.results || []).map((r: TavilyResult) => ({
      title: r.title,
      url: r.url,
      summary: r.content?.slice(0, 300) + (r.content?.length > 300 ? '...' : ''),
      source: new URL(r.url).hostname.replace('www.', ''),
      publishedAt: r.published_date || new Date().toISOString(),
      relevanceScore: r.score,
    }));

    // Optionally store search results for analytics
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await supabase.from('feeds').insert({
        type: 'SEARCH_QUERY',
        title: query,
        content: JSON.stringify(results.slice(0, 3)),
        metadata: { resultsCount: results.length, topic },
        source: 'tavily',
      }).catch(() => {}); // Ignore errors
    }

    return new Response(
      JSON.stringify({ 
        results, 
        answer: tavilyData.answer || null,
        query 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("search-sports-news error:", error);
    return new Response(
      JSON.stringify({ error: error.message, results: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
