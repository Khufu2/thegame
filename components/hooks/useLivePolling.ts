import { useState, useEffect, useCallback, useRef } from 'react';

interface LiveMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  timeline: any[];
  stats: any;
  lineups: any;
  lastPolled: string;
}

interface UseLivePollingOptions {
  matchId: string;
  enabled?: boolean;
  intervalMs?: number;
  onUpdate?: (data: LiveMatchData) => void;
}

const SUPABASE_URL = "https://ebfhyyznuzxwhirwlcds.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA";

export function useLivePolling({
  matchId,
  enabled = true,
  intervalMs = 30000, // Poll every 30 seconds by default
  onUpdate
}: UseLivePollingOptions) {
  const [data, setData] = useState<LiveMatchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLiveData = useCallback(async () => {
    if (!matchId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/fetch-live-scores?matchId=${matchId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch live data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.match) {
        setData(result.match);
        setLastUpdate(new Date());
        
        if (onUpdate) {
          onUpdate(result.match);
        }
      }
    } catch (err) {
      console.error('Live polling error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [matchId, enabled, onUpdate]);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (!enabled || !matchId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchLiveData();

    // Set up interval
    intervalRef.current = setInterval(fetchLiveData, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, matchId, intervalMs, fetchLiveData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refresh
  };
}
