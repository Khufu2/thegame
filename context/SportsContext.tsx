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
    UserPreferences,
    FollowedMatch,
    FollowedBetslip,
    Notification,
    NotificationPreferences
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
        status: MatchStatus.LIVE,
        time: '15:00',
        momentum: { home: 65, away: 35 },
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
const THEME_STORAGE_KEY = 'sheena_theme';

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export const SportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authState, setAuthState] = useState<AuthState>('GUEST');
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [theme, setTheme] = useState<'LIGHT' | 'DARK'>(() => {
        return (localStorage.getItem(THEME_STORAGE_KEY) as 'LIGHT' | 'DARK') || 'DARK';
    });
    const [matches, setMatches] = useState<Match[]>([]);
    const [news, setNews] = useState<NewsStory[]>([]);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
    const [isPwezaOpen, setIsPwezaOpen] = useState(false);
    const [pwezaPrompt, setPwezaPrompt] = useState<string | null>(null);
    const [flashAlert, setFlashAlert] = useState<FlashAlert | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [followedMatches, setFollowedMatches] = useState<FollowedMatch[]>([]);
    const [followedBetslips, setFollowedBetslips] = useState<FollowedBetslip[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);

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
        // Fetch matches via edge function - with caching headers
        const fetchMatches = async () => {
            try {
                const response = await fetch(
                    `${SUPABASE_URL}/functions/v1/get-matches?limit=200`,
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
                    // Handle both { matches: [...] } and direct array responses
                    const matchesArray = Array.isArray(data) ? data : (data.matches || []);
                    console.log('Fetched matches:', matchesArray.length);
                    
                    // Check if any matches are missing logos (only check first 20)
                    const needsLogos = matchesArray.slice(0, 20).some((m: any) => 
                        !m.homeTeam?.logo || !m.awayTeam?.logo ||
                        m.homeTeam?.logo?.includes('ui-avatars') || m.awayTeam?.logo?.includes('ui-avatars')
                    );
                    if (needsLogos) {
                        // Trigger logo fetch in background (don't await)
                        fetch(`${SUPABASE_URL}/functions/v1/fetch-team-logos`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                'Content-Type': 'application/json',
                            },
                        }).then(() => {
                            console.log('Logo fetch triggered');
                        }).catch(err => console.error('Logo fetch failed:', err));
                    }
                    
                    setMatches(matchesArray);
                } else {
                    console.error('Failed to fetch matches:', response.status);
                    console.log('Using mock data as fallback');
                    setMatches(getMockMatches());
                }
            } catch (error) {
                console.error('Error fetching matches:', error);
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

                    // Parse content JSON and transform to NewsStory format
                    const parsedNews = data.map((item: any) => {
                        // Try to parse content blocks
                        let contentBlocks: any[] = [];
                        if (item.content) {
                            try {
                                const parsed = JSON.parse(item.content);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    contentBlocks = parsed;
                                }
                            } catch (e) {
                                // If content is a plain string, use it as body
                                if (typeof item.content === 'string' && item.content.length > 0) {
                                    contentBlocks = [{ type: 'TEXT', content: item.content }];
                                }
                            }
                        }
                        
                        // If still no content blocks but we have excerpt, use that
                        if (contentBlocks.length === 0 && item.excerpt) {
                            contentBlocks = [{ type: 'TEXT', content: item.excerpt }];
                        }

                        return {
                            id: item.id,
                            type: item.type || 'NEWS',
                            title: item.title,
                            summary: item.excerpt || '',
                            imageUrl: item.image_url || item.featured_image_url,
                            source: item.source || 'Sheena Sports',
                            timestamp: new Date(item.created_at).toLocaleDateString(),
                            likes: 0,
                            comments: 0,
                            tags: item.tags || [],
                            contentBlocks: contentBlocks,
                            body: contentBlocks.length > 0 ? undefined : [item.excerpt || ''],
                            isHero: item.metadata?.isHero || false
                        };
                    });

                    setNews(parsedNews);
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
        if (theme === 'LIGHT') {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '#ffffff';
            document.body.style.color = '#000000';
        } else {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#000000';
            document.body.style.color = '#ffffff';
        }
    }, [theme]);

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
        // Sync theme from user preferences
        if (profile.preferences.theme) {
            setTheme(profile.preferences.theme);
            localStorage.setItem(THEME_STORAGE_KEY, profile.preferences.theme);
        }
        // Load user data
        loadUserData(profile.id);
    };

    const loadUserData = async (userId: string) => {
        try {
            // Load followed matches
            const { data: followedMatchesData } = await supabase
                .from('followed_matches')
                .select('*')
                .eq('user_id', userId);

            if (followedMatchesData) {
                const followed = followedMatchesData.map(fm => ({
                    id: fm.id,
                    userId: fm.user_id,
                    matchId: fm.match_id,
                    createdAt: new Date(fm.created_at).getTime()
                }));
                setFollowedMatches(followed);
            }

            // Load followed betslips
            const { data: followedBetslipsData } = await supabase
                .from('followed_betslips')
                .select('*')
                .eq('user_id', userId);

            if (followedBetslipsData) {
                const followed = followedBetslipsData.map(fb => ({
                    id: fb.id,
                    userId: fb.user_id,
                    betslipId: fb.betslip_id,
                    createdAt: new Date(fb.created_at).getTime()
                }));
                setFollowedBetslips(followed);
            }

            // Load notification preferences
            const { data: prefsData } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (prefsData) {
                setNotificationPreferences({
                    id: prefsData.id,
                    userId: prefsData.user_id,
                    pushEnabled: prefsData.push_enabled,
                    whatsappEnabled: prefsData.whatsapp_enabled,
                    emailEnabled: prefsData.email_enabled,
                    liveAlerts: prefsData.live_alerts,
                    warRoomAlerts: prefsData.war_room_alerts,
                    momentumAlerts: prefsData.momentum_alerts,
                    createdAt: new Date(prefsData.created_at).getTime(),
                    updatedAt: new Date(prefsData.updated_at).getTime()
                });
            }

            // Load recent notifications
            const { data: notificationsData } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (notificationsData) {
                const notifications = notificationsData.map(n => ({
                    id: n.id,
                    userId: n.user_id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    matchId: n.match_id,
                    betslipId: n.betslip_id,
                    data: n.data,
                    read: n.read,
                    sentPush: n.sent_push,
                    sentWhatsapp: n.sent_whatsapp,
                    sentEmail: n.sent_email,
                    createdAt: new Date(n.created_at).getTime()
                }));
                setNotifications(notifications);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
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
                // Sync theme if it was updated
                if (newPrefs.theme) {
                    setTheme(newPrefs.theme);
                    localStorage.setItem(THEME_STORAGE_KEY, newPrefs.theme);
                }
            }
        } else {
            // For guests, update theme directly
            if (newPrefs.theme) {
                setTheme(newPrefs.theme);
                localStorage.setItem(THEME_STORAGE_KEY, newPrefs.theme);
            }
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'DARK' ? 'LIGHT' : 'DARK';
        setTheme(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        // Also update user preferences if logged in
        if (user) {
            updatePreferences({ theme: newTheme });
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

    const addBetSlipItem = (item: BetSlipItem) => {
        if (betSlip.find(b => b.id === item.id)) return;
        setBetSlip(prev => [...prev, item]);
    };

    const saveBetslip = async (name?: string, isPublic: boolean = false) => {
        if (!user || betSlip.length === 0) return;

        const totalOdds = betSlip.reduce((acc, item) => acc * item.odds, 1);

        try {
            // Save betslip
            const { data: betslipData, error: betslipError } = await supabase
                .from('betslips')
                .insert({
                    user_id: user.id,
                    name: name || `${betSlip.length} Leg Parlay`,
                    items: betSlip,
                    total_odds: totalOdds,
                    stake: 10, // Default stake
                    potential_return: 10 * totalOdds,
                    is_public: isPublic
                })
                .select()
                .single();

            if (betslipError) throw betslipError;

            // Save individual betslip items
            const betslipItems = betSlip.map(item => ({
                betslip_id: betslipData.id,
                match_id: item.matchId,
                match_up: item.matchUp,
                selection: item.selection,
                market: item.market,
                odds: item.odds,
                outcome: item.outcome
            }));

            const { error: itemsError } = await supabase
                .from('betslip_items')
                .insert(betslipItems);

            if (itemsError) throw itemsError;

            // Clear current betslip after saving
            setBetSlip([]);

            console.log('Betslip saved successfully');
        } catch (error) {
            console.error('Error saving betslip:', error);
            throw error;
        }
    };

    const loadUserBetslips = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('betslips')
                .select(`
                    *,
                    betslip_items (*)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Transform data for leaderboard usage
            // This would be used by the LeaderboardPage
            console.log('Loaded user betslips:', data);
        } catch (error) {
            console.error('Error loading user betslips:', error);
        }
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

    const addNewsStory = async (story: NewsStory) => {
        // Save to database
        try {
            const { data, error } = await supabase
                .from('feeds')
                .insert({
                    type: story.type || 'NEWS',
                    title: story.title,
                    excerpt: story.summary,
                    content: JSON.stringify(story.contentBlocks || []),
                    image_url: story.imageUrl,
                    source: story.source,
                    author: story.source,
                    tags: story.tags || [],
                    metadata: {
                        likes: story.likes || 0,
                        comments: story.comments || 0,
                        isHero: story.isHero || false
                    }
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to save news to database:', error);
                // Still update local state as fallback
                setNews(prev => [story, ...prev]);
            } else {
                console.log('News saved to database:', data);
                // Update local state with the saved story
                setNews(prev => [story, ...prev]);
            }
        } catch (err) {
            console.error('Error saving news:', err);
            setNews(prev => [story, ...prev]);
        }
    };

    const addSystemAlert = async (alert: SystemAlert) => {
        // Save to database as a feed item with type ALERT
        try {
            const { data, error } = await supabase
                .from('feeds')
                .insert({
                    type: 'ALERT',
                    title: alert.title,
                    excerpt: alert.description,
                    content: JSON.stringify({ dataPoint: alert.dataPoint, signalStrength: alert.signalStrength }),
                    tags: [alert.league],
                    metadata: {
                        alertType: alert.alertType
                    }
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to save alert to database:', error);
            } else {
                console.log('Alert saved to database:', data);
            }
        } catch (err) {
            console.error('Error saving alert:', err);
        }
        // Always update local state
        setAlerts(prev => [alert, ...prev]);
    };

    const deleteNewsStory = (id: string) => {
        setNews(prev => prev.filter(n => n.id !== id));
    };

    const deleteSystemAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    // Follow system functions
    const followMatch = async (matchId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('followed_matches')
                .insert({ user_id: user.id, match_id: matchId });

            if (!error) {
                const newFollow: FollowedMatch = {
                    id: `fm_${Date.now()}`,
                    userId: user.id,
                    matchId,
                    createdAt: Date.now()
                };
                setFollowedMatches(prev => [...prev, newFollow]);
            }
        } catch (error) {
            console.error('Error following match:', error);
        }
    };

    const unfollowMatch = async (matchId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('followed_matches')
                .delete()
                .eq('user_id', user.id)
                .eq('match_id', matchId);

            if (!error) {
                setFollowedMatches(prev => prev.filter(f => f.matchId !== matchId));
            }
        } catch (error) {
            console.error('Error unfollowing match:', error);
        }
    };

    const followBetslip = async (betslipId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('followed_betslips')
                .insert({ user_id: user.id, betslip_id: betslipId });

            if (!error) {
                const newFollow: FollowedBetslip = {
                    id: `fb_${Date.now()}`,
                    userId: user.id,
                    betslipId,
                    createdAt: Date.now()
                };
                setFollowedBetslips(prev => [...prev, newFollow]);
            }
        } catch (error) {
            console.error('Error following betslip:', error);
        }
    };

    const unfollowBetslip = async (betslipId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('followed_betslips')
                .delete()
                .eq('user_id', user.id)
                .eq('betslip_id', betslipId);

            if (!error) {
                setFollowedBetslips(prev => prev.filter(f => f.betslipId !== betslipId));
            }
        } catch (error) {
            console.error('Error unfollowing betslip:', error);
        }
    };

    // Notification functions
    const markNotificationRead = async (notificationId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)
                .eq('user_id', user.id);

            if (!error) {
                setNotifications(prev => prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                ));
            }
        } catch (error) {
            console.error('Error marking notification read:', error);
        }
    };

    const updateNotificationPreferences = async (prefs: Partial<NotificationPreferences>) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('notification_preferences')
                .upsert({
                    user_id: user.id,
                    ...prefs,
                    updated_at: new Date().toISOString()
                });

            if (!error) {
                setNotificationPreferences(prev => prev ? { ...prev, ...prefs } : null);
            }
        } catch (error) {
            console.error('Error updating notification preferences:', error);
        }
    };

    const sendNotification = async (notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    ...notification
                })
                .select()
                .single();

            if (!error && data) {
                const newNotification: Notification = {
                    ...notification,
                    id: data.id,
                    userId: user.id,
                    createdAt: Date.now()
                };
                setNotifications(prev => [newNotification, ...prev]);
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    return (
        <SportsContext.Provider value={{
            user, authState, authToken, matches, news, feedItems, betSlip, isPwezaOpen, pwezaPrompt, flashAlert, alerts, leaderboard,
            login, loginAsGuest, logout, completeOnboarding, updatePreferences,
            addToSlip, addBetSlipItem, saveBetslip, loadUserBetslips, removeFromSlip, clearSlip, addRandomPick, generateMkeka,
            setIsPwezaOpen: (open, prompt) => { setIsPwezaOpen(open); if(prompt) setPwezaPrompt(prompt); else setPwezaPrompt(null); },
            addComment, triggerFlashAlert,
            addNewsStory, addSystemAlert, deleteNewsStory, deleteSystemAlert,
            theme, toggleTheme,
            followedMatches, followedBetslips, followMatch, unfollowMatch, followBetslip, unfollowBetslip,
            notifications, notificationPreferences, markNotificationRead, updateNotificationPreferences, sendNotification
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