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
        // Fetch matches from Supabase
        const fetchMatches = async () => {
            const { data, error } = await supabase.from('matches').select('*');
            if (!error && data) setMatches(data);
        };
        // Fetch news from Supabase
        const fetchNews = async () => {
            const { data, error } = await supabase.from('news').select('*');
            if (!error && data) setNews(data);
        };
        // Fetch alerts from Supabase
        const fetchAlerts = async () => {
            const { data, error } = await supabase.from('alerts').select('*');
            if (!error && data) setAlerts(data);
        };
        // Fetch leaderboard from Supabase
        const fetchLeaderboard = async () => {
            const { data, error } = await supabase.from('leaderboard').select('*');
            if (!error && data) setLeaderboard(data);
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