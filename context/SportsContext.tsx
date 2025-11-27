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

// Helper Arrays for Procedural Generation
const TEAMS_POOL = {
    NBA: [
        { name: 'Warriors', logo: 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg' },
        { name: 'Suns', logo: 'https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg' },
        { name: 'Bucks', logo: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg' },
        { name: 'Nuggets', logo: 'https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg' },
        { name: 'Mavericks', logo: 'https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg' }
    ],
    EPL: [
        { name: 'Spurs', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg' },
        { name: 'Aston Villa', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg' },
        { name: 'West Ham', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg' },
        { name: 'Everton', logo: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg' }
    ],
    NFL: [
        { name: '49ers', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/San_Francisco_49ers_logo.svg' },
        { name: 'Ravens', logo: 'https://upload.wikimedia.org/wikipedia/en/1/16/Baltimore_Ravens_logo.svg' },
        { name: 'Bengals', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Cincinnati_Bengals_logo.svg' }
    ]
};

const generateProceduralMatches = (count: number): Match[] => {
    const matches: Match[] = [];
    const leagues = ['NBA', 'EPL', 'NFL', 'LaLiga', 'UFC'];
    
    for (let i = 0; i < count; i++) {
        const league = leagues[Math.floor(Math.random() * leagues.length)];
        const pool = (TEAMS_POOL as any)[league] || [{name: 'Team A', logo: ''}, {name: 'Team B', logo: ''}];
        const homeT = pool[Math.floor(Math.random() * pool.length)];
        const awayT = pool[Math.floor(Math.random() * pool.length)];
        
        const home = { ...homeT, id: `t_gen_h_${i}` };
        const away = homeT.name === awayT.name ? { name: 'Opponent', logo: '', id: `t_gen_a_${i}` } : { ...awayT, id: `t_gen_a_${i}` };

        const confidence = Math.floor(Math.random() * 50) + 40; 
        const isHighVal = Math.random() > 0.7;
        const outcome = Math.random() > 0.5 ? 'HOME' : (Math.random() > 0.5 ? 'AWAY' : 'DRAW');

        matches.push({
            id: `m_gen_${i}`,
            league: league,
            homeTeam: { id: home.id, name: home.name, logo: home.logo || 'https://ui-avatars.com/api/?name=' + home.name, record: '0-0' },
            awayTeam: { id: away.id, name: away.name, logo: away.logo || 'https://ui-avatars.com/api/?name=' + away.name, record: '0-0' },
            status: MatchStatus.SCHEDULED,
            time: `${12 + Math.floor(Math.random()*10)}:00`,
            prediction: {
                outcome: outcome as any,
                confidence: confidence,
                scorePrediction: '0-0',
                aiReasoning: 'Procedural generation based on mock algorithms.',
                keyInsight: isHighVal ? 'High Value Play' : 'Standard Pick',
                isValuePick: isHighVal,
                potentialReturn: isHighVal ? `+${100 + Math.floor(Math.random()*200)}` : '-110',
                odds: { home: 1.9, draw: 3.2, away: 2.1 },
                modelEdge: Math.floor(Math.random() * 10)
            }
        });
    }
    return matches;
};

const generateMockData = () => {
   const hardcodedMatches: Match[] = [
    {
      id: 'm_live_1',
      league: 'LaLiga',
      homeTeam: { 
          id: 't_rm', name: 'Real Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', 
          form: ['W','W','D','W','W'], record: '20-3-1', rank: 1 
      },
      awayTeam: { 
          id: 't_bar', name: 'Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 
          form: ['W','W','W','L','W'], record: '18-4-2', rank: 2 
      },
      status: MatchStatus.LIVE,
      time: "82'",
      score: { home: 2, away: 2 },
      venue: 'Santiago Bernabéu',
      venueDetails: {
          capacity: '81,044',
          opened: '1947',
          city: 'Madrid',
          country: 'Spain',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Santiago_Bernab%C3%A9u_Stadium_%282022%29.jpg',
          description: 'The Santiago Bernabéu Stadium is a football stadium in Madrid, Spain. With a current seating capacity of 81,044, it has been the home stadium of Real Madrid since its completion in 1947.'
      },
      momentum: { home: 85, away: 15 },
      prediction: {
        outcome: 'HOME',
        confidence: 65,
        scorePrediction: '3-2',
        aiReasoning: 'Real Madrid late-game xG is highest in Europe. Momentum shifting heavily to home side with Vinicius impact.',
        keyInsight: 'Madrid scores 40% of goals in final 15 mins',
        weather: 'Clear 18°C',
        sentiment: 'POSITIVE',
        probability: { home: 60, draw: 30, away: 10 },
        isValuePick: false,
        potentialReturn: '+110',
        odds: { home: 2.10, draw: 3.20, away: 3.50 },
        modelEdge: 4.5,
        factors: [
            { label: 'Late Game Stamina', weight: 15, description: "Madrid's bench impact rating is #1 in LaLiga.", type: 'POSITIVE' },
            { label: 'Momentum', weight: 10, description: "Home crowd pressure index peaking.", type: 'POSITIVE' }
        ]
      },
      context: { headline: "El Clasico Thriller: Bellingham equalizes!", commentCount: 12500, isHot: true },
      lineups: {
          home: {
              formation: '4-3-3',
              starting: [
                  { id: 'p1', name: 'Courtois', number: 1, position: 'GK', avatar: '', rating: 8.5 },
                  { id: 'p2', name: 'Carvajal', number: 2, position: 'DF', avatar: '', rating: 7.2 },
                  { id: 'p3', name: 'Militao', number: 3, position: 'DF', avatar: '', rating: 7.0 },
                  { id: 'p4', name: 'Rudiger', number: 22, position: 'DF', avatar: '', rating: 7.5 },
                  { id: 'p5', name: 'Mendy', number: 23, position: 'DF', avatar: '', rating: 6.8 },
                  { id: 'p6', name: 'Tchouameni', number: 18, position: 'MF', avatar: '', rating: 7.8 },
                  { id: 'p7', name: 'Valverde', number: 15, position: 'MF', avatar: '', rating: 8.2 },
                  { id: 'p8', name: 'Bellingham', number: 5, position: 'MF', avatar: '', rating: 9.0, events: [{ type: 'GOAL', minute: "82'" }] },
                  { id: 'p9', name: 'Rodrygo', number: 11, position: 'FW', avatar: '', rating: 7.5 },
                  { id: 'p10', name: 'Vinicius', number: 7, position: 'FW', avatar: '', rating: 8.8 },
                  { id: 'p11', name: 'Mbappe', number: 9, position: 'FW', avatar: '', rating: 8.5, events: [{ type: 'GOAL', minute: "34'" }] }
              ],
              subs: [],
              coach: 'Ancelotti'
          },
          away: {
              formation: '4-3-3',
              starting: [],
              subs: [],
              coach: 'Flick'
          }
      }
    },
   ];
  
  const news: NewsStory[] = [
    {
      id: 'n_hero_1',
      type: 'NEWS',
      title: "Mbappe Announcement Imminent",
      summary: "Sources close to the player confirm a decision has been made regarding his future at PSG.",
      imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2000&auto=format&fit=crop",
      source: "Fabrizio Romano",
      timestamp: "15m ago",
      likes: 24500,
      comments: 1200,
      isHero: true,
      tags: ['Soccer', 'Transfers'],
      contentBlocks: [{ type: 'TEXT', content: "The saga appears to be reaching its conclusion." }]
    },
     {
      id: 'n_std_1',
      type: 'NEWS',
      title: "Warriors Dynasty in Question",
      summary: "Klay Thompson's departure signals a new era for Golden State.",
      imageUrl: "https://images.unsplash.com/photo-1519861531473-920026393112?q=80&w=1000",
      source: "Wojnarowski",
      timestamp: "1h ago",
      likes: 1200,
      comments: 300,
      tags: ['NBA'],
      contentBlocks: [{ type: 'TEXT', content: "Big changes coming to the Bay Area." }]
    },
  ];

  const alerts: SystemAlert[] = [
      {
          id: 'alert_1',
          type: 'SYSTEM_ALERT',
          alertType: 'SHARP_MONEY',
          title: 'Steam Move: Chiefs',
          description: 'Professional money pouring in on KC -2.5.',
          dataPoint: '92% Cash on KC',
          league: 'NFL',
          timestamp: '10m ago',
          signalStrength: 'HIGH'
      }
  ];

  const leaderboard: LeaderboardEntry[] = [
      { rank: 1, userId: 'u99', userName: 'NaijaBetKing', userAvatar: 'https://ui-avatars.com/api/?name=NB', winRate: 72, netProfit: 5400, isPro: true, streak: 5 },
      { rank: 2, userId: 'u98', userName: 'SheenaProphet', userAvatar: 'https://ui-avatars.com/api/?name=SP', winRate: 68, netProfit: 4200, isPro: true },
      { rank: 3, userId: 'u1', userName: 'You', userAvatar: 'https://ui-avatars.com/api/?name=You', winRate: 66, netProfit: 120.50, isPro: true },
  ];
  
  const generatedMatches = generateProceduralMatches(50);
  const allMatches = [...hardcodedMatches, ...generatedMatches];
  
  return { matches: allMatches, news, alerts, leaderboard };
}

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export const SportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authState, setAuthState] = useState<AuthState>('UNAUTHENTICATED');
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
        const { matches, news, alerts, leaderboard } = generateMockData();
        setMatches(matches);
        setNews(news);
        setAlerts(alerts);
        setLeaderboard(leaderboard);
        rebuildFeed(matches, news, alerts);
        
        setTimeout(() => {
            triggerFlashAlert({
                id: 'flash-demo',
                message: "⚡ EL CLASICO: Momentum shift to Real Madrid!",
                type: 'MOMENTUM',
                matchId: 'm_live_1'
            });
        }, 3000);

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

    const login = (email: string) => {
        const isAdmin = email.includes('admin');
        const mockUser: UserProfile = {
            id: 'u1',
            name: email.split('@')[0] || 'User',
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${email}&background=6366F1&color=fff`,
            isPro: true,
            isAdmin: isAdmin,
            stats: { betsPlaced: 12, wins: 8, losses: 4, winRate: 66, netProfit: 120.50 },
            preferences: {
                favoriteLeagues: [],
                favoriteTeams: [],
                followedSources: ['Fabrizio Romano'], 
                notifications: { 
                    gameStart: true, 
                    scoreUpdates: true,
                    lineMoves: false,
                    breakingNews: true,
                    whatsappUpdates: false
                },
                communicationChannel: 'EMAIL',
                oddsFormat: 'DECIMAL',
                dataSaver: false, // CRITICAL: FORCE FALSE BY DEFAULT
                theme: 'DARK',
                hasCompletedOnboarding: true
            }
        };
        
        setUser(mockUser);
        setAuthState('AUTHENTICATED');
    };

    const loginAsGuest = () => {
        // Guest user also defaults to High Quality mode
        setAuthState('GUEST');
    };

    const logout = () => {
        setUser(null);
        setAuthState('UNAUTHENTICATED');
    };

    const completeOnboarding = (prefs: { leagues: string[], teams: string[] }) => {
        if (user) {
            const updatedUser = { ...user, preferences: { ...user.preferences, favoriteLeagues: prefs.leagues, favoriteTeams: prefs.teams, hasCompletedOnboarding: true } };
            setUser(updatedUser);
            setAuthState('AUTHENTICATED');
        }
    };

    const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
        if (user) {
            const updatedUser = { ...user, preferences: { ...user.preferences, ...newPrefs } };
            setUser(updatedUser);
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
            user, authState, matches, news, feedItems, betSlip, isPwezaOpen, pwezaPrompt, flashAlert, alerts, leaderboard,
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