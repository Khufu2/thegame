// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");

interface TeamStats {
  team_id: number;
  team_name: string;
  league_id: number;
  league_name: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { home: number; away: number; total: number };
    against: { home: number; away: number; total: number };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
  biggest: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
    goals: { for: { home: number; away: number }; against: { home: number; away: number } };
  };
  form: string;
}

async function fetchTeamStats(teamId: number, leagueId: number): Promise<TeamStats | null> {
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&league=${leagueId}&season=2024`,
      {
        headers: {
          'x-apisports-key': API_FOOTBALL_KEY!
        }
      }
    );

    if (!response.ok) {
      console.error(`API Football error for team ${teamId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error(`Error fetching stats for team ${teamId}:`, error);
    return null;
  }
}

async function fetchPlayerStats(teamId: number, leagueId: number): Promise<any[]> {
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/players?team=${teamId}&league=${leagueId}&season=2024`,
      {
        headers: {
          'x-apisports-key': API_FOOTBALL_KEY!
        }
      }
    );

    if (!response.ok) {
      console.error(`API Football error for players team ${teamId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error(`Error fetching players for team ${teamId}:`, error);
    return [];
  }
}

async function updateTeamStats(teamName: string, teamId: string, league: string, stats: TeamStats) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const teamData = {
      team_name: teamName,
      team_id: teamId,
      league: league,
      season: '2024',
      matches_played: stats.fixtures.played.total,
      wins: stats.fixtures.wins.total,
      draws: stats.fixtures.draws.total,
      losses: stats.fixtures.loses.total,
      goals_for: stats.goals.for.total,
      goals_against: stats.goals.against.total,
      goal_difference: stats.goals.for.total - stats.goals.against.total,
      points: (stats.fixtures.wins.total * 3) + stats.fixtures.draws.total,
      win_percentage: stats.fixtures.played.total > 0 ? (stats.fixtures.wins.total / stats.fixtures.played.total * 100) : 0,
      average_goals_scored: stats.fixtures.played.total > 0 ? (stats.goals.for.total / stats.fixtures.played.total) : 0,
      average_goals_conceded: stats.fixtures.played.total > 0 ? (stats.goals.against.total / stats.fixtures.played.total) : 0,
      clean_sheets: stats.clean_sheet.total,
      failed_to_score: stats.failed_to_score.total,
      home_wins: stats.fixtures.wins.home,
      home_draws: stats.fixtures.draws.home,
      home_losses: stats.fixtures.loses.home,
      home_goals_for: stats.goals.for.home,
      home_goals_against: stats.goals.against.home,
      away_wins: stats.fixtures.wins.away,
      away_draws: stats.fixtures.draws.away,
      away_losses: stats.fixtures.loses.away,
      away_goals_for: stats.goals.for.away,
      away_goals_against: stats.goals.against.away,
      recent_form: stats.form,
      elo_rating: 1500.00, // Default, can be updated separately
      last_updated: new Date().toISOString(),
      data_source: 'api-football'
    };

    const { error } = await supabase
      .from('team_stats')
      .upsert(teamData, { onConflict: 'team_name,league,season' });

    if (error) {
      console.error(`Error updating team stats for ${teamName}:`, error);
    } else {
      console.log(`✅ Updated stats for ${teamName}`);
    }
  } catch (error) {
    console.error(`Error in updateTeamStats for ${teamName}:`, error);
  }
}

async function updatePlayerStats(teamName: string, teamId: string, league: string, players: any[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    for (const playerData of players.slice(0, 25)) { // Limit to top 25 players per team
      const player = playerData.player;
      const stats = playerData.statistics?.[0];

      if (!stats) continue;

      const playerRecord = {
        player_name: player.name,
        player_id: player.id.toString(),
        team_name: teamName,
        team_id: teamId,
        league: league,
        season: '2024',
        position: stats.games?.position || 'Unknown',
        age: player.age || null,
        nationality: player.nationality || null,
        matches_played: stats.games?.appearences || 0,
        minutes_played: stats.games?.minutes || 0,
        goals: stats.goals?.total || 0,
        assists: stats.goals?.assists || 0,
        yellow_cards: stats.cards?.yellow || 0,
        red_cards: stats.cards?.red || 0,
        shots_on_target: stats.shots?.on || 0,
        shots_total: stats.shots?.total || 0,
        passes_completed: stats.passes?.accuracy ? Math.round((stats.passes.accuracy / 100) * (stats.passes.total || 0)) : 0,
        passes_attempted: stats.passes?.total || 0,
        tackles_won: stats.tackles?.total || 0,
        interceptions: stats.tackles?.interceptions || 0,
        clearances: stats.tackles?.blocks || 0,
        dribbles_completed: stats.dribbles?.success || 0,
        dribbles_attempted: stats.dribbles?.attempts || 0,
        saves: stats.goals?.saves || 0,
        clean_sheets: stats.goals?.conceded ? (stats.games?.appearences - stats.goals.conceded > 0 ? 1 : 0) : 0,
        goals_conceded: stats.goals?.conceded || 0,
        injury_status: 'available', // Default, can be updated with injury data
        average_rating: stats.games?.rating ? parseFloat(stats.games.rating.replace(',', '.')) : 0,
        last_updated: new Date().toISOString(),
        data_source: 'api-football'
      };

      // Calculate derived stats
      playerRecord.goals_per_90 = playerRecord.matches_played > 0 ? (playerRecord.goals / playerRecord.matches_played) * 90 : 0;
      playerRecord.assists_per_90 = playerRecord.matches_played > 0 ? (playerRecord.assists / playerRecord.matches_played) * 90 : 0;
      playerRecord.shots_on_target_percentage = playerRecord.shots_total > 0 ? (playerRecord.shots_on_target / playerRecord.shots_total) * 100 : 0;
      playerRecord.pass_accuracy = playerRecord.passes_attempted > 0 ? (playerRecord.passes_completed / playerRecord.passes_attempted) * 100 : 0;
      playerRecord.dribble_success_rate = playerRecord.dribbles_attempted > 0 ? (playerRecord.dribbles_completed / playerRecord.dribbles_attempted) * 100 : 0;

      const { error } = await supabase
        .from('player_stats')
        .upsert(playerRecord, { onConflict: 'player_name,team_name,season' });

      if (error) {
        console.error(`Error updating player stats for ${player.name}:`, error);
      }
    }

    console.log(`✅ Updated player stats for ${teamName}`);
  } catch (error) {
    console.error(`Error in updatePlayerStats for ${teamName}:`, error);
  }
}

async function getTeamsToUpdate(): Promise<Array<{name: string, id: string, league: string}>> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get teams from recent matches that need stats updated
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('home_team, away_team, league')
      .gte('kickoff_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .limit(50);

    const teams = new Map();

    recentMatches?.forEach(match => {
      // Map common team names to API Football IDs (this would need to be expanded)
      const teamMappings: {[key: string]: {id: string, league: string}} = {
        'Manchester City': { id: '50', league: 'Premier League' },
        'Arsenal': { id: '42', league: 'Premier League' },
        'Liverpool': { id: '40', league: 'Premier League' },
        'Chelsea': { id: '49', league: 'Premier League' },
        'Manchester United': { id: '33', league: 'Premier League' },
        'Tottenham': { id: '47', league: 'Premier League' },
        // Add more mappings as needed
      };

      [match.home_team, match.away_team].forEach(teamName => {
        if (teamMappings[teamName] && !teams.has(teamName)) {
          teams.set(teamName, {
            name: teamName,
            id: teamMappings[teamName].id,
            league: teamMappings[teamName].league
          });
        }
      });
    });

    return Array.from(teams.values());
  } catch (error) {
    console.error('Error getting teams to update:', error);
    return [];
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
    console.log('🚀 Starting team stats collection...');

    if (!API_FOOTBALL_KEY) {
      throw new Error("API_FOOTBALL_KEY environment variable not set");
    }

    const teamsToUpdate = await getTeamsToUpdate();
    console.log(`📋 Found ${teamsToUpdate.length} teams to update`);

    for (const team of teamsToUpdate) {
      console.log(`📊 Processing ${team.name}...`);

      // Fetch team statistics
      const teamStats = await fetchTeamStats(parseInt(team.id), 39); // Premier League ID
      if (teamStats) {
        await updateTeamStats(team.name, team.id, team.league, teamStats);
      }

      // Fetch player statistics
      const playerStats = await fetchPlayerStats(parseInt(team.id), 39);
      if (playerStats.length > 0) {
        await updatePlayerStats(team.name, team.id, team.league, playerStats);
      }

      // Rate limiting - wait 1 second between teams
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Team stats collection completed');

    return new Response(
      JSON.stringify({
        status: "success",
        teamsUpdated: teamsToUpdate.length,
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
    console.error("Error in collect-team-stats:", error);
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