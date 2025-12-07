// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
  response_time: number;
}

async function searchTavily(query: string, maxResults: number = 5): Promise<TavilySearchResult[]> {
  try {
    if (!TAVILY_API_KEY) {
      throw new Error("TAVILY_API_KEY environment variable not set");
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
        include_images: false,
        include_raw_content: false,
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
    }

    const data: TavilyResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching Tavily:", error);
    return [];
  }
}

serve(async (req) => {
  // CORS headers
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
    const url = new URL(req.url);
    const query = url.searchParams.get("query");
    const maxResults = parseInt(url.searchParams.get("max_results") || "5");

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: query" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(`🔍 Searching Tavily for: ${query}`);
    const results = await searchTavily(query, maxResults);
    console.log(`✅ Found ${results.length} results`);

    // Format results for Gemini grounding
    const groundingContext = results
      .map((r) => `[${r.title}] ${r.content.substring(0, 500)}... (Source: ${r.url})`)
      .join("\n\n");

    return new Response(
      JSON.stringify({
        status: "success",
        query: query,
        results: results,
        groundingContext: groundingContext,
        count: results.length,
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
    console.error("Error in search-news:", error);
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


