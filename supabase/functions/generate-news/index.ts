import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface GenerateNewsRequest {
  topic?: string;
  match_id?: string;
  persona?: "SHEENA" | "ORACLE" | "STREET" | "JOURNALIST";
  tone?: "HYPE" | "RECAP" | "ANALYTICAL" | "RUMOR";
  language?: "ENGLISH" | "SWAHILI";
  useGrounding?: boolean;
}

async function searchTavily(query: string): Promise<string> {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) throw new Error(`Tavily API error: ${response.status}`);
    const data = await response.json();
    
    return data.results
      .map((r: any) => `[${r.title}] ${r.content.substring(0, 500)}...`)
      .join("\n\n");
  } catch (error) {
    console.error("Tavily search error:", error);
    return "";
  }
}

async function generateWithGemini(
  prompt: string,
  groundingContext: string
): Promise<any> {
  try {
    const fullPrompt = groundingContext
      ? `${prompt}\n\nGROUNDED FACTS:\n${groundingContext}`
      : prompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error("No content generated");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
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
    const body: GenerateNewsRequest = await req.json();
    const {
      topic = "sports news",
      match_id,
      persona = "SHEENA",
      tone = "RECAP",
      language = "ENGLISH",
      useGrounding = true,
    } = body;

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    // Build search query
    let searchQuery = topic;
    if (match_id) {
      // Fetch match details from database
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("id", match_id)
        .single();

      if (match) {
        searchQuery = `${match.home_team} vs ${match.away_team} match highlights, score, quotes last 2 hours`;
      }
    }

    // Get grounding context from Tavily
    let groundingContext = "";
    if (useGrounding && TAVILY_API_KEY) {
      console.log(`🔍 Searching Tavily for: ${searchQuery}`);
      groundingContext = await searchTavily(searchQuery);
      console.log(`✅ Got ${groundingContext.length} chars of grounding context`);
    }

    // Build prompt
    const prompt = `You are ${persona}. ${persona === "STREET" ? "Use slang, emojis, high energy." : "Be professional but engaging."}

TASK: Write a sports news article in ${language}.

TOPIC: ${topic}
${match_id ? `MATCH ID: ${match_id}` : ""}

TONE: ${tone}

OUTPUT JSON FORMAT:
{
  "title": "Catchy Headline",
  "summary": "1 sentence hook",
  "blocks": [
    { "type": "TEXT", "content": "..." },
    { "type": "QUOTE", "text": "...", "author": "..." }
  ],
  "socialCaption": "Short, viral tweet with hashtags"
}`;

    // Generate with Gemini
    console.log(`🤖 Generating news with Gemini...`);
    const generated = await generateWithGemini(prompt, groundingContext);
    console.log(`✅ Generated article: ${generated.title}`);

    // Save to feeds table
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .insert({
        title: generated.title,
        content: JSON.stringify(generated.blocks),
        source: "AI News Agent",
        type: "news",
        sentiment: tone === "HYPE" ? "positive" : tone === "RUMOR" ? "neutral" : "neutral",
      })
      .select()
      .single();

    if (feedError) {
      console.error("Error saving to feeds:", feedError);
    }

    return new Response(
      JSON.stringify({
        status: "success",
        article: {
          ...generated,
          id: feed?.id,
          created_at: feed?.created_at,
        },
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
    console.error("Error in generate-news:", error);
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


