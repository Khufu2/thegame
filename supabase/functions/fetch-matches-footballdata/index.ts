// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FOOTBALL_DATA_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const LEAGUE_IDS = (Deno.env.get('LEAGUE_IDS') || 'PL,BL1').trim(); // Conservative default: Premier League, Bundesliga only
const SEASON = (Deno.env.get('SEASON') || '').trim(); // e.g. "2024"

function assertEnv() {
  const missing: string[] = [];
  if (!FOOTBALL_DATA_API_KEY) missing.push('FOOTBALL_DATA_API_KEY');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`[env] Missing: ${missing.join(', ')}`);
    return { ok: false, missing } as const;
  }
  console.log(`[env] OK. keyLen=${(FOOTBALL_DATA_API_KEY || '').length}, leagues="${LEAGUE_IDS}", season="${SEASON}"`);
  return { ok: true } as const;
}

interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  stage?: string;
  homeTeam: { id: number; name: string; shortName?: string; tla?: string };
  awayTeam: { id: number; name: string; shortName?: string; tla?: string };
  score: {
    home?: number | null;
    away?: number | null;
    fullTime?: { home?: number | null; away?: number | null };
    halfTime?: { home?: number | null; away?: number | null };
  };
  competition: {
    id: number;
    name: string;
    code: string;
  };
  season: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday?: number;
  };
}

// Rate limiter: Football-Data.org free tier is 10 requests per minute
let reqCount = 0;
let windowStart = Date.now();

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitedFetch(url: string, label?: string) {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    reqCount = 0;
    windowStart = now;
  }

  // More conservative: 6 requests per minute instead of 10
  if (reqCount >= 6) {
    const wait = 60_000 - (now - windowStart) + 1000; // 1 second buffer
    console.log(`[rateLimit] Waiting ${wait}ms before calling ${label}`);
    await sleep(wait);
    reqCount = 0;
    windowStart = Date.now();
  }

  reqCount++;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Auth-Token': FOOTBALL_DATA_API_KEY || '',
      'Accept': 'application/json'
    },
  });

  // Handle rate limiting response
  if (res.status === 429) {
    const body = await res.text();
    console.warn(`[rateLimit:${label}] 429 received, body="${body}"`);

    // Extract wait time from response if available
    const waitMatch = body.match(/Wait (\d+) seconds/);
    const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : 5; // Default 5 seconds

    console.log(`[rateLimit] API says wait ${waitSeconds} seconds, complying...`);
    await sleep(waitSeconds * 1000);

    // Retry once after waiting
    console.log(`[rateLimit] Retrying ${label}...`);
    const retryRes = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_API_KEY || '',
        'Accept': 'application/json'
      },
    });

    if (retryRes.ok) {
      console.log(`[rateLimit] Retry successful for ${label}`);
      return retryRes;
    }

    console.warn(`[rateLimit] Retry failed for ${label}, status=${retryRes.status}`);
    return retryRes;
  }

  if (!res.ok) {
    const body = await res.text();
    console.warn(`[fetch:${label}] status=${res.status}, body="${body.slice(0,180)}"`);
  }

  return res;
}

async function fetchLiveMatches() {
  try {
    const res = await rateLimitedFetch(`https://api.football-data.org/v4/matches?status=LIVE`, 'live-matches');

    if (!res.ok) return [];

    const data = await res.json();
    return data.matches || [];
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}

// Fetch recently finished matches (last 3 days)
async function fetchFinishedMatches() {
  try {
    const leagues = LEAGUE_IDS
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (leagues.length === 0) return [];

    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const dateFrom = threeDaysAgo.toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];

    console.log(`[finished] Fetching finished matches from ${dateFrom} to ${dateTo}`);

    let allMatches: any[] = [];
    
    for (const leagueCode of leagues) {
      const url = `https://api.football-data.org/v4/competitions/${leagueCode}/matches?status=FINISHED&dateFrom=${dateFrom}&dateTo=${dateTo}`;
      const res = await rateLimitedFetch(url, `finished-${leagueCode}`);

      if (!res.ok) continue;

      const data = await res.json();
      const matches = data.matches || [];
      console.log(`[finished ${leagueCode}] Found ${matches.length} finished matches`);
      allMatches.push(...matches);
    }

    return allMatches;
  } catch (error) {
    console.error('Error fetching finished matches:', error);
    return [];
  }
}

async function fetchUpcomingMatches() {
  try {
    const leagues = LEAGUE_IDS
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (leagues.length === 0) {
      console.log('[upcoming] No leagues configured');
      return [];
    }

    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = sevenDaysLater.toISOString().split('T')[0];

    console.log(`[upcoming] Fetching from ${dateFrom} to ${dateTo}, leagues: ${leagues.join(', ')}`);

    let allMatches: any[] = [];
    
    for (const leagueCode of leagues) {
      // Fetch SCHEDULED and TIMED matches
      const url = `https://api.football-data.org/v4/competitions/${leagueCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      const res = await rateLimitedFetch(url, `upcoming-${leagueCode}`);

      if (!res.ok) continue;

      const data = await res.json();
      const matches = (data.matches || []).filter((m: any) => 
        m.status === 'SCHEDULED' || m.status === 'TIMED'
      );
      console.log(`[upcoming ${leagueCode}] Found ${matches.length} scheduled matches`);
      allMatches.push(...matches);
    }

    // De-duplicate by match id
    const uniqueMatches = new Map<number, any>();
    for (const match of allMatches) {
      if (typeof match.id === 'number' && !uniqueMatches.has(match.id)) {
        uniqueMatches.set(match.id, match);
      }
    }

    return Array.from(uniqueMatches.values());

  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return [];
  }
}

async function saveMatches(matches: Match[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const match of matches) {
    const status =
      match.status === "IN_PLAY" ? "live" :
      match.status === "PAUSED" ? "live" :
      match.status === "FINISHED" ? "finished" :
      "scheduled";

    const hasScore = match.score.fullTime?.home !== null && match.score.fullTime?.home !== undefined &&
                     match.score.fullTime?.away !== null && match.score.fullTime?.away !== undefined;

    const homeScore = hasScore ? match.score.fullTime!.home : match.score.home;
    const awayScore = hasScore ? match.score.fullTime!.away : match.score.away;

    const result = hasScore && status === "finished"
      ? (homeScore! > awayScore! ? "home_win" : awayScore! > homeScore! ? "away_win" : "draw")
      : null;

    const { error } = await supabase
      .from("matches")
      .upsert(
        {
          id: `football-data-${match.id}`,
          league_id: null, // TODO: Map to league uuid
          // Old fields for backward compatibility
          home_team: match.homeTeam.name,
          away_team: match.awayTeam.name,
          kickoff_time: match.utcDate,
          status,
          home_team_score: homeScore,
          away_team_score: awayScore,
          result: status === "finished" ? result : null,
          league: match.competition.name,
          season: match.season.startDate ? new Date(match.season.startDate).getFullYear() : null,
          round: match.matchday ? `Matchday ${match.matchday}` : null,
          fixture_id: match.id,
          home_team_id: match.homeTeam.id,
          away_team_id: match.awayTeam.id,
          // New jsonb fields
          home_team_json: {
            name: match.homeTeam.name,
            id: match.homeTeam.id,
            logo: null // Football-Data.org doesn't provide logos in basic plan
          },
          away_team_json: {
            name: match.awayTeam.name,
            id: match.awayTeam.id,
            logo: null
          },
          score: {
            home: homeScore,
            away: awayScore
          },
          venue: null, // Not provided in matches endpoint
          venue_details: null,
          metadata: {
            fixture_id: match.id,
            league: match.competition.name,
            league_code: match.competition.code,
            season: match.season.startDate ? new Date(match.season.startDate).getFullYear() : null,
            round: match.matchday ? `Matchday ${match.matchday}` : null,
            result: status === "finished" ? result : null
          }
        },
        { onConflict: "id" }
      );

    if (error) console.error(`Error saving match ${match.id}:`, error);
  }
}

// Fetch and update team logos from TheSportsDB
async function fetchAndUpdateLogos(matches: Match[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Collect unique team names
  const teamNames = new Set<string>();
  for (const match of matches) {
    teamNames.add(match.homeTeam.name);
    teamNames.add(match.awayTeam.name);
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

  // Update matches with logos
  for (const match of matches) {
    try {
      const homeLogo = logoMap.get(match.homeTeam.name);
      const awayLogo = logoMap.get(match.awayTeam.name);

      if (homeLogo || awayLogo) {
        const updateData: any = {};

        if (homeLogo) {
          updateData.home_team_json = {
            name: match.homeTeam.name,
            id: match.homeTeam.id,
            logo: homeLogo
          };
        }

        if (awayLogo) {
          updateData.away_team_json = {
            name: match.awayTeam.name,
            id: match.awayTeam.id,
            logo: awayLogo
          };
        }

        const { error } = await supabase
          .from("matches")
          .update(updateData)
          .eq("id", `football-data-${match.id}`);

        if (error) {
          console.error(`Error updating logos for match ${match.id}:`, error);
        } else {
          console.log(`Updated logos for match ${match.id}`);
        }
      }
    } catch (error) {
      console.error(`Error updating logos for match ${match.id}:`, error);
    }
  }
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

    console.log("🔴 Fetching LIVE matches from Football-Data.org...");
    const liveMatches = await fetchLiveMatches();
    console.log(`✅ Found ${liveMatches.length} live matches`);

    console.log("✅ Fetching FINISHED matches from Football-Data.org...");
    const finishedMatches = await fetchFinishedMatches();
    console.log(`✅ Found ${finishedMatches.length} finished matches`);

    console.log("📅 Fetching UPCOMING matches from Football-Data.org...");
    const upcomingMatches = await fetchUpcomingMatches();
    console.log(`✅ Found ${upcomingMatches.length} upcoming matches`);

    const allMatches = [...liveMatches, ...finishedMatches, ...upcomingMatches];

    if (allMatches.length > 0) {
      console.log(`💾 Saving ${allMatches.length} matches to database...`);
      await saveMatches(allMatches);
      console.log("✅ Matches saved successfully");

      // Fetch logos for the teams in these matches (limit to avoid rate limits)
      console.log("🖼️  Fetching team logos from TheSportsDB...");
      try {
        await fetchAndUpdateLogos(allMatches.slice(0, 20)); // Limit logo fetching
        console.log("✅ Logos updated successfully");
      } catch (logoError) {
        console.error("❌ Logo fetching failed:", logoError);
        console.log("ℹ️  Matches saved without logos - can be updated later");
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        liveCount: liveMatches.length,
        upcomingCount: upcomingMatches.length,
        timestamp: new Date().toISOString(),
        provider: "football-data"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-matches-footballdata:", error);
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