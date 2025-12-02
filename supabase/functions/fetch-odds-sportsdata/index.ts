import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SPORTSDATA_API_KEY = Deno.env.get("SPORTSDATA_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ODDS_SEASON = Deno.env.get("ODDS_SEASON") || "2024";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    if (!SPORTSDATA_API_KEY) {
      throw new Error("SPORTSDATA_API_KEY environment variable not set");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // 1. Find upcoming matches that need odds
    const { data: matches, error: queryError } = await supabase
      .from("matches")
      .select("id, fixture_id, home_team, away_team")
      .eq("status", "scheduled")
      .is("odds_home", null)
      .order("kickoff_time", { ascending: true })
      .limit(20);

    if (queryError) throw new Error(`Supabase query failed: ${queryError.message}`);
    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming matches found needing odds." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${matches.length} matches to fetch odds for.`);

    // 2. Fetch odds from SportsData.io
    const baseUrl = "https://api.sportsdata.io/v2/json";
    const oddsUrl = `${baseUrl}/PreGameOddsBySeason/${ODDS_SEASON}`;

    const oddsRes = await fetch(oddsUrl, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": SPORTSDATA_API_KEY,
        "Accept": "application/json"
      },
    });

    if (!oddsRes.ok) {
      const errorText = await oddsRes.text();
      throw new Error(`SportsData.io API error: ${oddsRes.status} - ${errorText}`);
    }

    const oddsData = await oddsRes.json();
    console.log(`Fetched ${oddsData.length} odds entries from SportsData.io`);

    let updatedCount = 0;

    // 3. Match odds to our fixtures
    for (const match of matches) {
      // Try to find matching odds by team names (fuzzy matching)
      const relevantOdds = oddsData.filter((odds: any) => {
        const homeMatch = odds.HomeTeamName?.toLowerCase().includes(match.home_team.toLowerCase()) ||
                         match.home_team.toLowerCase().includes(odds.HomeTeamName?.toLowerCase());
        const awayMatch = odds.AwayTeamName?.toLowerCase().includes(match.away_team.toLowerCase()) ||
                         match.away_team.toLowerCase().includes(odds.AwayTeamName?.toLowerCase());
        return homeMatch && awayMatch && odds.SportsbookName === "Bet365"; // Focus on reliable bookmaker
      });

      if (relevantOdds.length === 0) {
        console.log(`No odds found for ${match.home_team} vs ${match.away_team}`);
        continue;
      }

      // Use the first matching odds
      const odds = relevantOdds[0];

      // Extract odds (SportsData.io uses different format)
      const homeOdds = odds.HomeMoneyLine || odds.HomePointSpreadPayout;
      const awayOdds = odds.AwayMoneyLine || odds.AwayPointSpreadPayout;
      const drawOdds = odds.DrawMoneyLine;

      if (homeOdds && awayOdds) {
        const { error: updateError } = await supabase
          .from("matches")
          .update({
            odds_home: parseFloat(homeOdds),
            odds_away: parseFloat(awayOdds),
            odds_draw: drawOdds ? parseFloat(drawOdds) : null,
          })
          .eq("id", match.id);

        if (updateError) {
          console.error(`Failed to update odds for match ${match.id}:`, updateError.message);
        } else {
          console.log(`Successfully updated odds for ${match.home_team} vs ${match.away_team}`);
          updatedCount++;
        }
      }
    }

    return new Response(JSON.stringify({
      message: `Odds fetch complete. Updated ${updatedCount} matches.`,
      provider: "sportsdata"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-odds-sportsdata function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});