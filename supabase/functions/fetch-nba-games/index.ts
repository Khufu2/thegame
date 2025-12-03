import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface NBAGame {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string;
  intAwayScore?: string;
  dateEvent: string;
  strTime: string;
  strStatus: string;
  strLeague: string;
  idLeague: string;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchNBAGames(date?: string) {
  try {
    // TheSportsDB NBA endpoint (free, no rate limits)
    const targetDate = date || new Date().toISOString().split('T')[0];
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${targetDate}&s=NBA`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`NBA API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("Error fetching NBA games:", error);
    return [];
  }
}

async function saveNBAGames(games: NBAGame[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const game of games) {
    const kickoffTime = `${game.dateEvent}T${game.strTime || '00:00:00'}Z`;

    const status =
      game.strStatus === "Match Finished" ? "finished" :
      game.strStatus === "Not Started" ? "scheduled" :
      "live";

    const homeScore = game.intHomeScore ? parseInt(game.intHomeScore) : null;
    const awayScore = game.intAwayScore ? parseInt(game.intAwayScore) : null;

    const { error } = await supabase
      .from("matches")
      .upsert(
        {
          id: `nba-${game.idEvent}`,
          sport: 'basketball',
          event_type: 'match',
          home_team: game.strHomeTeam,
          away_team: game.strAwayTeam,
          kickoff_time: kickoffTime,
          status,
          home_team_score: homeScore,
          away_team_score: awayScore,
          league: 'NBA',
          season: new Date().getFullYear().toString(),
          fixture_id: game.idEvent,
          // Initialize with null logos - will be updated by fetchAndUpdateLogos
          home_team_json: {
            name: game.strHomeTeam,
            logo: null
          },
          away_team_json: {
            name: game.strAwayTeam,
            logo: null
          }
        },
        { onConflict: "id" }
      );

    if (error) console.error(`Error saving NBA game ${game.idEvent}:`, error);
  }
}

// Fetch and update team logos from TheSportsDB
async function fetchAndUpdateLogos(games: NBAGame[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Collect unique team names
  const teamNames = new Set<string>();
  for (const game of games) {
    teamNames.add(game.strHomeTeam);
    teamNames.add(game.strAwayTeam);
  }

  // Fetch logos for each team
  const logoPromises = Array.from(teamNames).map(async (teamName) => {
    try {
      const logo = await fetchTeamLogo(teamName);
      return { teamName, logo };
    } catch (error) {
      console.error(`Error fetching logo for ${teamName}:`, error);
      return { teamName, logo: null };
    }
  });

  const logoResults = await Promise.all(logoPromises);
  const logoMap = new Map(logoResults.map(r => [r.teamName, r.logo]));

  // Update games with logos
  for (const game of games) {
    try {
      const homeLogo = logoMap.get(game.strHomeTeam);
      const awayLogo = logoMap.get(game.strAwayTeam);

      if (homeLogo || awayLogo) {
        const updateData: any = {};

        if (homeLogo) {
          updateData.home_team_json = {
            name: game.strHomeTeam,
            logo: homeLogo
          };
        }

        if (awayLogo) {
          updateData.away_team_json = {
            name: game.strAwayTeam,
            logo: awayLogo
          };
        }

        const { error } = await supabase
          .from("matches")
          .update(updateData)
          .eq("id", `nba-${game.idEvent}`);

        if (error) {
          console.error(`Error updating logos for NBA game ${game.idEvent}:`, error);
        } else {
          console.log(`Updated logos for NBA game ${game.idEvent}`);
        }
      }
    } catch (error) {
      console.error(`Error updating logos for NBA game ${game.idEvent}:`, error);
    }
  }
}

// Fetch team logo from TheSportsDB
async function fetchTeamLogo(teamName: string): Promise<string | null> {
  try {
    console.log(`[logos] Searching NBA logo for: "${teamName}"`);

    const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}&s=NBA`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.warn(`[logos] Search failed for "${teamName}": ${response.status}`);
      return null;
    }

    const data = await response.json();
    const teams = data.teams;

    if (!teams || teams.length === 0) {
      console.warn(`[logos] No NBA teams found for "${teamName}"`);
      return null;
    }

    console.log(`[logos] Found ${teams.length} NBA teams for "${teamName}"`);

    // Find best match
    let bestMatch = teams[0];

    // Exact name match
    const exactMatch = teams.find((t: any) =>
      t.strTeam?.toLowerCase() === teamName.toLowerCase()
    );
    if (exactMatch) bestMatch = exactMatch;

    // Alternative name match
    if (!exactMatch) {
      const altMatch = teams.find((t: any) =>
        t.strTeamShort?.toLowerCase() === teamName.toLowerCase() ||
        t.strAlternate?.toLowerCase().includes(teamName.toLowerCase())
      );
      if (altMatch) bestMatch = altMatch;
    }

    const logoUrl = bestMatch.strTeamBadge || bestMatch.strTeamLogo;

    if (logoUrl) {
      console.log(`[logos] ✅ Found NBA logo for "${teamName}": ${logoUrl}`);
      return logoUrl;
    } else {
      console.warn(`[logos] ❌ No logo found for "${teamName}" (best match: ${bestMatch.strTeam})`);
      return null;
    }

  } catch (error) {
    console.error(`[logos] Error fetching NBA logo for "${teamName}":`, error);
    return null;
  }
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

    console.log("🏀 Fetching NBA games from TheSportsDB...");

    // Fetch today's games
    const todayGames = await fetchNBAGames();
    console.log(`✅ Found ${todayGames.length} NBA games today`);

    // Fetch tomorrow's games
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowGames = await fetchNBAGames(tomorrowStr);
    console.log(`✅ Found ${tomorrowGames.length} NBA games tomorrow`);

    const allGames = [...todayGames, ...tomorrowGames];

    if (allGames.length > 0) {
      console.log(`💾 Saving ${allGames.length} NBA games to database...`);
      await saveNBAGames(allGames);
      console.log("✅ NBA games saved successfully");

      // Fetch logos for the teams in these games
      console.log("🖼️  Fetching NBA team logos from TheSportsDB...");
      await fetchAndUpdateLogos(allGames);
      console.log("✅ NBA logos updated");
    }

    return new Response(
      JSON.stringify({
        status: "success",
        todayCount: todayGames.length,
        tomorrowCount: tomorrowGames.length,
        totalCount: allGames.length,
        timestamp: new Date().toISOString(),
        provider: "thesportsdb",
        sport: "basketball"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-nba-games:", error);
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

function assertEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`[env] Missing: ${missing.join(', ')}`);
    return { ok: false, missing } as const;
  }
  console.log(`[env] OK. NBA fetch ready`);
  return { ok: true } as const;
}