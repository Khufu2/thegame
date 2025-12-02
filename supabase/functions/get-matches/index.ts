import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface Match {
  id: string;
  league_id: string | null;
  home_team_json: any;
  away_team_json: any;
  start_time: string;
  status: string;
  score: any;
  venue: string | null;
  venue_details: any;
  metadata: any;
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
      .order("start_time", { ascending: true })
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
    const transformedMatches = data.map((match: Partial<Match>) => {
      const start_time = match.start_time ?? "";
      const statusVal = match.status ?? "scheduled";
      const scoreObj = match.score ?? undefined;

      return {
        id: match.id ?? "",
        league: match.metadata?.league ?? "Unknown League",
        homeTeam: match.home_team_json
          ? {
              id: (match.home_team_json.id ?? "").toString(),
              name: match.home_team_json.name ?? "Unknown",
              logo: match.home_team_json.logo ?? ""
            }
          : { id: "", name: "Unknown", logo: "" },
        awayTeam: match.away_team_json
          ? {
              id: (match.away_team_json.id ?? "").toString(),
              name: match.away_team_json.name ?? "Unknown",
              logo: match.away_team_json.logo ?? ""
            }
          : { id: "", name: "Unknown", logo: "" },
        status: statusVal === "live" ? "LIVE" : statusVal === "finished" ? "FINISHED" : "SCHEDULED",
        time: formatMatchTime(start_time, statusVal),
        score: scoreObj ? { home: scoreObj.home ?? 0, away: scoreObj.away ?? 0 } : undefined,
        venue: match.venue ?? undefined
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

// Helper function to format match time
function formatMatchTime(startTime: string, status: string): string {
  if (status === "finished") return "FT";
  const now = new Date();
  const matchTime = new Date(startTime);
  if (isNaN(matchTime.getTime())) return "";

  if (status === "live") {
    const diff = Math.floor((now.getTime() - matchTime.getTime()) / (1000 * 60));
    return `${diff}'`;
  }

  return matchTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}