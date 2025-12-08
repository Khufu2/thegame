// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing environment variables" }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get all matches - we'll filter in code since jsonb queries can be tricky
    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select("id, home_team, away_team, home_team_json, away_team_json")
      .limit(100);

    if (fetchError) {
      console.error("Error fetching matches:", fetchError);
      throw fetchError;
    }

    // Filter matches that need logos
    const matchesNeedingLogos = matches?.filter(m => {
      const homeLogo = m.home_team_json?.logo;
      const awayLogo = m.away_team_json?.logo;
      return !homeLogo || !awayLogo;
    }) || [];

    if (matchesNeedingLogos.length === 0) {
      return new Response(
        JSON.stringify({ message: "All matches have logos" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    console.log(`Found ${matchesNeedingLogos.length} matches needing logos`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const match of matchesNeedingLogos) {
      try {
        let homeJson = match.home_team_json || { id: "", name: match.home_team };
        let awayJson = match.away_team_json || { id: "", name: match.away_team };

        // Fetch home logo if missing
        if (!homeJson.logo) {
          const homeLogo = await fetchTeamLogo(match.home_team);
          if (homeLogo) {
            homeJson = { ...homeJson, logo: homeLogo };
          }
        }

        // Fetch away logo if missing
        if (!awayJson.logo) {
          const awayLogo = await fetchTeamLogo(match.away_team);
          if (awayLogo) {
            awayJson = { ...awayJson, logo: awayLogo };
          }
        }

        // Update if we got any logos
        if (homeJson.logo || awayJson.logo) {
          const { error } = await supabase
            .from("matches")
            .update({
              home_team_json: homeJson,
              away_team_json: awayJson
            })
            .eq("id", match.id);

          if (!error) {
            updatedCount++;
            console.log(`Updated logos for: ${match.home_team} vs ${match.away_team}`);
          } else {
            errors.push(`${match.id}: ${error.message}`);
          }
        }

        // Rate limit - TheSportsDB free tier
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err) {
        console.error(`Error processing match ${match.id}:`, err);
        errors.push(`${match.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Updated ${updatedCount}/${matchesNeedingLogos.length} matches with logos`,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );

  } catch (error) {
    console.error("Error in fetch-team-logos:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
});

// Fetch team logo from TheSportsDB (free API)
async function fetchTeamLogo(teamName: string): Promise<string | null> {
  try {
    // Clean team name for better matching
    const cleanName = teamName
      .replace(/ FC$/, "")
      .replace(/ CF$/, "")
      .replace(/^FC /, "")
      .trim();

    const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(cleanName)}`;
    console.log(`Searching logo for: ${cleanName}`);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.warn(`TheSportsDB returned ${response.status} for ${cleanName}`);
      return null;
    }

    const data = await response.json();
    const teams = data.teams;

    if (!teams || teams.length === 0) {
      console.warn(`No team found for: ${cleanName}`);
      return null;
    }

    // Find best match
    const team = teams.find((t: any) =>
      t.strTeam?.toLowerCase().includes(cleanName.toLowerCase()) ||
      cleanName.toLowerCase().includes(t.strTeam?.toLowerCase())
    ) || teams[0];

    const logo = team.strBadge || team.strTeamBadge || team.strTeamLogo;
    if (logo) {
      console.log(`Found logo for ${cleanName}: ${logo.substring(0, 50)}...`);
    }
    return logo || null;

  } catch (error) {
    console.error(`Error fetching logo for ${teamName}:`, error);
    return null;
  }
}