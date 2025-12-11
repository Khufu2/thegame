// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const THE_ODDS_API_KEY = Deno.env.get("THE_ODDS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sport keys for The Odds API
const SPORTS = [
  { key: "soccer_epl", name: "Premier League" },
  { key: "soccer_germany_bundesliga", name: "Bundesliga" },
  { key: "soccer_italy_serie_a", name: "Serie A" },
  { key: "soccer_spain_la_liga", name: "La Liga" },
  { key: "soccer_france_ligue_one", name: "Ligue 1" },
  { key: "soccer_uefa_champs_league", name: "Champions League" },
  { key: "soccer_uefa_europa_league", name: "Europa League" },
  { key: "basketball_nba", name: "NBA" },
];

interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number }[];
    }[];
  }[];
}

async function fetchOddsForSport(sportKey: string): Promise<OddsGame[]> {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${THE_ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
    
    console.log(`[TheOddsAPI] Fetching odds for ${sportKey}...`);
    const res = await fetch(url);
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`[TheOddsAPI] Error for ${sportKey}: ${res.status} - ${text}`);
      return [];
    }
    
    // Log remaining requests
    const remaining = res.headers.get("x-requests-remaining");
    const used = res.headers.get("x-requests-used");
    console.log(`[TheOddsAPI] Requests - Used: ${used}, Remaining: ${remaining}`);
    
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error(`[TheOddsAPI] Exception for ${sportKey}:`, error);
    return [];
  }
}

function normalizeTeamName(name: string): string {
  // Normalize team names for matching
  return name
    .toLowerCase()
    .replace(/fc\s*/gi, "")
    .replace(/\s*fc/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestOdds(bookmakers: OddsGame["bookmakers"]): { home: number; draw: number; away: number } | null {
  // Prefer certain bookmakers, fall back to first available
  const preferredBookmakers = ["pinnacle", "betfair_ex_eu", "unibet_eu", "williamhill"];
  
  for (const preferred of preferredBookmakers) {
    const bookmaker = bookmakers.find(b => b.key === preferred);
    if (bookmaker) {
      const h2hMarket = bookmaker.markets.find(m => m.key === "h2h");
      if (h2hMarket && h2hMarket.outcomes.length >= 2) {
        const homeOdds = h2hMarket.outcomes.find(o => o.name !== "Draw")?.price;
        const awayOdds = h2hMarket.outcomes.filter(o => o.name !== "Draw")[1]?.price;
        const drawOdds = h2hMarket.outcomes.find(o => o.name === "Draw")?.price;
        
        if (homeOdds && awayOdds) {
          return { home: homeOdds, draw: drawOdds || 0, away: awayOdds };
        }
      }
    }
  }
  
  // Fall back to first bookmaker with h2h market
  for (const bookmaker of bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === "h2h");
    if (h2hMarket && h2hMarket.outcomes.length >= 2) {
      // For soccer (3-way), find home, draw, away
      // For basketball (2-way), just home and away
      const outcomes = h2hMarket.outcomes;
      const drawOutcome = outcomes.find(o => o.name === "Draw");
      const nonDrawOutcomes = outcomes.filter(o => o.name !== "Draw");
      
      if (nonDrawOutcomes.length >= 2) {
        return {
          home: nonDrawOutcomes[0].price,
          draw: drawOutcome?.price || 0,
          away: nonDrawOutcomes[1].price,
        };
      }
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!THE_ODDS_API_KEY) {
      throw new Error("THE_ODDS_API_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    
    // Get URL params
    const url = new URL(req.url);
    const sportFilter = url.searchParams.get("sport"); // Optional: filter to specific sport
    
    const sportsToFetch = sportFilter 
      ? SPORTS.filter(s => s.key === sportFilter)
      : SPORTS;
    
    let totalUpdated = 0;
    let totalFetched = 0;
    
    for (const sport of sportsToFetch) {
      const games = await fetchOddsForSport(sport.key);
      totalFetched += games.length;
      console.log(`[TheOddsAPI] Found ${games.length} games for ${sport.name}`);
      
      for (const game of games) {
        const odds = findBestOdds(game.bookmakers);
        if (!odds) continue;
        
        // Try to match with existing matches in DB
        const homeNorm = normalizeTeamName(game.home_team);
        const awayNorm = normalizeTeamName(game.away_team);
        
        // Query matches that might match (use ILIKE for flexible matching)
        const { data: matches } = await supabase
          .from("matches")
          .select("id, home_team, away_team, odds_home")
          .or(`home_team.ilike.%${homeNorm.split(" ")[0]}%,away_team.ilike.%${awayNorm.split(" ")[0]}%`)
          .is("odds_home", null)
          .limit(50);
        
        if (!matches || matches.length === 0) continue;
        
        // Find best match
        for (const match of matches) {
          const dbHomeNorm = normalizeTeamName(match.home_team);
          const dbAwayNorm = normalizeTeamName(match.away_team);
          
          // Check if teams match (either exact or partial)
          const homeMatch = dbHomeNorm.includes(homeNorm.split(" ")[0]) || homeNorm.includes(dbHomeNorm.split(" ")[0]);
          const awayMatch = dbAwayNorm.includes(awayNorm.split(" ")[0]) || awayNorm.includes(dbAwayNorm.split(" ")[0]);
          
          if (homeMatch && awayMatch) {
            const { error } = await supabase
              .from("matches")
              .update({
                odds_home: odds.home,
                odds_draw: odds.draw || null,
                odds_away: odds.away,
                odds_source: "the-odds-api",
                updated_at: new Date().toISOString(),
              })
              .eq("id", match.id);
            
            if (!error) {
              console.log(`[TheOddsAPI] Updated odds for ${match.home_team} vs ${match.away_team}`);
              totalUpdated++;
            }
            break;
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched ${totalFetched} games, updated ${totalUpdated} matches with odds`,
        sports: sportsToFetch.map(s => s.name),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[TheOddsAPI] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
