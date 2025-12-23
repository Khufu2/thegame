// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use Groq API for news generation
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface GenerateNewsRequest {
  content_type?: "pre-match" | "post-match" | "top-storylines" | "players-to-watch" | "injury-roundup" | "power-rankings";
  league?: string;
  match_id?: string;
  home_team?: string;
  away_team?: string;
  date_time?: string;
  input_data?: any;
  language?: "ENGLISH" | "SWAHILI";
}

const SHEENA_SYSTEM_PROMPT = `You are Sheena News Engine — an elite sports newsroom AI.

Your writing style combines:
- CBS Sports post-game clarity
- ESPN storytelling
- Bleacher Report fan energy
- Data-driven analysis (concise, not academic)

Rules:
- Always be factual and grounded in provided data only
- Never hallucinate injuries, scores, or stats
- Write for African & global sports fans
- Keep paragraphs short and mobile-friendly
- Use strong but neutral headlines
- Highlight momentum swings, key performers, and tactical impact
- Avoid betting language unless explicitly requested

Tone:
- Confident
- Insightful
- Exciting, but not exaggerated

Output format:
- Headline
- 2–4 short sections with bold subheaders
- Optional stat callouts (if provided)

If data is missing, acknowledge uncertainty instead of guessing.`;

async function generateWithGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  console.log("Calling Groq API for news generation...");

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error:", response.status, errorText);

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("API quota exceeded.");
    }

    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    console.error("Groq response:", JSON.stringify(data, null, 2));
    throw new Error("No content generated from Groq");
  }

  console.log("Groq response received");
  return text.trim();
}

async function fetchYouTubeHighlights(searchQuery: string): Promise<any[]> {
  if (!YOUTUBE_API_KEY) {
    console.log("YouTube API key not configured, skipping highlights fetch");
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery + " highlights")}&type=video&order=relevance&maxResults=5&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return [];
    }

    const data = await response.json();
    return data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.default.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    })) || [];
  } catch (error) {
    console.error("Error fetching YouTube highlights:", error);
    return [];
  }
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
          groq_api_available: !!GROQ_API_KEY,
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
      content_type = "post-match",
      league,
      match_id,
      home_team,
      away_team,
      date_time,
      input_data = {},
      language = "ENGLISH",
    } = body;

    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please set GROQ_API_KEY environment variable." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch additional data if needed
    let enrichedInputData = { ...input_data };

    if (match_id && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: match } = await supabaseClient
        .from("matches")
        .select("*")
        .eq("id", match_id)
        .single();

      if (match) {
        enrichedInputData.match_details = match;
        if (!home_team) home_team = match.home_team;
        if (!away_team) away_team = match.away_team;
        if (!league) league = match.league;
        if (!date_time) date_time = match.date_time;
      }
    }

    // Build user prompt based on content type
    let userPrompt = "";

    if (content_type === "pre-match") {
      userPrompt = `TASK:
Generate a pre-match preview article.

LEAGUE: ${league || "Unknown League"}
MATCH: ${home_team || "Home Team"} vs ${away_team || "Away Team"}
KICKOFF: ${date_time || "TBD"}

INPUT_DATA (JSON):
${JSON.stringify(enrichedInputData, null, 2)}

CONTENT REQUIREMENTS:
- Start with a compelling headline
- Explain what's at stake in this match
- Analyze how injuries affect tactics and momentum
- Highlight 2–3 key player matchups
- Add hype without exaggeration
- Write as if published 6–12 hours before kickoff

AVOID:
- Predictions framed as guarantees
- Betting odds
- Speculation not supported by data`;
    } else if (content_type === "post-match") {
      // Fetch YouTube highlights for post-match content
      const highlights = await fetchYouTubeHighlights(`${home_team || "Home"} vs ${away_team || "Away"}`);
      if (highlights.length > 0) {
        enrichedInputData.featured_video = highlights[0];
      }

      userPrompt = `TASK:
Write a post-match recap article.

LEAGUE: ${league || "Unknown League"}
MATCH: ${home_team || "Home Team"} vs ${away_team || "Away Team"}

INPUT_DATA (JSON):
${JSON.stringify(enrichedInputData, null, 2)}

CONTENT REQUIREMENTS:
- Headline that reflects the result and narrative
- Describe how the match unfolded chronologically
- Highlight momentum shifts and tactical changes
- Call out standout performances with stats
- End with what this result means going forward

STYLE:
- CBS Sports clarity
- ESPN-level insight
- No fluff, no emojis`;
    } else if (content_type === "top-storylines") {
      userPrompt = `TASK:
Generate "Top 5 Storylines from Yesterday's Matches".

INPUT_DATA (JSON):
${JSON.stringify(enrichedInputData, null, 2)}

RULES:
- Rank storylines from most impactful to least
- Each storyline: 2–3 sentences
- Focus on drama, surprises, and implications
- Write for fans who missed the games`;
    } else if (content_type === "players-to-watch") {
      userPrompt = `TASK:
Generate "Players to Watch This Week".

INPUT_DATA (JSON):
${JSON.stringify(enrichedInputData, null, 2)}

RULES:
- Select 5 players max
- Explain why each matters this week
- Include form, role, and matchup context
- Avoid hype without evidence`;
    } else if (content_type === "injury-roundup") {
      userPrompt = `TASK:
Generate an injury roundup article.

INPUT_DATA (JSON):
${JSON.stringify(enrichedInputData, null, 2)}

RULES:
- Group by league
- Explain tactical and lineup impact
- Avoid medical speculation
- Clear and factual tone`;
    } else if (content_type === "power-rankings") {
      userPrompt = `TASK:
Generate Power Rankings.

LEAGUE: ${league || "Unknown League"}

INPUT_DATA (JSON):
${JSON.stringify(enrichedInputData, null, 2)}

RULES:
- Rank top 5 or top 10
- Justify each position in 2 sentences
- Focus on momentum, not reputation`;
    }

    // Generate with Groq (add delay for free tier rate limiting)
    console.log(`🤖 Generating ${content_type} content with Groq...`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    const generatedText = await generateWithGroq(SHEENA_SYSTEM_PROMPT, userPrompt);
    console.log(`✅ Generated content`);

    // Parse the response - assuming it's plain text for now, but we can adjust
    const generated = {
      title: "Generated Article", // Extract from response if needed
      content: generatedText,
      language: language.toLowerCase(),
      wordCount: generatedText.split(' ').length,
      readingTimeMinutes: Math.ceil(generatedText.split(' ').length / 200),
      excerpt: generatedText.substring(0, 150) + "..."
    };

    // Save to feeds table
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const feedData: any = {
        title: generated.title || `${content_type} - ${home_team || ""} vs ${away_team || ""}`,
        content: generated.content,
        source: "Sheena News Engine (Groq)",
        type: "news",
        language: generated.language,
        word_count: generated.wordCount,
        reading_time_minutes: generated.readingTimeMinutes,
        excerpt: generated.excerpt,
      };

      // Add video URL if available (for post-match content)
      if (enrichedInputData.featured_video) {
        feedData.video_url = enrichedInputData.featured_video.url;
      }

      const { data: feed, error: feedError } = await supabase
        .from("feeds")
        .insert(feedData)
        .select()
        .single();

      if (feedError) {
        console.error("Error saving to feeds:", feedError);
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