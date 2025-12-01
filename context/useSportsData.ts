import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;

export interface Match {
  id: string
  home_team: string
  away_team: string
  kickoff_time: string
  status: 'scheduled' | 'live' | 'finished'
  home_team_score: number | null
  away_team_score: number | null
  result: 'home_win' | 'draw' | 'away_win' | null
  league: string
  season: number
  round: string
  venue: string
  odds_home: number
  odds_draw: number
  odds_away: number
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
        const { data, error: err } = await supabase
          .from('matches')
          .select('*')
          .eq('status', 'live')
          .order('kickoff_time', { ascending: true })

        if (err) throw err
        setMatches(data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching live matches:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()

    // Subscribe to real-time updates
    const subscription = supabase
      .from('matches')
      .on('*', () => {
        fetchMatches()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
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
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + daysAhead)

        const { data, error: err } = await supabase
          .from('matches')
          .select('*')
          .eq('status', 'scheduled')
          .gte('kickoff_time', new Date().toISOString())
          .lte('kickoff_time', futureDate.toISOString())
          .order('kickoff_time', { ascending: true })
          .limit(limit)

        if (err) throw err
        setMatches(data || [])
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

    const subscription = supabase
      .from('matches')
      .on('*', () => {
        fetchMatches()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
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

    const subscription = supabase
      .from('standings')
      .on('*', () => {
        fetchStandings()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
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

    const subscription = supabase
      .from('feeds')
      .on('*', () => {
        fetchScorers()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-matches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-standings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-scorers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
