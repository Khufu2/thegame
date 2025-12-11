import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../src/integrations/supabase/client';

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  crest?: string;
  logo: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  score?: {
    fullTime?: { home: number | null; away: number | null };
    halfTime?: { home: number | null; away: number | null };
  };
  status: string;
  utcDate: string;
  kickoff_time?: string;
  league?: string;
  venue?: string;
  prediction?: {
    winner: string;
    confidence: number;
    predictedScore?: { home: number; away: number };
    reasoning?: string;
    insights?: string[];
    bettingAngles?: string[];
    odds?: { home: number; draw: number; away: number };
  };
  home_team_score?: number | null;
  away_team_score?: number | null;
  timeline?: unknown[];
  lineups?: unknown;
  stats?: unknown;
}

export interface FeedItem {
  id: string;
  type: 'match' | 'prediction' | 'news' | 'alert' | 'value_bet' | 'featured' | 'result';
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  timestamp: string;
  match?: Match;
  data?: unknown;
  priority?: number;
}

export interface League {
  id: string;
  name: string;
  code: string;
  logo?: string;
  country?: string;
}

export interface User {
  id: string;
  preferences: {
    favoriteLeagues: string[];
    favoriteTeams: string[];
    followedSources?: string[];
    dataSaver?: boolean;
  };
}

interface BetSlipItem {
  matchId: string;
  selection: string;
  odds: number;
}

interface SportsContextType {
  matches: Match[];
  feed: FeedItem[];
  leagues: League[];
  loading: boolean;
  error: string | null;
  user: User | null;
  betSlip: BetSlipItem[];
  refreshMatches: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  getMatchById: (id: string) => Match | undefined;
  addComment: (matchId: string, comment: string) => void;
  logout: () => void;
}

const SportsContext = createContext<SportsContextType | undefined>(undefined);

const DEFAULT_LEAGUES: League[] = [
  { id: 'PL', name: 'Premier League', code: 'PL', country: 'England', logo: 'https://crests.football-data.org/PL.png' },
  { id: 'PD', name: 'La Liga', code: 'PD', country: 'Spain', logo: 'https://crests.football-data.org/PD.png' },
  { id: 'SA', name: 'Serie A', code: 'SA', country: 'Italy', logo: 'https://crests.football-data.org/SA.png' },
  { id: 'BL1', name: 'Bundesliga', code: 'BL1', country: 'Germany', logo: 'https://crests.football-data.org/BL1.png' },
  { id: 'FL1', name: 'Ligue 1', code: 'FL1', country: 'France', logo: 'https://crests.football-data.org/FL1.png' },
  { id: 'CL', name: 'Champions League', code: 'CL', country: 'Europe', logo: 'https://crests.football-data.org/CL.png' },
];

export function SportsProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [leagues] = useState<League[]>(DEFAULT_LEAGUES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [user, setUser] = useState<User | null>({
    id: 'guest',
    preferences: {
      favoriteLeagues: ['PL', 'LaLiga', 'SA', 'BL1'],
      favoriteTeams: [],
      followedSources: [],
      dataSaver: false
    }
  });

  const addComment = useCallback((matchId: string, comment: string) => {
    console.log('Adding comment to match:', matchId, comment);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-matches', {
        body: {}
      });

      if (fnError) {
        console.error('Error fetching matches:', fnError);
        throw fnError;
      }

      const fetchedMatches = data?.matches || [];
      console.log('Fetched matches:', fetchedMatches.length);
      setMatches(fetchedMatches);
      return fetchedMatches;
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      return [];
    }
  }, []);

  const buildFeed = useCallback((matchesList: Match[]) => {
    const feedItems: FeedItem[] = [];
    const now = new Date();
    
    const sortedMatches = [...matchesList].sort((a, b) => {
      const dateA = new Date(a.utcDate || a.kickoff_time || '');
      const dateB = new Date(b.utcDate || b.kickoff_time || '');
      return dateA.getTime() - dateB.getTime();
    });

    const upcomingMatches = sortedMatches.filter(m => {
      const matchDate = new Date(m.utcDate || m.kickoff_time || '');
      return m.status === 'SCHEDULED' && matchDate > now;
    });

    const liveMatches = sortedMatches.filter(m => m.status === 'LIVE' || m.status === 'IN_PLAY');
    const finishedMatches = sortedMatches.filter(m => m.status === 'FINISHED').slice(-10);

    // 1. LIVE matches - highest priority
    liveMatches.forEach((match, idx) => {
      feedItems.push({
        id: `live-${match.id}`,
        type: 'match',
        title: `🔴 LIVE: ${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`,
        subtitle: `${match.score?.fullTime?.home ?? 0} - ${match.score?.fullTime?.away ?? 0}`,
        timestamp: match.utcDate || match.kickoff_time || now.toISOString(),
        match,
        priority: 100 + idx
      });
    });

    // 2. FEATURED matches - top games with high confidence predictions
    const featuredMatches = upcomingMatches
      .filter(m => m.prediction && m.prediction.confidence >= 55)
      .slice(0, 6);

    featuredMatches.forEach((match, idx) => {
      feedItems.push({
        id: `featured-${match.id}`,
        type: 'featured',
        title: `⭐ ${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`,
        subtitle: match.prediction ? `${match.prediction.winner} (${match.prediction.confidence}% confidence)` : 'Top match',
        content: match.prediction?.reasoning,
        timestamp: match.utcDate || match.kickoff_time || now.toISOString(),
        match,
        priority: 95 - idx
      });
    });

    // 3. VALUE RADAR - betting angles
    const valueBets = upcomingMatches
      .filter(m => m.prediction?.bettingAngles && m.prediction.bettingAngles.length > 0)
      .slice(0, 5);

    valueBets.forEach((match, idx) => {
      if (!featuredMatches.find(fm => fm.id === match.id)) {
        feedItems.push({
          id: `value-${match.id}`,
          type: 'value_bet',
          title: `💰 Value: ${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`,
          subtitle: match.prediction?.bettingAngles?.[0] || 'Good value found',
          content: match.prediction?.insights?.join('. '),
          timestamp: match.utcDate || match.kickoff_time || now.toISOString(),
          match,
          data: match.prediction?.odds,
          priority: 85 - idx
        });
      }
    });

    // 4. AI PREDICTIONS - other matches with predictions
    const predictionMatches = upcomingMatches
      .filter(m => m.prediction && !featuredMatches.find(fm => fm.id === m.id))
      .slice(0, 10);

    predictionMatches.forEach((match, idx) => {
      if (!featuredMatches.find(fm => fm.id === match.id) && !valueBets.find(vb => vb.id === match.id)) {
        feedItems.push({
          id: `prediction-${match.id}`,
          type: 'prediction',
          title: `🎯 ${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`,
          subtitle: `Prediction: ${match.prediction?.winner || 'TBD'} • ${match.prediction?.confidence || 50}%`,
          content: match.prediction?.reasoning,
          timestamp: match.utcDate || match.kickoff_time || now.toISOString(),
          match,
          priority: 75 - idx
        });
      }
    });

    // 5. UPCOMING MATCHES
    const remainingUpcoming = upcomingMatches.slice(0, 8);
    remainingUpcoming.forEach((match, idx) => {
      const alreadyAdded = feedItems.some(item => item.match?.id === match.id);
      if (!alreadyAdded) {
        feedItems.push({
          id: `upcoming-${match.id}`,
          type: 'match',
          title: `📅 ${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`,
          subtitle: new Date(match.utcDate || match.kickoff_time || '').toLocaleString(),
          timestamp: match.utcDate || match.kickoff_time || now.toISOString(),
          match,
          priority: 65 - idx
        });
      }
    });

    // 6. RECENT RESULTS
    finishedMatches.slice(-6).forEach((match, idx) => {
      feedItems.push({
        id: `result-${match.id}`,
        type: 'result',
        title: `✅ ${match.homeTeam?.name || 'Home'} ${match.score?.fullTime?.home ?? match.home_team_score ?? 0} - ${match.score?.fullTime?.away ?? match.away_team_score ?? 0} ${match.awayTeam?.name || 'Away'}`,
        subtitle: 'Full Time',
        timestamp: match.utcDate || match.kickoff_time || now.toISOString(),
        match,
        priority: 55 - idx
      });
    });

    // 7. Always show some static cards if feed is short
    if (feedItems.length < 8) {
      feedItems.push({
        id: 'welcome-card',
        type: 'news',
        title: '⚽ Welcome to ScoreShot',
        subtitle: 'AI-powered sports predictions',
        content: 'Get real-time scores, AI predictions, and betting insights for top football leagues.',
        timestamp: now.toISOString(),
        priority: 45
      });

      feedItems.push({
        id: 'leagues-info',
        type: 'news',
        title: '🏆 Leagues We Cover',
        subtitle: 'Premier League • La Liga • Serie A • Bundesliga • Ligue 1 • UCL',
        content: 'Follow the best football leagues in the world with AI-powered analysis.',
        timestamp: now.toISOString(),
        priority: 44
      });

      feedItems.push({
        id: 'predictions-info',
        type: 'news',
        title: '🎯 How Our Predictions Work',
        subtitle: 'Team ratings • Form analysis • Home advantage',
        content: 'Our AI uses team strength ratings, historical performance, and statistical models.',
        timestamp: now.toISOString(),
        priority: 43
      });

      feedItems.push({
        id: 'value-info',
        type: 'news',
        title: '💰 Value Radar',
        subtitle: 'Find the best betting opportunities',
        content: 'Our algorithm identifies matches where the odds offer exceptional value.',
        timestamp: now.toISOString(),
        priority: 42
      });
    }

    feedItems.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    console.log('Built feed with', feedItems.length, 'items');
    setFeed(feedItems);
  }, []);

  const refreshMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedMatches = await fetchMatches();
      buildFeed(fetchedMatches);
    } finally {
      setLoading(false);
    }
  }, [fetchMatches, buildFeed]);

  const refreshFeed = useCallback(async () => {
    buildFeed(matches);
  }, [matches, buildFeed]);

  const getMatchById = useCallback((id: string) => {
    return matches.find(m => m.id === id);
  }, [matches]);

  useEffect(() => {
    refreshMatches();
    const interval = setInterval(() => {
      refreshMatches();
    }, 120000);
    return () => clearInterval(interval);
  }, [refreshMatches]);

  return (
    <SportsContext.Provider value={{
      matches,
      feed,
      leagues,
      loading,
      error,
      user,
      betSlip,
      refreshMatches,
      refreshFeed,
      getMatchById,
      addComment,
      logout
    }}>
      {children}
    </SportsContext.Provider>
  );
}

export function useSports() {
  const context = useContext(SportsContext);
  if (!context) {
    throw new Error('useSports must be used within a SportsProvider');
  }
  return context;
}

export default SportsContext;
