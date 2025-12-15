// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface GenerateNewsRequest {
  topic?: string;
  match_id?: string;
  persona?: "SHEENA" | "ORACLE" | "STREET" | "JOURNALIST";
  tone?: "HYPE" | "RECAP" | "ANALYTICAL" | "RUMOR";
  language?: "ENGLISH" | "SWAHILI";
}

async function generateWithGemini(prompt: string): Promise<any> {
  console.log("Calling Gemini AI for news generation...");

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error("Gemini response:", JSON.stringify(data, null, 2));
    throw new Error("No content generated from Gemini");
  }

  console.log("Gemini response received, parsing JSON...");

  // Clean up any markdown formatting
  let cleanedText = text.trim();
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.slice(7);
  }
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.slice(3);
  }
  if (cleanedText.endsWith("```")) {
    cleanedText = cleanedText.slice(0, -3);
  }

  return JSON.parse(cleanedText.trim());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Test endpoint for debugging API keys
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/test")) {
      return new Response(
        JSON.stringify({
          gemini_key_available: !!GEMINI_API_KEY,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  try {
    const body: GenerateNewsRequest = await req.json();
    const {
      topic = "sports news",
      match_id,
      persona = "SHEENA",
      tone = "RECAP",
      language = "ENGLISH",
    } = body;

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Gemini AI service not configured. Please add GEMINI_API_KEY to your environment." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build search query
    let searchQuery = topic;

    if (match_id && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: match } = await supabaseClient
        .from("matches")
        .select("*")
        .eq("id", match_id)
        .single();

      if (match) {
        searchQuery = `${match.home_team} vs ${match.away_team} match highlights, score, quotes`;
      }
    }

    // Build prompt
    const prompt = `You are ${persona}. ${persona === "STREET" ? "Use slang, emojis, high energy." : "Be professional but engaging."}

TASK: Write a sports news article in ${language}.

TOPIC: ${searchQuery}

TONE: ${tone}

Respond with ONLY valid JSON in this exact format:
{
  "title": "Catchy Headline",
  "summary": "1 sentence hook",
  "blocks": [
    { "type": "TEXT", "content": "First paragraph of the article with 3-4 sentences." },
    { "type": "TEXT", "content": "Second paragraph continuing the story." },
    { "type": "TEXT", "content": "Third paragraph with analysis or context." },
    { "type": "QUOTE", "text": "An insightful quote about the topic", "author": "Expert Name" },
    { "type": "TEXT", "content": "Concluding paragraph with takeaways." }
  ],
  "socialCaption": "Short, viral tweet with hashtags",
  "entities": [],
  "contentTags": [
    { "type": "category", "value": "news", "confidence": 0.9 }
  ],
  "language": "${language.toLowerCase()}",
  "wordCount": 450,
  "readingTimeMinutes": 2,
  "excerpt": "Short excerpt for previews..."
}`;

    // Generate with Gemini
    console.log("🤖 Generating news with Gemini AI...");
    const generated = await generateWithGemini(prompt);
    console.log(`✅ Generated article: ${generated.title}`);

    // Save to feeds table
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: feed, error: feedError } = await supabase
        .from("feeds")
        .insert({
          title: generated.title,
          content: JSON.stringify(generated.blocks),
          source: "AI News Agent",
          type: "news",
          language: generated.language || language.toLowerCase(),
          word_count: generated.wordCount,
          reading_time_minutes: generated.readingTimeMinutes,
          excerpt: generated.excerpt || generated.summary,
        })
        .select()
        .single();

      if (feedError) {
        console.error("Error saving to feeds:", feedError);
      } else if (feed && generated.entities) {
        // Save entities
        const entitiesToInsert = generated.entities.map((entity: any) => ({
          feed_id: feed.id,
          entity_type: entity.type,
          entity_id: entity.entityId,
          entity_name: entity.name,
          confidence: entity.confidence || 1.0,
        }));

        if (entitiesToInsert.length > 0) {
          const { error: entitiesError } = await supabase
            .from("news_entities")
            .insert(entitiesToInsert);

          if (entitiesError) {
            console.error("Error saving entities:", entitiesError);
          }
        }

        // Save content tags
        if (generated.contentTags) {
          const tagsToInsert = generated.contentTags.map((tag: any) => ({
            feed_id: feed.id,
            tag_type: tag.type,
            tag_value: tag.value,
            confidence: tag.confidence || 1.0,
          }));

          if (tagsToInsert.length > 0) {
            const { error: tagsError } = await supabase
              .from("news_content_tags")
              .insert(tagsToInsert);

            if (tagsError) {
              console.error("Error saving content tags:", tagsError);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        article: generated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Generate news error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate news",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
