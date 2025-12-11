// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive league data - no API call needed, just seed the DB
const LEAGUES_DATA = [
  // Top Football Leagues
  { external_id: 39, code: "PL", name: "Premier League", country: "England", logo_url: "https://media.api-sports.io/football/leagues/39.png", sport: "football", season: "2024" },
  { external_id: 140, code: "PD", name: "La Liga", country: "Spain", logo_url: "https://media.api-sports.io/football/leagues/140.png", sport: "football", season: "2024" },
  { external_id: 78, code: "BL1", name: "Bundesliga", country: "Germany", logo_url: "https://media.api-sports.io/football/leagues/78.png", sport: "football", season: "2024" },
  { external_id: 135, code: "SA", name: "Serie A", country: "Italy", logo_url: "https://media.api-sports.io/football/leagues/135.png", sport: "football", season: "2024" },
  { external_id: 61, code: "FL1", name: "Ligue 1", country: "France", logo_url: "https://media.api-sports.io/football/leagues/61.png", sport: "football", season: "2024" },
  
  // UEFA Competitions
  { external_id: 2, code: "CL", name: "Champions League", country: "Europe", logo_url: "https://media.api-sports.io/football/leagues/2.png", sport: "football", season: "2024" },
  { external_id: 3, code: "EL", name: "Europa League", country: "Europe", logo_url: "https://media.api-sports.io/football/leagues/3.png", sport: "football", season: "2024" },
  { external_id: 848, code: "ECL", name: "Conference League", country: "Europe", logo_url: "https://media.api-sports.io/football/leagues/848.png", sport: "football", season: "2024" },
  
  // Other Top Leagues
  { external_id: 94, code: "PPL", name: "Primeira Liga", country: "Portugal", logo_url: "https://media.api-sports.io/football/leagues/94.png", sport: "football", season: "2024" },
  { external_id: 88, code: "ERE", name: "Eredivisie", country: "Netherlands", logo_url: "https://media.api-sports.io/football/leagues/88.png", sport: "football", season: "2024" },
  { external_id: 203, code: "SPL", name: "Super Lig", country: "Turkey", logo_url: "https://media.api-sports.io/football/leagues/203.png", sport: "football", season: "2024" },
  
  // English Lower Leagues
  { external_id: 40, code: "ELC", name: "Championship", country: "England", logo_url: "https://media.api-sports.io/football/leagues/40.png", sport: "football", season: "2024" },
  { external_id: 45, code: "FAC", name: "FA Cup", country: "England", logo_url: "https://media.api-sports.io/football/leagues/45.png", sport: "football", season: "2024" },
  { external_id: 48, code: "EFL", name: "EFL Cup", country: "England", logo_url: "https://media.api-sports.io/football/leagues/48.png", sport: "football", season: "2024" },
  
  // International
  { external_id: 4, code: "EC", name: "Euro Championship", country: "Europe", logo_url: "https://media.api-sports.io/football/leagues/4.png", sport: "football", season: "2024" },
  { external_id: 1, code: "WC", name: "World Cup", country: "World", logo_url: "https://media.api-sports.io/football/leagues/1.png", sport: "football", season: "2026" },
  
  // American Sports
  { external_id: 12, code: "NBA", name: "NBA", country: "USA", logo_url: "https://upload.wikimedia.org/wikipedia/en/0/03/National_Basketball_Association_logo.svg", sport: "basketball", season: "2024" },
  { external_id: 1, code: "NFL", name: "NFL", country: "USA", logo_url: "https://upload.wikimedia.org/wikipedia/en/a/a2/National_Football_League_logo.svg", sport: "american-football", season: "2024" },
  { external_id: 1, code: "MLB", name: "MLB", country: "USA", logo_url: "https://upload.wikimedia.org/wikipedia/en/a/a6/Major_League_Baseball_logo.svg", sport: "baseball", season: "2025" },
  { external_id: 1, code: "NHL", name: "NHL", country: "USA", logo_url: "https://upload.wikimedia.org/wikipedia/en/3/3a/05_NHL_Shield.svg", sport: "hockey", season: "2024" },
  
  // MMA/Combat Sports
  { external_id: 1, code: "UFC", name: "UFC", country: "USA", logo_url: "https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg", sport: "mma", season: "2024" },
  
  // Motorsport
  { external_id: 1, code: "F1", name: "Formula 1", country: "World", logo_url: "https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg", sport: "formula1", season: "2024" },
  { external_id: 1, code: "MOTOGP", name: "MotoGP", country: "World", logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Moto_Gp_logo.svg", sport: "motogp", season: "2024" },
  
  // African Football
  { external_id: 12, code: "AFCON", name: "Africa Cup of Nations", country: "Africa", logo_url: "https://upload.wikimedia.org/wikipedia/en/9/92/Africa_Cup_of_Nations_logo.svg", sport: "football", season: "2025" },
  { external_id: 551, code: "KPL", name: "Kenya Premier League", country: "Kenya", logo_url: "https://upload.wikimedia.org/wikipedia/en/4/4c/Kenyan_Premier_League_logo.png", sport: "football", season: "2024" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    
    console.log(`[PopulateLeagues] Inserting ${LEAGUES_DATA.length} leagues...`);
    
    // Upsert leagues - update if exists based on code
    const { data, error } = await supabase
      .from("leagues")
      .upsert(
        LEAGUES_DATA.map(league => ({
          ...league,
          created_at: new Date().toISOString(),
        })),
        { onConflict: "code", ignoreDuplicates: false }
      )
      .select();
    
    if (error) {
      // If code conflict doesn't work, try inserting individually
      console.log("[PopulateLeagues] Bulk upsert failed, trying individual inserts...");
      
      let inserted = 0;
      let updated = 0;
      
      for (const league of LEAGUES_DATA) {
        // Check if exists
        const { data: existing } = await supabase
          .from("leagues")
          .select("id")
          .eq("code", league.code)
          .maybeSingle();
        
        if (existing) {
          // Update
          const { error: updateError } = await supabase
            .from("leagues")
            .update({
              name: league.name,
              country: league.country,
              logo_url: league.logo_url,
              external_id: league.external_id,
              sport: league.sport,
              season: league.season,
            })
            .eq("id", existing.id);
          
          if (!updateError) updated++;
        } else {
          // Insert
          const { error: insertError } = await supabase
            .from("leagues")
            .insert(league);
          
          if (!insertError) inserted++;
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Inserted ${inserted} new leagues, updated ${updated} existing`,
          total: LEAGUES_DATA.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully populated ${data?.length || LEAGUES_DATA.length} leagues`,
        leagues: data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PopulateLeagues] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
