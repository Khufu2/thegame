import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { Match } from '../types'

const SUPABASE_URL = "https://ebfhyyznuzxwhirwlcds.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA";
const backendBaseUrl = undefined; // Deprecated - using edge functions now

// Helper function to format match time
function formatMatchTime(startTime: string, status: string): string {
  if (status === 'finished') return 'FT';

  const now = new Date();
  const matchTime = new Date(startTime);

  if (status === 'live') {
    const diff = Math.floor((now.getTime() - matchTime.getTime()) / (1000 * 60));
    return `${diff}'`;
  }

  // For scheduled matches, return time like "15:00"
  return matchTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export interface Standing {
  id: string
  league_id: number
  standings_data: unknown[][]
  created_at: string
}

export interface Scorer {
  rank: number
  player_name: string
  goals: number
  league: string
}

/**
 * Hook to fetch live matches from edge functions
 * Data is automatically synced every 30 minutes via GitHub Actions
 */
export const useLiveMatches = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true)

        // Use edge function instead of direct table access
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/get-matches?status=live&limit=50`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setMatches(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching live matches:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()

    // For now, disable real-time updates since we're using edge functions
    // TODO: Implement real-time updates via edge functions if needed
  }, [])

  return { matches, loading, error }
}

/**
 * Hook to fetch upcoming matches for betting
 */
export const useUpcomingMatches = (daysAhead = 7, limit = 20) => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [oddsRefreshRequested, setOddsRefreshRequested] = useState(false)

  useEffect(() => {
    const fetchMatches = async (retry = false) => {
      try {
        setLoading(true)

        // Use edge function instead of direct table access
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/get-matches?status=scheduled&limit=${limit}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setMatches(data)
        setError(null)

        if (
          !retry &&
          backendBaseUrl &&
          !oddsRefreshRequested &&
          (data || []).some(match => !match.odds_home || !match.odds_away)
        ) {
          setOddsRefreshRequested(true)
          try {
            await fetch(`${backendBaseUrl}/api/odds/comparison?refresh=true&limit=${limit}`)
            setTimeout(() => fetchMatches(true), 1500)
          } catch (refreshErr) {
            console.error('Failed to refresh odds via backend', refreshErr)
          }
        } else if (retry) {
          setOddsRefreshRequested(false)
        }
      } catch (err) {
        console.error('Error fetching upcoming matches:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()

    // For now, disable real-time updates since we're using edge functions
    // TODO: Implement real-time updates via edge functions if needed
  }, [daysAhead, limit])

  return { matches, loading, error }
}

/**
 * Hook to fetch league standings
 */
export const useLeagueStandings = (leagueId: number) => {
  const [standings, setStandings] = useState<Standing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true)
        const { data, error: err } = await supabase
          .from('standings')
          .select('*')
          .eq('league_id', leagueId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (err && err.code !== 'PGRST116') throw err // PGRST116 = no rows
        setStandings(data || null)
        setError(null)
      } catch (err) {
        console.error('Error fetching standings:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()

    const channel = supabase
      .channel('standings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'standings' },
        () => fetchStandings()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leagueId])

  return { standings, loading, error }
}

/**
 * Hook to fetch top scorers by league
 */
export const useTopScorers = (league?: string) => {
  const [scorers, setScorers] = useState<Scorer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchScorers = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from('feeds')
          .select('content')
          .eq('type', 'stats')
          .eq('source', 'API-Football')

        if (league) {
          query = query.ilike('title', `%${league}%`)
        }

        const { data, error: err } = await query
          .order('created_at', { ascending: false })
          .limit(10)

        if (err) throw err

        // Parse JSON content
        const parsed: Scorer[] = []
        data?.forEach((feed) => {
          try {
            const scorerList = JSON.parse(feed.content)
            parsed.push(...scorerList)
          } catch (e) {
            console.error('Error parsing scorer data:', e)
          }
        })

        setScorers(parsed)
        setError(null)
      } catch (err) {
        console.error('Error fetching top scorers:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchScorers()

    const channel = supabase
      .channel('feeds-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feeds' },
        () => fetchScorers()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [league])

  return { scorers, loading, error }
}

/**
 * Hook to manually trigger edge functions
 * Useful for immediate updates without waiting for schedule
 */
export const useTriggerSync = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const triggerMatchesSync = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/fetch-matches-footballdata`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const triggerStandingsSync = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/fetch-standings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const triggerScorersSync = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/fetch-scorers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    triggerMatchesSync,
    triggerStandingsSync,
    triggerScorersSync,
    loading,
    error,
  }
}
