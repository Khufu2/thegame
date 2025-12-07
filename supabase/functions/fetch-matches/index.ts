// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");
const API_FOOTBALL_PROVIDER = (Deno.env.get("API_FOOTBALL_PROVIDER") || 'apisports').toLowerCase(); // 'apisports' | 'rapidapi'
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const LEAGUE_IDS = (Deno.env.get('LEAGUE_IDS') || '').trim(); // e.g. "39,140,135"
const SEASON = (Deno.env.get('SEASON') || '').trim(); // e.g. "2024"

function assertEnv() {
  const missing: string[] = [];
  if (!API_FOOTBALL_KEY) missing.push('API_FOOTBALL_KEY');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`[env] Missing: ${missing.join(', ')}`);
    return { ok: false, missing } as const;
  }
  console.log(`[env] OK. provider=${API_FOOTBALL_PROVIDER}, keyLen=${(API_FOOTBALL_KEY || '').length}, keyLast4=${(API_FOOTBALL_KEY || 'NULL').slice(-4)}, url set=${!!SUPABASE_URL}, leagues="${LEAGUE_IDS}", season="${SEASON}"`);
  return { ok: true } as const;
}

interface Match {
  id: string;
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
    };
    venue?: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
  teams: {
    home: { id: number; name: string; logo: string | null };
    away: { id: number; name: string; logo: string | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

// Rate limiter and resilient fetch with exponential backoff to avoid 403/429
let reqCount = 0;
let windowStart = Date.now();

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitedFetch(opts: { url: string; label?: string; maxPerMinute?: number; retries?: number }) {
  const label = opts.label || 'api-football';
  const limit = opts.maxPerMinute ?? 6; // conservative per minute
  const maxRetries = opts.retries ?? 4;

  const now = Date.now();
  if (now - windowStart > 60_000) {
    reqCount = 0;
    windowStart = now;
  }

  if (reqCount >= limit) {
    const wait = 60_000 - (now - windowStart) + 200; // small buffer
    console.log(`[rateLimit] Waiting ${wait}ms before calling ${label}`);
    await sleep(wait);
    reqCount = 0;
    windowStart = Date.now();
  }

  let attempt = 0;
  // jittered exponential backoff
  while (attempt <= maxRetries) {
    reqCount++;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (API_FOOTBALL_PROVIDER === 'rapidapi') {
      headers['X-RapidAPI-Key'] = API_FOOTBALL_KEY || '';
      headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com';
    } else {
      headers['x-apisports-key'] = API_FOOTBALL_KEY || '';
    }

    const res = await fetch(opts.url, {
      method: 'GET',
      headers,
    });

    if (res.ok) return res;

    const status = res.status;
    const retryAfter = res.headers.get('retry-after');
    const base = Math.min(1000 * Math.pow(2, attempt), 15_000); // up to 15s
    const jitter = Math.floor(Math.random() * 400);
    const waitMs = retryAfter ? Number(retryAfter) * 1000 : base + jitter;
    let bodyText = '';
    try { bodyText = await res.text(); } catch {}
    const remain = res.headers.get('x-ratelimit-requests-remaining') ?? res.headers.get('x-ratelimit-remaining');
    const reset = res.headers.get('x-ratelimit-requests-reset') ?? res.headers.get('x-ratelimit-reset');
    console.warn(`[fetch:${label}] status=${status}, attempt=${attempt}/${maxRetries}, remaining=${remain}, reset=${reset}, waiting ${waitMs}ms, body="${(bodyText||'').slice(0,180)}"`);

    // For 401/403: often invalid key or plan limit; still retry a couple times with backoff
    if (status === 429 || status === 403 || status >= 500) {
      attempt++;
      if (attempt > maxRetries) return res; // give up, caller handles
      await sleep(waitMs);
      continue;
    }

    // Other 4xx: return immediately
    return res;
  }
  // Should not reach here
  return new Response(null, { status: 500 });
}

async function fetchLiveMatches() {
  try {
    const base = API_FOOTBALL_PROVIDER === 'rapidapi'
      ? 'https://api-football-v1.p.rapidapi.com/v3'
      : 'https://v3.football.api-sports.io';
    const res = await rateLimitedFetch({
      url: `${base}/fixtures?live=all&timezone=UTC`,
      label: 'fixtures-live'
    });

    if (!res.ok) {
      let txt = ''; try { txt = await res.text(); } catch {}
      console.warn(`[live] non-200: ${res.status} body="${(txt||'').slice(0,180)}"`);
      return [];
    }

    const data = await res.json();
    const resp = data.response || [];
    if ((resp?.length || 0) === 0) {
      console.log(`[diag:live] results=${data.results}, errors=${JSON.stringify(data.errors||{})}, paging=${JSON.stringify(data.paging||{})}`);
    }
    return resp;
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}

async function fetchUpcomingMatches() {
  try {
    const base = API_FOOTBALL_PROVIDER === 'rapidapi'
      ? 'https://api-football-v1.p.rapidapi.com/v3'
      : 'https://v3.football.api-sports.io';

    const leagues = LEAGUE_IDS
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => Number(s))
      .filter(n => !Number.isNaN(n));

    if (leagues.length === 0 || !SEASON) {
      console.log('[diag:upcoming] Skipping league fetch: LEAGUE_IDS or SEASON env vars are not set.');
      return [];
    }

    const datesToFetch = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      datesToFetch.push(date.toISOString().split('T')[0]);
    }

    console.log(`[upcoming] Fetching for dates: ${datesToFetch.join(', ')}`);

    let allMatches: any[] = [];
    for (const date of datesToFetch) {
      for (const leagueId of leagues) {
        const url = `${base}/fixtures?league=${leagueId}&season=${SEASON}&date=${date}&timezone=UTC`;
        const res = await rateLimitedFetch({ url, label: `fixtures-lg-${leagueId}-date-${date}` });

        if (!res.ok) {
          let txt = ''; try { txt = await res.text(); } catch {}
          console.warn(`[league ${leagueId} date ${date}] non-200: ${res.status} body="${(txt||'').slice(0,180)}"`);
          continue;
        }

        const data = await res.json();
        const list = data.response || [];
        console.log(`[league ${leagueId}] date=${date} count=${list.length}, results=${data.results}`);
        allMatches.push(...list);
      }
    }

    // De-duplicate by fixture.id to ensure unique matches
    const uniqueMatches = new Map<number, any>();
    for (const match of allMatches) {
      const fixtureId = match?.fixture?.id;
      if (typeof fixtureId === 'number' && !uniqueMatches.has(fixtureId)) {
        uniqueMatches.set(fixtureId, match);
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
      match.fixture.status.short === "NS"
        ? "scheduled"
        : match.fixture.status.short === "1H" ||
            match.fixture.status.short === "2H" ||
            match.fixture.status.short === "ET"
          ? "live"
          : "finished";

    const hasScore =
      match.goals.home !== null &&
      match.goals.home !== undefined &&
      match.goals.away !== null &&
      match.goals.away !== undefined;
    const result = hasScore
      ? match.goals.home > match.goals.away
        ? "home_win"
        : match.goals.away > match.goals.home
          ? "away_win"
          : "draw"
      : null;

    const { error } = await supabase
      .from("matches")
      .upsert(
        {
          id: `match-${match.fixture.id}`,
          fixture_id: match.fixture.id,
          home_team: match.teams.home.name,
          home_team_id: match.teams.home.id,
          home_team_logo: match.teams.home.logo,
          away_team: match.teams.away.name,
          away_team_id: match.teams.away.id,
          away_team_logo: match.teams.away.logo,
          kickoff_time: new Date(match.fixture.date).toISOString(),
          status,
          home_team_score: match.goals.home,
          away_team_score: match.goals.away,
          result: status === "finished" ? result : null,
          league: match.league.name,
          league_id: match.league.id,
          season: match.fixture.date ? new Date(match.fixture.date).getFullYear() : null,
          round: match.league?.round || null,
          venue_id: match.fixture.venue?.id || null,
          venue_name: match.fixture.venue?.name || null,
          venue_city: match.fixture.venue?.city || null,
          venue_country: match.league.country,
          odds_home: match.odds?.home ?? null,
          odds_draw: match.odds?.draw ?? null,
          odds_away: match.odds?.away ?? null,
        },
        { onConflict: "id" }
      );

    if (error) console.error(`Error saving match ${match.fixture.id}:`, error);
  }
}

Deno.serve(async (req) => {
  // CORS headers
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

    const url = new URL(req.url);
    const debug = url.searchParams.get('debug') === '1';

    if (debug) {
      // Minimal probe that uses very few quota units
      const base = API_FOOTBALL_PROVIDER === 'rapidapi' 
        ? 'https://api-football-v1.p.rapidapi.com/v3' 
        : 'https://v3.football.api-sports.io';
      const probe = await rateLimitedFetch({ url: `${base}/fixtures?next=1`, label: 'probe', retries: 1 });
      const headers = {
        status: probe.status,
        remaining: probe.headers.get('x-ratelimit-requests-remaining') ?? probe.headers.get('x-ratelimit-remaining'),
        reset: probe.headers.get('x-ratelimit-requests-reset') ?? probe.headers.get('x-ratelimit-reset'),
      };
      let bodyLen = 0; let sample = '';
      try { const t = await probe.text(); bodyLen = t.length; sample = t.slice(0, 200); } catch {}
      return new Response(JSON.stringify({ ok: probe.ok, headers, bodyLen, bodySample: sample }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    console.log("🔴 Fetching LIVE matches...");
    const liveMatches = await fetchLiveMatches();
    console.log(`✅ Found ${liveMatches.length} live matches`);

    console.log("📅 Fetching UPCOMING matches (league-scoped if configured)...");
    const upcomingMatches = await fetchUpcomingMatches();
    console.log(`✅ Found ${upcomingMatches.length} upcoming matches`);

    const allMatches = [...liveMatches, ...upcomingMatches];

    if (allMatches.length > 0) {
      console.log(`💾 Saving ${allMatches.length} matches to database...`);
      await saveMatches(allMatches);
      console.log("✅ Matches saved successfully");
    }

    return new Response(
      JSON.stringify({
        status: "success",
        liveCount: liveMatches.length,
        upcomingCount: upcomingMatches.length,
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
    console.error("Error in fetch-matches:", error);
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
