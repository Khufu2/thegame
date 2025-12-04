import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing environment variables" }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get matches that need logos (check both old and new data structures)
    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select("id, home_team, away_team, home_team_logo, away_team_logo, home_team_json, away_team_json")
      .or("home_team_logo.is.null,away_team_logo.is.null,home_team_json->>logo.is.null,away_team_json->>logo.is.null")
      .limit(50);

    if (fetchError) {
      console.error("Error fetching matches:", fetchError);
      throw fetchError;
    }

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({ message: "No matches found needing logos" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    console.log(`Found ${matches.length} matches to update with logos`);

    let updatedCount = 0;

    for (const match of matches) {
      try {
        const updates: any = {};

        // Update home team logo - check both data structures
        const needsHomeLogo = !match.home_team_logo && (!match.home_team_json || !match.home_team_json.logo);
        if (needsHomeLogo) {
          const homeLogo = await fetchTeamLogo(match.home_team);
          if (homeLogo) {
            // Update both fields for compatibility
            updates.home_team_logo = homeLogo;
            if (match.home_team_json) {
              updates.home_team_json = { ...match.home_team_json, logo: homeLogo };
            }
          }
        }

        // Update away team logo - check both data structures
        const needsAwayLogo = !match.away_team_logo && (!match.away_team_json || !match.away_team_json.logo);
        if (needsAwayLogo) {
          const awayLogo = await fetchTeamLogo(match.away_team);
          if (awayLogo) {
            // Update both fields for compatibility
            updates.away_team_logo = awayLogo;
            if (match.away_team_json) {
              updates.away_team_json = { ...match.away_team_json, logo: awayLogo };
            }
          }
        }

        // Only update if we have changes
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("matches")
            .update(updates)
            .eq("id", match.id);

          if (!error) {
            updatedCount++;
          } else {
            console.error(`Error updating logos for match ${match.id}:`, error);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        console.error(`Error updating logos for match ${match.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Logo fetch complete. Updated ${updatedCount} team logos.`,
        matchesProcessed: matches.length
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

// Fetch team logo from TheSportsDB
async function fetchTeamLogo(teamName: string): Promise<string | null> {
  try {
    // Search for team by name
    const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const teams = searchData.teams;

    if (!teams || teams.length === 0) return null;

    // Find the best match (exact name match preferred)
    const team = teams.find((t: any) =>
      t.strTeam.toLowerCase() === teamName.toLowerCase() ||
      t.strTeamShort?.toLowerCase() === teamName.toLowerCase()
    ) || teams[0];

    return team.strTeamBadge || team.strTeamLogo || null;

  } catch (error) {
    console.error(`Error fetching logo for ${teamName}:`, error);
    return null;
  }
}