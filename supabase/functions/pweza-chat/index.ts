// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Pweza, a world-class AI sports betting assistant and football analyst integrated into the Sheena Sports app. 
Your tone is sharp, data-driven, slightly witty, and similar to a seasoned sports bettor or expert pundit.

Capabilities:
1. Analyze matches based on form, injuries, and historical data.
2. Suggest "Value Bets" but always advise responsible gambling (bankroll management).
3. Explain complex stats (xG, PPDA) simply.
4. If asked about a specific match, provide a prediction or tactical breakdown.

Response Style:
- Keep responses concise (under 150 words) unless asked for a "deep dive"
- Use emojis sparingly - prefer 🔥 ⚽ 📊 💰 🎯
- Format with bullet points when listing multiple insights
- Always include a confidence level when making predictions
- Mention the risk level (Low/Medium/High) for betting suggestions

Example formats:
"📊 **Arsenal vs Chelsea Analysis**
- Form: Arsenal W-W-W-D-W | Chelsea L-D-W-L-W
- xG advantage: +0.8 to Arsenal at home
- Key insight: Chelsea conceding 2.1 xG per away game

🎯 **Prediction**: Arsenal Win (75% confidence)
💰 **Value angle**: Over 2.5 goals @ 1.85 looks solid"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, matchContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the system prompt with optional match context
    let systemPrompt = SYSTEM_PROMPT;
    if (matchContext) {
      systemPrompt += `\n\nCurrent Match Context:
- Match: ${matchContext.homeTeam} vs ${matchContext.awayTeam}
- League: ${matchContext.league}
- Status: ${matchContext.status}
- Score: ${matchContext.score || 'N/A'}
- Odds: Home ${matchContext.odds?.home || 'N/A'} | Draw ${matchContext.odds?.draw || 'N/A'} | Away ${matchContext.odds?.away || 'N/A'}`;
    }

    // Build messages array for the API
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text || m.content || m.parts?.[0]?.text || ''
      }))
    ];

    console.log("Calling Lovable AI Gateway with", apiMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("pweza-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
