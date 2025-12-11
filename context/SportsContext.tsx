import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    SportsContextType, 
    UserProfile, 
    AuthState, 
    Match, 
    NewsStory, 
    FeedItem, 
    BetSlipItem,
    MatchStatus,
    SystemAlert,
    MkekaType,
    FlashAlert,
    Comment,
    LeaderboardEntry,
    UserPreferences
} from '../types';
import supabase from '../services/supabaseClient';

// Hardcoded Supabase credentials (not using VITE env vars which don't work at runtime)
const SUPABASE_URL = "https://ebfhyyznuzxwhirwlcds.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA";

// Mock data for development
const getMockMatches = (): Match[] => [
    {
        id: 'mock-1',
        league: 'Premier League',
        homeTeam: {
            id: '1',
            name: 'Manchester City',
            logo: 'https://media.api-sports.io/football/teams/50.png',
            form: ['W', 'W', 'W', 'D', 'W'],
            record: '18-2-2'
        },
        awayTeam: {
            id: '2',
            name: 'Arsenal',
            logo: 'https://media.api-sports.io/football/teams/42.png',
            form: ['W', 'D', 'W', 'W', 'L'],
            record: '15-4-3'
        },
        status: MatchStatus.SCHEDULED,
        time: '15:00',
        prediction: {
            outcome: 'HOME',
            confidence: 75,
            scorePrediction: '2-1',
            aiReasoning: 'Manchester City has been dominant at home this season',
            keyInsight: 'City won 4 of their last 5 home games',
            bettingAngle: 'Manchester City ML',
            odds: { home: 1.85, draw: 3.60, away: 4.20 },
            probability: { home: 55, draw: 25, away: 20 },
            isValuePick: true,
            riskLevel: 'MEDIUM',
            modelEdge: 3.2,
            systemRecord: '8-2 L10'
        }
    },
    {
        id: 'mock-2',
        league: 'Premier League',
        homeTeam: {
            id: '3',
            name: 'Liverpool',
            logo: 'https://media.api-sports.io/football/teams/40.png',
            form: ['W', 'W', 'D', 'W', 'W'],
            record: '16-3-3'
        },
        awayTeam: {
            id: '4',
            name: 'Chelsea',
            logo: 'https://media.api-sports.io/football/teams/49.png',
            form: ['L', 'W', 'D', 'W', 'D'],
            record: '12-5-5'
        },
        status: MatchStatus.SCHEDULED,
        time: '17:30',
        prediction: {
            outcome: 'HOME',
            confidence: 68,
            scorePrediction: '2-0',
            aiReasoning: 'Liverpool has strong home form against Chelsea',
            keyInsight: 'Liverpool unbeaten in 7 home games',
            bettingAngle: 'Liverpool -0.5 AH',
            odds: { home: 2.10, draw: 3.40, away: 3.50 },
            probability: { home: 48, draw: 27, away: 25 },
            isValuePick: false,
            riskLevel: 'MEDIUM',
            modelEdge: 2.8,
            systemRecord: '7-3 L10'
        }
    }
];

// Helper Arrays for Procedural Generation
// ...existing code...

const USER_STORAGE_KEY = 'sheena_user_profile';
const TOKEN_STORAGE_KEY = 'sheena_access_token';

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export const SportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authState, setAuthState] = useState<AuthState>('GUEST');
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [news, setNews] = useState<NewsStory[]>([]);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
    const [isPwezaOpen, setIsPwezaOpen] = useState(false);
    const [pwezaPrompt, setPwezaPrompt] = useState<string | null>(null);
    const [flashAlert, setFlashAlert] = useState<FlashAlert | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    const rebuildFeed = (currentMatches: Match[], currentNews: NewsStory[], currentAlerts: SystemAlert[]) => {
        const mixedFeed: FeedItem[] = [];
        
        // Add hero news first
        const hero = currentNews.find(n => n.isHero);
        if (hero) mixedFeed.push(hero);

        const remainingNews = currentNews.filter(n => !n.isHero);
        
        // Get all predictions sorted by confidence
        const predictions = currentMatches
            .filter(m => m.prediction)
            .sort((a,b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0));

        // Interleave content for the stream (after the first 12 which go to Daily Locks rail)
        let mIdx = 12; // Start after the Daily Locks  
        let nIdx = 0;
        let aIdx = 0;

        // Build a rich mixed stream
        while (mIdx < predictions.length || nIdx < remainingNews.length || aIdx < currentAlerts.length) {
            // Add alerts first (they're important)
            if (aIdx < currentAlerts.length) mixedFeed.push(currentAlerts[aIdx++]);
            // Add news articles
            if (nIdx < remainingNews.length) mixedFeed.push(remainingNews[nIdx++]);
            // Add match predictions
            if (mIdx < predictions.length) mixedFeed.push(predictions[mIdx++]);
        }
        setFeedItems(mixedFeed);
    };

    useEffect(() => {
        // Fetch matches via edge function
        const fetchMatches = async () => {
            try {
                const response = await fetch(
                    `${SUPABASE_URL}/functions/v1/get-matches?limit=100`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched matches:', data.length);
                    setMatches(data);
                } else {
                    console.error('Failed to fetch matches:', response.status);
                    // Fallback to mock data if API fails
                    console.log('Using mock data as fallback');
                    setMatches(getMockMatches());
                }
            } catch (error) {
                console.error('Error fetching matches:', error);
                // Fallback to mock data if network fails
                console.log('Using mock data as fallback');
                setMatches(getMockMatches());
            }
        };

        // Fetch news via edge function
        const fetchNews = async () => {
            try {
                const response = await fetch(
                    `${SUPABASE_URL}/functions/v1/get-news`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setNews(data);
                }
            } catch (error) {
                console.error('Error fetching news:', error);
            }
        };

        // Fetch alerts via edge function
        const fetchAlerts = async () => {
            try {
                const response = await fetch(
                    `${SUPABASE_URL}/functions/v1/get-alerts`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setAlerts(data);
                }
            } catch (error) {
                console.error('Error fetching alerts:', error);
            }
        };

        // Fetch leaderboard via edge function
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(
                    `${SUPABASE_URL}/functions/v1/get-leaderboard`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setLeaderboard(data);
                }
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            }
        };

        fetchMatches();
        fetchNews();
        fetchAlerts();
        fetchLeaderboard();
    }, []);

    useEffect(() => {
        const theme = user?.preferences.theme || 'DARK';
        if (theme === 'LIGHT') {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '#ffffff';
            document.body.style.color = '#000000';
        } else {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#000000';
            document.body.style.color = '#ffffff';
        }
    }, [user?.preferences.theme]);

    useEffect(() => {
        if (matches.length > 0) {
            rebuildFeed(matches, news, alerts);
        }
    }, [matches, news, alerts]);

    useEffect(() => {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (storedUser) {
            try {
                const parsed: UserProfile = JSON.parse(storedUser);
                setUser(parsed);
                setAuthState('AUTHENTICATED');
            } catch (err) {
                console.warn('Failed to parse stored user profile', err);
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        }

        if (storedToken) {
            setAuthToken(storedToken);
        }
    }, []);

    const login = (profile: UserProfile, token?: string) => {
        setUser(profile);
        setAuthState('AUTHENTICATED');
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        if (token) {
            setAuthToken(token);
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        }
    };

    const loginAsGuest = () => {
        // Guest user also defaults to High Quality mode
        setAuthState('GUEST');
    };

    const logout = () => {
        setUser(null);
        setAuthToken(null);
        setAuthState('UNAUTHENTICATED');
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    };

    const completeOnboarding = async (prefs: { leagues: string[], teams: string[] }) => {
        if (user) {
            const updatedPrefs = { ...user.preferences, favoriteLeagues: prefs.leagues, favoriteTeams: prefs.teams, hasCompletedOnboarding: true };
            const { data, error } = await supabase.from('users').update({ preferences: updatedPrefs }).eq('id', user.id).select();
            if (!error && data) {
                setUser({ ...user, preferences: updatedPrefs });
                setAuthState('AUTHENTICATED');
            }
        }
    };

    const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
        if (user) {
            const updatedPrefs = { ...user.preferences, ...newPrefs };
            const { data, error } = await supabase.from('users').update({ preferences: updatedPrefs }).eq('id', user.id).select();
            if (!error && data) {
                setUser({ ...user, preferences: updatedPrefs });
            }
        }
    };

    const addToSlip = (match: Match) => {
        if (betSlip.find(b => b.matchId === match.id)) return;
        
        let selection = 'Draw';
        let odds = match.prediction?.odds?.draw || 3.0;
        let outcome: 'HOME'|'DRAW'|'AWAY' = 'DRAW';

        if (match.prediction?.outcome === 'HOME') {
            selection = match.homeTeam.name;
            odds = match.prediction.odds?.home || 2.0;
            outcome = 'HOME';
        } else if (match.prediction?.outcome === 'AWAY') {
            selection = match.awayTeam.name;
            odds = match.prediction.odds?.away || 2.0;
            outcome = 'AWAY';
        }

        const newItem: BetSlipItem = {
            id: `bet_${Date.now()}`,
            matchId: match.id,
            matchUp: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
            selection: selection,
            odds: odds,
            outcome: outcome,
            timestamp: Date.now(),
            confidence: match.prediction?.confidence
        };
        
        setBetSlip(prev => [...prev, newItem]);
    };

    const removeFromSlip = (id: string) => {
        setBetSlip(prev => prev.filter(item => item.id !== id));
    };

    const clearSlip = () => {
        setBetSlip([]);
    };

    const addRandomPick = () => {
        const safeMatches = Array.isArray(matches) ? matches : [];
        const availableMatches = safeMatches.filter(m => !betSlip.find(b => b.matchId === m.id) && m.prediction);
        if (availableMatches.length > 0) {
            const randomMatch = availableMatches[Math.floor(Math.random() * availableMatches.length)];
            addToSlip(randomMatch);
        }
    };

    const generateMkeka = (type: MkekaType) => {
        const safeMatches = Array.isArray(matches) ? matches : [];
        let filtered = safeMatches.filter(m => m.prediction && m.status === MatchStatus.SCHEDULED);
        
        if (type === 'SAFE') {
            filtered = filtered
                .filter(m => (m.prediction?.confidence || 0) > 75)
                .sort((a,b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0))
                .slice(0, 5);
        } else if (type === 'LONGSHOT') {
            filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, 8);
        } else if (type === 'GOALS') {
            filtered = filtered.slice(0, 4); 
        }

        setBetSlip([]);
        filtered.forEach(m => addToSlip(m));
    };

    const addComment = (matchId: string, text: string, teamSupport?: 'HOME' | 'AWAY') => {
        if (!user) return;
        const newComment: Comment = {
            id: `c_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            text: text,
            timestamp: Date.now(),
            isPro: user.isPro,
            likes: 0,
            teamSupport: teamSupport
        };

        setMatches(prev => prev.map(m => {
            if (m.id === matchId) {
                return { ...m, comments: [newComment, ...(m.comments || [])], context: { ...m.context, commentCount: (m.context?.commentCount || 0) + 1 } };
            }
            return m;
        }));
    };

    const triggerFlashAlert = (alert: FlashAlert) => {
        setFlashAlert(alert);
        setTimeout(() => setFlashAlert(null), 5000);
    };

    const addNewsStory = (story: NewsStory) => {
        setNews(prev => [story, ...prev]);
    };

    const addSystemAlert = (alert: SystemAlert) => {
        setAlerts(prev => [alert, ...prev]);
    };

    const deleteNewsStory = (id: string) => {
        setNews(prev => prev.filter(n => n.id !== id));
    };

    const deleteSystemAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    return (
        <SportsContext.Provider value={{
            user, authState, authToken, matches, news, feedItems, betSlip, isPwezaOpen, pwezaPrompt, flashAlert, alerts, leaderboard,
            login, loginAsGuest, logout, completeOnboarding, updatePreferences,
            addToSlip, removeFromSlip, clearSlip, addRandomPick, generateMkeka,
            setIsPwezaOpen: (open, prompt) => { setIsPwezaOpen(open); if(prompt) setPwezaPrompt(prompt); else setPwezaPrompt(null); },
            addComment, triggerFlashAlert,
            addNewsStory, addSystemAlert, deleteNewsStory, deleteSystemAlert
        }}>
            {children}
        </SportsContext.Provider>
    );
};

export const useSports = () => {
    const context = useContext(SportsContext);
    if (context === undefined) {
        throw new Error('useSports must be used within a SportsProvider');
    }
    return context;
};