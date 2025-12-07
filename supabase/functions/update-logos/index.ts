// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function assertEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`[env] Missing: ${missing.join(', ')}`);
    return { ok: false, missing } as const;
  }
  console.log(`[env] OK. Logo update ready`);
  return { ok: true } as const;
}

// Fetch team logo from TheSportsDB
async function fetchTeamLogo(teamName: string): Promise<string | null> {
  try {
    console.log(`[logos] Searching logo for: "${teamName}"`);

    const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.warn(`[logos] Search failed for "${teamName}": ${response.status}`);
      return null;
    }

    const data = await response.json();
    const teams = data.teams;

    if (!teams || teams.length === 0) {
      console.warn(`[logos] No teams found for "${teamName}"`);
      return null;
    }

    console.log(`[logos] Found ${teams.length} teams for "${teamName}"`);

    // Find best match - try multiple strategies
    let bestMatch = teams[0]; // Default to first result

    // Exact name match
    const exactMatch = teams.find((t: any) =>
      t.strTeam?.toLowerCase() === teamName.toLowerCase()
    );
    if (exactMatch) bestMatch = exactMatch;

    // Short name match
    if (!exactMatch) {
      const shortMatch = teams.find((t: any) =>
        t.strTeamShort?.toLowerCase() === teamName.toLowerCase()
      );
      if (shortMatch) bestMatch = shortMatch;
    }

    // Contains match
    if (!exactMatch) {
      const containsMatch = teams.find((t: any) =>
        t.strTeam?.toLowerCase().includes(teamName.toLowerCase()) ||
        teamName.toLowerCase().includes(t.strTeam?.toLowerCase())
      );
      if (containsMatch) bestMatch = containsMatch;
    }

    const logoUrl = bestMatch.strTeamBadge || bestMatch.strTeamLogo;

    if (logoUrl) {
      console.log(`[logos] ✅ Found logo for "${teamName}": ${logoUrl}`);
      return logoUrl;
    } else {
      console.warn(`[logos] ❌ No logo found for "${teamName}" (best match: ${bestMatch.strTeam})`);
      return null;
    }

  } catch (error) {
    console.error(`[logos] Error fetching logo for "${teamName}":`, error);
    return null;
  }
}

// Update logos for existing matches
async function updateExistingLogos() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get matches that don't have logos yet
  const { data: matches, error: fetchError } = await supabase
    .from("matches")
    .select("id, home_team, away_team, home_team_json, away_team_json")
    .or("home_team_json->>logo.is.null,away_team_json->>logo.is.null")
    .limit(50); // Process in batches

  if (fetchError) {
    console.error("Error fetching matches for logo update:", fetchError);
    return { error: fetchError.message };
  }

  if (!matches || matches.length === 0) {
    console.log("ℹ️  No matches found that need logo updates");
    return { updated: 0, message: "No matches need logo updates" };
  }

  console.log(`📋 Found ${matches.length} matches to update logos for`);

  let updatedCount = 0;

  for (const match of matches) {
    try {
      const homeTeam = match.home_team;
      const awayTeam = match.away_team;

      // Fetch logos
      const homeLogo = homeTeam ? await fetchTeamLogo(homeTeam) : null;
      const awayLogo = awayTeam ? await fetchTeamLogo(awayTeam) : null;

      // Prepare update data
      const updateData: any = {};

      if (homeLogo) {
        updateData.home_team_json = {
          name: homeTeam,
          logo: homeLogo
        };
      }

      if (awayLogo) {
        updateData.away_team_json = {
          name: awayTeam,
          logo: awayLogo
        };
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("matches")
          .update(updateData)
          .eq("id", match.id);

        if (updateError) {
          console.error(`❌ Error updating logos for match ${match.id}:`, updateError);
        } else {
          console.log(`✅ Updated logos for match ${match.id}`);
          updatedCount++;
        }
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`❌ Error processing match ${match.id}:`, error);
    }
  }

  return {
    updated: updatedCount,
    total: matches.length,
    message: `Updated logos for ${updatedCount} out of ${matches.length} matches`
  };
}

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
    const envOk = assertEnv();
    if (!envOk.ok) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables', missing: envOk.missing }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log("🖼️  Starting logo update process...");

    const result = await updateExistingLogos();

    return new Response(
      JSON.stringify({
        status: "success",
        ...result,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in update-logos:", error);
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