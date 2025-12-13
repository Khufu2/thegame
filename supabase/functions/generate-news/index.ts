// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface GenerateNewsRequest {
   topic?: string;
   match_id?: string;
   persona?: "SHEENA" | "ORACLE" | "STREET" | "JOURNALIST";
   tone?: "HYPE" | "RECAP" | "ANALYTICAL" | "RUMOR";
   language?: "ENGLISH" | "SWAHILI";
   aiProvider?: "GEMINI" | "GROK" | "OLLAMA";
}

async function generateWithLovableAI(prompt: string): Promise<any> {
   try {
     console.log("Calling Lovable AI Gateway for news generation...");

     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         "Authorization": `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-2.5-flash",
         messages: [
           {
             role: "system",
             content: "You are a sports news writer. You generate engaging sports articles in valid JSON format. Always respond with valid JSON only, no markdown."
           },
           {
             role: "user",
             content: prompt
           }
         ],
         temperature: 0.7,
       }),
     });

     if (!response.ok) {
       const errorText = await response.text();
       console.error("Lovable AI error:", response.status, errorText);
       throw new Error(`Lovable AI error: ${response.status}`);
     }

     const data = await response.json();
     const text = data.choices?.[0]?.message?.content;

     if (!text) throw new Error("No content generated");

     // Clean potential markdown formatting
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
   } catch (error) {
     console.error("AI generation error:", error);
     throw error;
   }
}

async function generateWithGrok(prompt: string): Promise<any> {
   try {
     console.log("Calling Grok AI for news generation...");
     console.log("Grok API Key available:", !!GROK_API_KEY);
     console.log("Grok API Key starts with:", GROK_API_KEY?.substring(0, 10) + "...");

     // Try multiple Grok API endpoints and formats
     let response;
     let data;

     // First try: xAI official endpoint
     try {
       console.log("Trying xAI endpoint: https://api.x.ai/v1/chat/completions");
       response = await fetch("https://api.x.ai/v1/chat/completions", {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${GROK_API_KEY}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           model: "grok-2-1212",
           messages: [
             {
               role: "system",
               content: "You are a sports news writer. You generate engaging sports articles in valid JSON format. Always respond with valid JSON only, no markdown formatting."
             },
             {
               role: "user",
               content: prompt
             }
           ],
           temperature: 0.7,
           max_tokens: 2048,
         }),
       });

       if (response.ok) {
         data = await response.json();
       } else {
         console.log(`xAI endpoint failed with status ${response.status}, trying alternatives...`);
       }
     } catch (e) {
       console.log("xAI endpoint error:", e.message);
     }

     // Second try: Alternative xAI endpoint
     if (!data) {
       try {
         console.log("Trying alternative xAI endpoint: https://api.grok.x.ai/v1/chat/completions");
         response = await fetch("https://api.grok.x.ai/v1/chat/completions", {
           method: "POST",
           headers: {
             "Authorization": `Bearer ${GROK_API_KEY}`,
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             model: "grok-2",
             messages: [
               {
                 role: "system",
                 content: "You are a sports news writer. You generate engaging sports articles in valid JSON format. Always respond with valid JSON only, no markdown formatting."
               },
               {
                 role: "user",
                 content: prompt
               }
             ],
             temperature: 0.7,
             max_tokens: 2048,
           }),
         });

         if (response.ok) {
           data = await response.json();
         }
       } catch (e) {
         console.log("Alternative xAI endpoint error:", e.message);
       }
     }

     // Third try: Different auth format (some APIs use x-api-key header)
     if (!data) {
       try {
         console.log("Trying with x-api-key header instead of Bearer token");
         response = await fetch("https://api.x.ai/v1/chat/completions", {
           method: "POST",
           headers: {
             "x-api-key": GROK_API_KEY,
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             model: "grok-2-1212",
             messages: [
               {
                 role: "system",
                 content: "You are a sports news writer. You generate engaging sports articles in valid JSON format. Always respond with valid JSON only, no markdown formatting."
               },
               {
                 role: "user",
                 content: prompt
               }
             ],
             temperature: 0.7,
             max_tokens: 2048,
           }),
         });

         if (response.ok) {
           data = await response.json();
         }
       } catch (e) {
         console.log("x-api-key auth error:", e.message);
       }
     }

     if (!data) {
       // If all attempts failed, provide detailed error
       const errorMsg = `All Grok API endpoints failed. Please check:
1. GROK_API_KEY is correctly set in Supabase secrets
2. The API key is valid and active
3. You may need to redeploy the edge function after adding the secret

API Key available: ${!!GROK_API_KEY}
API Key length: ${GROK_API_KEY?.length || 0}`;

       console.error(errorMsg);
       throw new Error(errorMsg);
     }

     const text = data.choices?.[0]?.message?.content;

     if (!text) {
       console.error("Grok response:", JSON.stringify(data, null, 2));
       throw new Error("No content generated from Grok - check API response format");
     }

     console.log("Grok response received, parsing JSON...");

     // Clean potential markdown formatting
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
   } catch (error) {
     console.error("Grok AI generation error:", error);
     throw error;
   }
}

async function generateWithOllama(prompt: string): Promise<any> {
   try {
     console.log("Calling Ollama (local) for news generation...");

     // Assuming Ollama is running locally on default port 11434
     const response = await fetch("http://localhost:11434/api/generate", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "llama2", // or any model you have installed
         prompt: prompt,
         system: "You are a sports news writer. You generate engaging sports articles in valid JSON format. Always respond with valid JSON only, no markdown formatting.",
         stream: false,
         options: {
           temperature: 0.7,
           num_predict: 2048,
         }
       }),
     });

     if (!response.ok) {
       const errorText = await response.text();
       console.error("Ollama error:", response.status, errorText);
       throw new Error(`Ollama error: ${response.status}`);
     }

     const data = await response.json();
     const text = data.response;

     if (!text) throw new Error("No content generated from Ollama");

     // Clean potential markdown formatting
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
   } catch (error) {
     console.error("Ollama generation error:", error);
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

  // Test endpoint for debugging API keys
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/test")) {
      return new Response(
        JSON.stringify({
          grok_key_available: !!GROK_API_KEY,
          grok_key_length: GROK_API_KEY?.length || 0,
          gemini_key_available: !!LOVABLE_API_KEY,
          gemini_key_length: LOVABLE_API_KEY?.length || 0,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
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
      aiProvider = "GEMINI",
    } = body;

    // Check API keys based on provider
    if (aiProvider === "GEMINI" && !LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured for Gemini");
      return new Response(
        JSON.stringify({ error: "Gemini AI service not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (aiProvider === "GROK") {
       console.log("GROK_API_KEY available:", !!GROK_API_KEY);
       console.log("GROK_API_KEY length:", GROK_API_KEY?.length || 0);
       if (!GROK_API_KEY) {
         console.error("GROK_API_KEY not configured");
         return new Response(
           JSON.stringify({ error: "Grok AI service not configured. Please set GROK_API_KEY in Supabase secrets." }),
           {
             status: 500,
             headers: {
               "Content-Type": "application/json",
               "Access-Control-Allow-Origin": "*",
             },
           }
         );
       }
     }

    // For Ollama, we don't check API keys as it's local

    // Build search query
    let searchQuery = topic;
    
    if (match_id) {
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

You MUST respond with ONLY valid JSON in this exact format (no other text before or after):
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

    // Generate with selected AI provider
    console.log(`🤖 Generating news with ${aiProvider}...`);
    let generated;

    try {
      switch (aiProvider) {
        case "GROK":
          generated = await generateWithGrok(prompt);
          break;
        case "OLLAMA":
          generated = await generateWithOllama(prompt);
          break;
        case "GEMINI":
        default:
          generated = await generateWithLovableAI(prompt);
          break;
      }
      console.log(`✅ Generated article with ${aiProvider}: ${generated.title}`);
    } catch (error) {
      console.error(`❌ ${aiProvider} generation failed:`, error);

      // Fallback to Gemini if other providers fail
      if (aiProvider !== "GEMINI" && LOVABLE_API_KEY) {
        console.log("🔄 Falling back to Gemini...");
        generated = await generateWithLovableAI(prompt);
        console.log(`✅ Generated article with Gemini fallback: ${generated.title}`);
      } else {
        throw error;
      }
    }

    // Save to feeds table
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
      const entitiesToInsert = generated.entities.map(entity => ({
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
        const tagsToInsert = generated.contentTags.map(tag => ({
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


