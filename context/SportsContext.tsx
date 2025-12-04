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

// Helper Arrays for Procedural Generation
// ...existing code...

const USER_STORAGE_KEY = 'sheena_user_profile';
const TOKEN_STORAGE_KEY = 'sheena_access_token';

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export const SportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authState, setAuthState] = useState<AuthState>('UNAUTHENTICATED');
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
        const hero = currentNews.find(n => n.isHero);
        if (hero) mixedFeed.push(hero);

        const remainingNews = currentNews.filter(n => !n.isHero);
        const predictions = currentMatches
            .filter(m => m.status !== MatchStatus.LIVE && m.prediction)
            .sort((a,b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0));

        let mIdx = 60; 
        let nIdx = 0;
        let aIdx = 0;

        while (mIdx < predictions.length || nIdx < remainingNews.length || aIdx < currentAlerts.length) {
            if (aIdx < currentAlerts.length) mixedFeed.push(currentAlerts[aIdx++]);
            if (mIdx < predictions.length) mixedFeed.push(predictions[mIdx++]);
            if (mIdx < predictions.length) mixedFeed.push(predictions[mIdx++]);
            if (nIdx < remainingNews.length) mixedFeed.push(remainingNews[nIdx++]);
        }
        setFeedItems(mixedFeed);
    };

    useEffect(() => {
        // Generate mock data for immediate UI testing
        const generateMockData = () => {
            // Mock matches
            const mockMatches: Match[] = [
                {
                    id: 'arsenal-chelsea-1',
                    league: 'EPL',
                    homeTeam: { id: '42', name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
                    awayTeam: { id: '49', name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
                    status: MatchStatus.SCHEDULED,
                    time: '15:00',
                    prediction: {
                        outcome: 'HOME',
                        confidence: 78,
                        scorePrediction: '2-1',
                        aiReasoning: 'Arsenal has been strong at home this season',
                        keyInsight: 'Home advantage and recent form favor Arsenal',
                        odds: { home: 2.1, draw: 3.4, away: 3.2 },
                        weather: 'Clear',
                        sentiment: 'POSITIVE'
                    },
                    context: {
                        headline: 'Arsenal strong at home',
                        commentCount: 12
                    }
                },
                {
                    id: 'lakers-warriors-1',
                    league: 'NBA',
                    homeTeam: { id: '132', name: 'Lakers', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/LAL.png' },
                    awayTeam: { id: '161', name: 'Warriors', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/GSW.png' },
                    status: MatchStatus.SCHEDULED,
                    time: '20:00',
                    prediction: {
                        outcome: 'AWAY',
                        confidence: 82,
                        scorePrediction: '112-118',
                        aiReasoning: 'Warriors have better recent form',
                        keyInsight: 'Away team momentum suggests upset potential',
                        odds: { home: 1.9, draw: null, away: 1.95 },
                        weather: 'Indoor',
                        sentiment: 'NEGATIVE'
                    }
                }
            ];

            // Mock news
            const mockNews: NewsStory[] = [
                {
                    id: 'arsenal-chelsea-news',
                    title: 'Arsenal vs Chelsea Preview: Gunners Look to Extend Winning Run',
                    summary: 'Arsenal head into this Premier League clash with Chelsea looking to maintain their impressive form at the Emirates...',
                    imageUrl: 'https://via.placeholder.com/400x200',
                    source: 'Sky Sports',
                    author: 'John Smith',
                    timestamp: '2 hours ago',
                    tags: ['EPL', 'Arsenal', 'Chelsea'],
                    type: 'NEWS',
                    isHero: true,
                    likes: 245,
                    comments: 89
                },
                {
                    id: 'lakers-warriors-news',
                    title: 'Golden State Warriors Face Tough Test Against Lakers',
                    summary: 'The Warriors travel to LA looking to snap their recent losing streak...',
                    imageUrl: 'https://via.placeholder.com/400x200',
                    source: 'ESPN',
                    author: 'Mike Johnson',
                    timestamp: '1 hour ago',
                    tags: ['NBA', 'Lakers', 'Warriors'],
                    type: 'NEWS',
                    isHero: false,
                    likes: 156,
                    comments: 43
                }
            ];

            // Mock alerts
            const mockAlerts: SystemAlert[] = [
                {
                    id: 'sharp-money-alert',
                    type: 'SYSTEM_ALERT',
                    alertType: 'SHARP_MONEY',
                    title: 'Sharp Money Alert',
                    description: 'Heavy betting detected on Arsenal to win. Line movement suggests professional money.',
                    dataPoint: '2.10 → 2.05',
                    league: 'EPL',
                    timestamp: '30 min ago',
                    relatedMatchId: 'arsenal-chelsea-1'
                }
            ];

            // Mock leaderboard
            const mockLeaderboard: LeaderboardEntry[] = [
                { rank: 1, userId: '1', userName: 'SportsPro2024', userAvatar: '', winRate: 68.5, netProfit: 1250 },
                { rank: 2, userId: '2', userName: 'BetMaster', userAvatar: '', winRate: 65.2, netProfit: 1180 },
                { rank: 3, userId: '3', userName: 'TipsterKing', userAvatar: '', winRate: 62.8, netProfit: 1120 }
            ];

            setMatches(mockMatches);
            setNews(mockNews);
            setAlerts(mockAlerts);
            setLeaderboard(mockLeaderboard);
        };

        generateMockData();
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
        const availableMatches = matches.filter(m => !betSlip.find(b => b.matchId === m.id) && m.prediction);
        if (availableMatches.length > 0) {
            const randomMatch = availableMatches[Math.floor(Math.random() * availableMatches.length)];
            addToSlip(randomMatch);
        }
    };

    const generateMkeka = (type: MkekaType) => {
        let filtered = matches.filter(m => m.prediction && m.status === MatchStatus.SCHEDULED);
        
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