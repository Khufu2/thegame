// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface Match {
  id: string;
  // Old fields (for backward compatibility)
  home_team?: string;
  away_team?: string;
  kickoff_time?: string;
  home_team_score?: number;
  away_team_score?: number;
  league?: string;
  season?: number;
  round?: string;
  fixture_id?: number;
  home_team_id?: number;
  away_team_id?: number;
  // New jsonb fields
  home_team_json?: any;
  away_team_json?: any;
  score?: any;
  venue?: string | null;
  venue_details?: any;
  metadata?: any;
  status: string;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Validate env early
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: missing environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // 'live', 'scheduled', etc.
    let limit = parseInt(url.searchParams.get("limit") || "50", 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    const MAX_LIMIT = 200;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    let query: any = supabase
      .from("matches")
      .select("*")
      .order("kickoff_time", { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    if (!Array.isArray(data)) {
      console.warn("Supabase returned non-array data for matches:", data);
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Transform to frontend format (defensive)
    const transformedMatches = data.map((match: Partial<Match> & { odds_home?: number; odds_draw?: number; odds_away?: number }) => {
      // Use kickoff_time (from database schema) or fallback to empty string
      const start_time = match.kickoff_time ?? "";
      const statusVal = match.status ?? "scheduled";
      const scoreObj = match.score ?? undefined;

      // Prefer new jsonb fields, fallback to direct logo fields, then old string fields
      const homeTeamData = match.home_team_json || {
        id: (match.home_team_id ?? "").toString(),
        name: match.home_team ?? "Unknown",
        logo: (match as any).home_team_logo ?? ""
      };

      const awayTeamData = match.away_team_json || {
        id: (match.away_team_id ?? "").toString(),
        name: match.away_team ?? "Unknown",
        logo: (match as any).away_team_logo ?? ""
      };

      // Build odds object from database columns
      const odds = (match.odds_home || match.odds_draw || match.odds_away) ? {
        home: match.odds_home ?? 2.0,
        draw: match.odds_draw ?? 3.5,
        away: match.odds_away ?? 2.5
      } : undefined;

      // Generate prediction based on odds (lower odds = higher confidence)
      let prediction = undefined;
      if (odds && statusVal === "scheduled") {
        const minOdds = Math.min(odds.home, odds.draw, odds.away);
        const outcome = odds.home === minOdds ? 'HOME' : (odds.away === minOdds ? 'AWAY' : 'DRAW');
        const confidence = Math.min(95, Math.max(50, Math.round(100 - (minOdds * 15))));
        prediction = {
          outcome,
          confidence,
          odds
        };
      }

      return {
        id: match.id ?? "",
        league: match.league ?? match.metadata?.league ?? "Unknown League",
        homeTeam: {
          id: homeTeamData.id?.toString() ?? "",
          name: homeTeamData.name ?? "Unknown",
          logo: homeTeamData.logo ?? ""
        },
        awayTeam: {
          id: awayTeamData.id?.toString() ?? "",
          name: awayTeamData.name ?? "Unknown",
          logo: awayTeamData.logo ?? ""
        },
        status: statusVal === "live" ? "LIVE" : statusVal === "finished" ? "FINISHED" : "SCHEDULED",
        time: formatMatchTime(start_time, statusVal),
        score: statusVal === "scheduled" ? undefined :
               scoreObj ? { home: scoreObj.home ?? 0, away: scoreObj.away ?? 0 } :
               (match.home_team_score !== undefined && match.away_team_score !== undefined) ?
               { home: match.home_team_score, away: match.away_team_score } : undefined,
        venue: match.venue ?? undefined,
        prediction,
        odds
      };
    });

    return new Response(JSON.stringify(transformedMatches), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    // Log stack if available
    console.error("Error in get-matches:", err?.stack ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

// Helper function to format match time with timezone support
function formatMatchTime(startTime: string, status: string): string {
  if (status === "finished") return "FT";
  const now = new Date();
  const matchTime = new Date(startTime);
  if (isNaN(matchTime.getTime())) return "";

  if (status === "live") {
    const diff = Math.floor((now.getTime() - matchTime.getTime()) / (1000 * 60));
    return `${diff}'`;
  }

  // Use UTC time (frontend will handle timezone conversion)
  // This allows dynamic timezone handling based on user's browser location
  const userTime = matchTime; // Keep as UTC, let frontend convert

  return userTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}