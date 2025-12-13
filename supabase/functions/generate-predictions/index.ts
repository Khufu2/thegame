// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface GeneratePredictionRequest {
  matchId: string;
  league?: string;
  homeTeam: string;
  awayTeam: string;
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
      .map((r: any) => `[${r.title}] ${r.content.substring(0, 400)}...`)
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
            temperature: 0.3, // Lower temperature for more consistent predictions
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
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

async function generateFallbackPrediction(homeTeam: string, awayTeam: string, league: string, matchId: string): Promise<any> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get basic historical data for fallback prediction
    const { data: homeMatches } = await supabase
      .from('matches')
      .select('home_team, away_team, home_score, away_score, status')
      .or(`home_team.eq.${homeTeam},away_team.eq.${homeTeam}`)
      .eq('status', 'FINISHED')
      .order('kickoff_time', { ascending: false })
      .limit(5);

    const { data: awayMatches } = await supabase
      .from('matches')
      .select('home_team, away_team, home_score, away_score, status')
      .or(`home_team.eq.${awayTeam},away_team.eq.${awayTeam}`)
      .eq('status', 'FINISHED')
      .order('kickoff_time', { ascending: false })
      .limit(5);

    // Calculate basic form
    let homeForm = 0.5; // Default neutral
    let awayForm = 0.5;

    if (homeMatches && homeMatches.length > 0) {
      const homeWins = homeMatches.filter(m => {
        const isHome = m.home_team === homeTeam;
        const goalsFor = isHome ? m.home_score : m.away_score;
        const goalsAgainst = isHome ? m.away_score : m.home_score;
        return goalsFor > goalsAgainst;
      }).length;
      homeForm = homeWins / homeMatches.length;
    }

    if (awayMatches && awayMatches.length > 0) {
      const awayWins = awayMatches.filter(m => {
        const isHome = m.home_team === awayTeam;
        const goalsFor = isHome ? m.home_score : m.away_score;
        const goalsAgainst = isHome ? m.away_score : m.home_score;
        return goalsFor > goalsAgainst;
      }).length;
      awayForm = awayWins / awayMatches.length;
    }

    // Simple prediction logic based on form
    let outcome = 'DRAW';
    let confidence = 50;
    let scorePrediction = '1-1';

    if (homeForm > awayForm + 0.2) {
      outcome = 'HOME_WIN';
      confidence = Math.min(75, 50 + (homeForm - awayForm) * 50);
      scorePrediction = '2-1';
    } else if (awayForm > homeForm + 0.2) {
      outcome = 'AWAY_WIN';
      confidence = Math.min(75, 50 + (awayForm - homeForm) * 50);
      scorePrediction = '1-2';
    }

    // Generate basic odds based on confidence
    const homeProb = outcome === 'HOME_WIN' ? confidence : outcome === 'AWAY_WIN' ? (100 - confidence) / 2 : 33;
    const awayProb = outcome === 'AWAY_WIN' ? confidence : outcome === 'HOME_WIN' ? (100 - confidence) / 2 : 33;
    const drawProb = 100 - homeProb - awayProb;

    const homeOdds = homeProb > 0 ? (100 / homeProb).toFixed(2) : '3.00';
    const awayOdds = awayProb > 0 ? (100 / awayProb).toFixed(2) : '3.00';
    const drawOdds = drawProb > 0 ? (100 / drawProb).toFixed(2) : '3.00';

    return {
      outcome,
      confidence: Math.round(confidence),
      scorePrediction,
      aiReasoning: `Fallback prediction based on recent form. ${homeTeam} form: ${(homeForm * 100).toFixed(0)}%, ${awayTeam} form: ${(awayForm * 100).toFixed(0)}%.`,
      keyInsight: `Basic analysis using recent match results`,
      bettingAngle: `${outcome === 'HOME_WIN' ? homeTeam : outcome === 'AWAY_WIN' ? awayTeam : 'Draw'} based on form`,
      odds: {
        home: parseFloat(homeOdds),
        draw: parseFloat(drawOdds),
        away: parseFloat(awayOdds)
      },
      probability: {
        home: Math.round(homeProb),
        draw: Math.round(drawProb),
        away: Math.round(awayProb)
      },
      isValuePick: confidence > 70,
      riskLevel: confidence > 75 ? 'LOW' : confidence > 60 ? 'MEDIUM' : 'HIGH',
      modelEdge: 0,
      systemRecord: 'Basic Fallback'
    };

  } catch (error) {
    console.error("Error generating fallback prediction:", error);

    // Ultimate fallback - completely random but balanced
    return {
      outcome: 'DRAW',
      confidence: 33,
      scorePrediction: '1-1',
      aiReasoning: 'Emergency fallback prediction - insufficient data available',
      keyInsight: 'Unable to analyze team performance',
      bettingAngle: 'Draw - neutral prediction',
      odds: { home: 3.00, draw: 3.00, away: 3.00 },
      probability: { home: 33, draw: 34, away: 33 },
      isValuePick: false,
      riskLevel: 'HIGH',
      modelEdge: 0,
      systemRecord: 'Emergency Fallback'
    };
  }
}

async function getTeamElo(supabase: any, teamId: string): Promise<number> {
  const { data, error } = await supabase
    .from('team_elo_ratings')
    .select('elo_rating')
    .eq('team_id', teamId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error(`Error fetching Elo for team ${teamId}:`, error);
    return 1500; // Default Elo rating
  }

  return data?.elo_rating || 1500;
}

async function getHistoricalData(homeTeam: string, awayTeam: string, league: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get Elo ratings first (Advanced ML feature)
    const homeElo = await getTeamElo(supabase, homeTeam);
    const awayElo = await getTeamElo(supabase, awayTeam);
    const eloDifference = homeElo - awayElo;

    // Get enhanced team statistics
    const { data: homeStats } = await supabase
      .from('team_stats')
      .select('*')
      .eq('team_name', homeTeam)
      .eq('league', league)
      .eq('season', '2024')
      .single();

    const { data: awayStats } = await supabase
      .from('team_stats')
      .select('*')
      .eq('team_name', awayTeam)
      .eq('league', league)
      .eq('season', '2024')
      .single();

    // Get key players for both teams
    const { data: homePlayers } = await supabase
      .from('player_stats')
      .select('player_name, position, goals, assists, injury_status, average_rating')
      .eq('team_name', homeTeam)
      .eq('league', league)
      .eq('season', '2024')
      .order('goals', { ascending: false })
      .limit(5);

    const { data: awayPlayers } = await supabase
      .from('player_stats')
      .select('player_name, position, goals, assists, injury_status, average_rating')
      .eq('team_name', awayTeam)
      .eq('league', league)
      .eq('season', '2024')
      .order('goals', { ascending: false })
      .limit(5);

    // Get recent matches for both teams (fallback to basic match data)
    const { data: homeMatches } = await supabase
      .from('matches')
      .select('home_team, away_team, home_score, away_score, status')
      .or(`home_team.eq.${homeTeam},away_team.eq.${homeTeam}`)
      .eq('status', 'FINISHED')
      .order('kickoff_time', { ascending: false })
      .limit(10);

    const { data: awayMatches } = await supabase
      .from('matches')
      .select('home_team, away_team, home_score, away_score, status')
      .or(`home_team.eq.${awayTeam},away_team.eq.${awayTeam}`)
      .eq('status', 'FINISHED')
      .order('kickoff_time', { ascending: false })
      .limit(10);

    // Get head-to-head matches
    const { data: h2hMatches } = await supabase
      .from('matches')
      .select('home_team, away_team, home_score, away_score, status')
      .or(`and(home_team.eq.${homeTeam},away_team.eq.${awayTeam}),and(home_team.eq.${awayTeam},away_team.eq.${homeTeam})`)
      .eq('status', 'FINISHED')
      .order('kickoff_time', { ascending: false })
      .limit(5);

    // Get current league standings
    const { data: standings } = await supabase
      .from('standings')
      .select('team_name, position, points, played, won, drawn, lost, goals_for, goals_against')
      .eq('league', league)
      .order('position', { ascending: true });

    let historicalContext = "";

    // Elo ratings (Advanced ML feature)
    historicalContext += `Elo Ratings (Advanced ML): ${homeTeam} (${homeElo}) vs ${awayTeam} (${awayElo}) - Difference: ${eloDifference > 0 ? '+' : ''}${eloDifference}\n`;

    // Enhanced team statistics
    if (homeStats) {
      historicalContext += `${homeTeam} Statistics:\n`;
      historicalContext += `- Record: ${homeStats.wins}W-${homeStats.draws}D-${homeStats.losses}L (${homeStats.points} pts)\n`;
      historicalContext += `- Goals: ${homeStats.goals_for} scored, ${homeStats.goals_against} conceded\n`;
      historicalContext += `- Recent Form: ${homeStats.recent_form || 'N/A'}\n`;
      historicalContext += `- Elo Rating: ${homeStats.elo_rating || homeElo}\n`;
      historicalContext += `- Home Performance: ${homeStats.home_wins}W-${homeStats.home_draws}D-${homeStats.home_losses}L\n`;
      if (homeStats.injuries_count > 0) {
        historicalContext += `- Injuries: ${homeStats.injuries_count} players unavailable\n`;
      }
    }

    if (awayStats) {
      historicalContext += `${awayTeam} Statistics:\n`;
      historicalContext += `- Record: ${awayStats.wins}W-${awayStats.draws}D-${awayStats.losses}L (${awayStats.points} pts)\n`;
      historicalContext += `- Goals: ${awayStats.goals_for} scored, ${awayStats.goals_against} conceded\n`;
      historicalContext += `- Recent Form: ${awayStats.recent_form || 'N/A'}\n`;
      historicalContext += `- Elo Rating: ${awayStats.elo_rating || awayElo}\n`;
      historicalContext += `- Away Performance: ${awayStats.away_wins}W-${awayStats.away_draws}D-${awayStats.away_losses}L\n`;
      if (awayStats.injuries_count > 0) {
        historicalContext += `- Injuries: ${awayStats.injuries_count} players unavailable\n`;
      }
    }

    // Key players analysis
    if (homePlayers && homePlayers.length > 0) {
      const topScorer = homePlayers.find(p => p.goals > 0);
      const injuredPlayers = homePlayers.filter(p => p.injury_status !== 'available');
      historicalContext += `${homeTeam} Key Players:\n`;
      if (topScorer) {
        historicalContext += `- Top Scorer: ${topScorer.player_name} (${topScorer.goals} goals)\n`;
      }
      if (injuredPlayers.length > 0) {
        historicalContext += `- Injuries: ${injuredPlayers.length} key players unavailable\n`;
      }
    }

    if (awayPlayers && awayPlayers.length > 0) {
      const topScorer = awayPlayers.find(p => p.goals > 0);
      const injuredPlayers = awayPlayers.filter(p => p.injury_status !== 'available');
      historicalContext += `${awayTeam} Key Players:\n`;
      if (topScorer) {
        historicalContext += `- Top Scorer: ${topScorer.player_name} (${topScorer.goals} goals)\n`;
      }
      if (injuredPlayers.length > 0) {
        historicalContext += `- Injuries: ${injuredPlayers.length} key players unavailable\n`;
      }
    }

    // Traditional match data (fallback)
    if (!homeStats && homeMatches && homeMatches.length > 0) {
      const homeForm = homeMatches.slice(0, 5).map(m => {
        const isHome = m.home_team === homeTeam;
        const goalsFor = isHome ? m.home_score : m.away_score;
        const goalsAgainst = isHome ? m.away_score : m.home_score;
        const result = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
        return result;
      }).join('');
      historicalContext += `${homeTeam} recent form: ${homeForm}\n`;
    }

    if (!awayStats && awayMatches && awayMatches.length > 0) {
      const awayForm = awayMatches.slice(0, 5).map(m => {
        const isHome = m.home_team === awayTeam;
        const goalsFor = isHome ? m.home_score : m.away_score;
        const goalsAgainst = isHome ? m.away_score : m.home_score;
        const result = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
        return result;
      }).join('');
      historicalContext += `${awayTeam} recent form: ${awayForm}\n`;
    }

    // Head-to-head
    if (h2hMatches && h2hMatches.length > 0) {
      const h2hStats = h2hMatches.reduce((acc, m) => {
        if (m.home_team === homeTeam) {
          if (m.home_score > m.away_score) acc.homeWins++;
          else if (m.home_score < m.away_score) acc.awayWins++;
          else acc.draws++;
        } else {
          if (m.away_score > m.home_score) acc.awayWins++;
          else if (m.away_score < m.home_score) acc.homeWins++;
          else acc.draws++;
        }
        return acc;
      }, { homeWins: 0, awayWins: 0, draws: 0 });

      historicalContext += `Head-to-head (last ${h2hMatches.length} meetings): ${homeTeam} ${h2hStats.homeWins}W-${h2hStats.draws}D-${h2hStats.awayWins}L ${awayTeam}\n`;
    }

    // League positions
    if (standings && standings.length > 0) {
      const homeStanding = standings.find(s => s.team_name === homeTeam);
      const awayStanding = standings.find(s => s.team_name === awayTeam);

      if (homeStanding) {
        historicalContext += `${homeTeam} league position: ${homeStanding.position} (${homeStanding.points} pts, ${homeStanding.won}W-${homeStanding.drawn}D-${homeStanding.lost}L)\n`;
      }
      if (awayStanding) {
        historicalContext += `${awayTeam} league position: ${awayStanding.position} (${awayStanding.points} pts, ${awayStanding.won}W-${awayStanding.drawn}D-${awayStanding.lost}L)\n`;
      }
    }

    return historicalContext;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return "";
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
    const body: GeneratePredictionRequest = await req.json();
    const { matchId, league = "Premier League", homeTeam, awayTeam } = body;

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    if (!homeTeam || !awayTeam) {
      throw new Error("homeTeam and awayTeam are required");
    }

    // Get historical data
    console.log(`📊 Fetching historical data for ${homeTeam} vs ${awayTeam}`);
    const historicalData = await getHistoricalData(homeTeam, awayTeam, league);

    // Get weather data for the match
    let weatherContext = "";
    try {
      // Try to get weather for a major stadium (this would need to be enhanced with actual venue data)
      const weatherResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/fetch-weather`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stadiumName: `${homeTeam} Stadium`,
            city: "London", // Default city, should be enhanced with real venue data
            matchId: matchId
          }),
        }
      );

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        if (weatherData.weather) {
          const w = weatherData.weather;
          weatherContext = `Weather Conditions: ${w.temperature}°C, ${w.weather_condition}, ${w.wind_speed}km/h wind, ${w.humidity}% humidity, ${w.precipitation_probability}% chance of rain.\n`;
        }
      }
    } catch (error) {
      console.warn("Weather data not available:", error);
    }

    // Build search query for current context
    const searchQuery = `${homeTeam} vs ${awayTeam} ${league} match preview, current form, injuries, odds analysis`;
    let groundingContext = "";
    if (TAVILY_API_KEY) {
      console.log(`🔍 Searching Tavily for: ${searchQuery}`);
      groundingContext = await searchTavily(searchQuery);
      console.log(`✅ Got ${groundingContext.length} chars of grounding context`);
    }

    // Combine historical, weather, and current context
    const fullContext = historicalData + "\n\n" + weatherContext + "\n\n" + groundingContext;

    // Get optimized prompt from performance data
    let selectedPrompt = null;
    let promptSource = 'default';

    try {
      // Check for best performing prompt
      const optimizeResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/optimize-prompts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'GET_BEST',
            league: league
          }),
        }
      );

      if (optimizeResponse.ok) {
        const optimizeData = await optimizeResponse.json();
        if (optimizeData.result && optimizeData.result.prompt_template) {
          selectedPrompt = optimizeData.result.prompt_template;
          promptSource = 'optimized';
        }
      }
    } catch (error) {
      console.warn('Could not fetch optimized prompt, using default:', error);
    }

    // Check for active A/B test
    let abVariant = null;
    try {
      const abResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/ab-testing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'LIST'
          }),
        }
      );

      if (abResponse.ok) {
        const abData = await abResponse.json();
        const activeExperiments = abData.result.filter((exp: any) => exp.status === 'ACTIVE');

        if (activeExperiments.length > 0) {
          // Use first active experiment for simplicity
          const experiment = activeExperiments[0];

          const variantResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/ab-testing`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'GET_VARIANT',
                experimentId: experiment.id,
                matchId: matchId
              }),
            }
          );

          if (variantResponse.ok) {
            const variantData = await variantResponse.json();
            abVariant = variantData.result;

            if (abVariant === 'B' && experiment.experiment_type === 'PROMPT') {
              const variantBConfig = JSON.parse(experiment.variant_b);
              if (variantBConfig.prompt) {
                selectedPrompt = variantBConfig.prompt;
                promptSource = `ab_test_${experiment.id}_B`;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not check A/B tests, proceeding with optimized/default prompt:', error);
    }

    // Use optimized prompt or fall back to default
    const prompt = selectedPrompt || `You are an expert sports analyst specializing in ${league} predictions with advanced ML capabilities. Analyze this match using Elo ratings and comprehensive data.

MATCH: ${homeTeam} vs ${awayTeam} (${league})

INSTRUCTIONS:
1. Analyze Elo ratings and their implications for match outcome
2. Consider historical data, current form, league context, and weather conditions
3. Use Elo rating differences to inform probability calculations
4. Provide a predicted outcome (HOME_WIN, DRAW, AWAY_WIN) factoring in Elo
5. Give a confidence percentage (0-100) based on Elo strength and data quality
6. Predict the most likely score using Elo-based goal expectations
7. Provide detailed reasoning including Elo analysis and statistical insights
8. Identify the key insight that drives your confidence (focus on Elo when significant)
9. Suggest the best betting angle considering Elo ratings and all factors
10. Provide realistic odds estimates calibrated with Elo probabilities
11. Calculate probability distribution using Elo model as foundation
12. Determine if this is a value pick based on Elo vs market odds comparison
13. Assess risk level considering Elo reliability and uncertainty factors
14. Estimate model edge combining Elo accuracy with other data sources
15. Provide a system record simulation based on Elo performance

ELO ANALYSIS GUIDANCE:
- Elo difference > 200: Strong favorite (high confidence)
- Elo difference 100-200: Moderate favorite (medium confidence)
- Elo difference < 100: Close match (lower confidence, consider draw)
- Home advantage typically adds 100 Elo points

OUTPUT FORMAT (JSON):
{
  "outcome": "HOME_WIN" | "DRAW" | "AWAY_WIN",
  "confidence": 85,
  "scorePrediction": "2-1",
  "aiReasoning": "Detailed analysis including Elo ratings and statistical factors",
  "keyInsight": "The single most important factor (often Elo-based)",
  "bettingAngle": "Recommended bet type considering Elo analysis",
  "odds": { "home": 2.10, "draw": 3.40, "away": 3.20 },
  "probability": { "home": 48, "draw": 27, "away": 25 },
  "isValuePick": true,
  "riskLevel": "MEDIUM",
  "modelEdge": 3.2,
  "systemRecord": "8-2 L10"
}`;

    console.log(`📝 Using prompt source: ${promptSource}`);

    // Generate prediction with Gemini
    console.log(`🤖 Generating prediction for ${homeTeam} vs ${awayTeam}...`);
    const prediction = await generateWithGemini(prompt, fullContext);
    console.log(`✅ Generated prediction: ${prediction.outcome} (${prediction.confidence}% confidence)`);

    // Validate prediction structure
    const validatedPrediction = {
      outcome: prediction.outcome || "DRAW",
      confidence: Math.max(0, Math.min(100, prediction.confidence || 50)),
      scorePrediction: prediction.scorePrediction || "1-1",
      aiReasoning: prediction.aiReasoning || "Analysis based on current form and historical data",
      keyInsight: prediction.keyInsight || "Balanced matchup between two competitive teams",
      bettingAngle: prediction.bettingAngle || `${homeTeam} Match Winner`,
      odds: prediction.odds || { home: 2.5, draw: 3.2, away: 2.8 },
      probability: prediction.probability || { home: 33, draw: 34, away: 33 },
      isValuePick: prediction.isValuePick || false,
      riskLevel: prediction.riskLevel || "MEDIUM",
      modelEdge: prediction.modelEdge || 0,
      systemRecord: prediction.systemRecord || "5-5 L10"
    };

    // Log prediction to prediction_history table for backtesting
    if (matchId) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Get match details for logging
        const { data: matchData } = await supabase
          .from('matches')
          .select('kickoff_time, league')
          .eq('id', matchId)
          .single();

        const predictionRecord = {
          match_id: matchId,
          home_team: homeTeam,
          away_team: awayTeam,
          league: league,
          predicted_outcome: validatedPrediction.outcome,
          confidence: validatedPrediction.confidence,
          predicted_score: validatedPrediction.scorePrediction,
          ai_reasoning: validatedPrediction.aiReasoning,
          key_insight: validatedPrediction.keyInsight,
          betting_angle: validatedPrediction.bettingAngle,
          odds: validatedPrediction.odds,
          probability: validatedPrediction.probability,
          is_value_pick: validatedPrediction.isValuePick,
          risk_level: validatedPrediction.riskLevel,
          model_edge: validatedPrediction.modelEdge,
          system_record: validatedPrediction.systemRecord,
          prompt_template: prompt,
          prompt_source: promptSource,
          ab_test_variant: abVariant,
          match_date: matchData?.kickoff_time,
          status: 'PENDING'
        };

        const { error: historyError } = await supabase
          .from('prediction_history')
          .insert(predictionRecord);

        if (historyError) {
          console.error('Error logging prediction to history:', historyError);
        } else {
          console.log(`✅ Prediction logged for ${homeTeam} vs ${awayTeam}`);
        }
      } catch (logError) {
        console.error('Error in prediction logging:', logError);
        // Don't fail the whole request if logging fails
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        matchId: matchId,
        prediction: validatedPrediction,
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
    console.error("Error in generate-predictions:", error);

    // Check if it's a quota/rate limit error
    const isQuotaError = error.message.includes('429') ||
                        error.message.includes('quota') ||
                        error.message.includes('rate limit') ||
                        error.message.includes('RESOURCE_EXHAUSTED');

    if (isQuotaError) {
      console.log("⚠️ Gemini API quota exhausted, falling back to basic prediction");

      // Generate a basic fallback prediction using available data
      const fallbackPrediction = await generateFallbackPrediction(homeTeam, awayTeam, league, matchId);

      return new Response(
        JSON.stringify({
          status: "success",
          matchId: matchId,
          prediction: fallbackPrediction,
          timestamp: new Date().toISOString(),
          fallback: true,
          reason: "API quota exhausted"
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

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