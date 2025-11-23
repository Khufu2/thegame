

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
    SystemAlert
} from '../types';

// Mock Data Generators (Moved from App.tsx)
const generateMockData = () => {
   // ... Matches and Alerts remain similar to before ...
    const matches: Match[] = [
    {
      id: 'm1',
      league: 'NFL',
      homeTeam: { 
          id: 't1', 
          name: 'Patriots', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/b/b9/New_England_Patriots_logo.svg',
          form: ['W', 'W', 'D', 'W', 'L'],
          record: '14-4-2',
          rank: 2
      },
      awayTeam: { 
          id: 't2', 
          name: 'Dolphins', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/3/37/Miami_Dolphins_logo.svg',
          form: ['W', 'W', 'W', 'D', 'W'],
          record: '15-3-2',
          rank: 1
      },
      status: MatchStatus.LIVE,
      time: "67'",
      score: { home: 24, away: 10 },
      venue: 'Gillette Stadium',
      attendance: '65,878',
      venueDetails: {
          capacity: '65,878',
          opened: '2002',
          city: 'Foxborough',
          country: 'USA',
          imageUrl: 'https://images.unsplash.com/photo-1534063806967-80252b489955?q=80&w=1000&auto=format&fit=crop',
          description: "Gillette Stadium is the home of the New England Patriots. Known for its raucous atmosphere in winter games, it features a signature lighthouse and bridge.",
          mapUrl: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1000&auto=format&fit=crop"
      },
      referee: 'Bill Vinovich',
      stats: {
          possession: { home: 55, away: 45 },
          shots: { home: 340, away: 280 },
          corners: { home: 18, away: 12 },
          fouls: { home: 4, away: 6 },
      },
      keyPlayers: {
          home: [
              { id: 'p1', name: 'Mac Jones', avatar: 'https://ui-avatars.com/api/?name=Mac+Jones&background=0D47A1&color=fff', number: 10, position: 'QB', stats: [{ label: 'YDS', value: 240 }, { label: 'TD', value: 2 }], rating: 8.5 },
              { id: 'p2', name: 'R. Stevenson', avatar: 'https://ui-avatars.com/api/?name=R+S&background=0D47A1&color=fff', number: 38, position: 'RB', stats: [{ label: 'YDS', value: 85 }, { label: 'AVG', value: 4.2 }], rating: 7.8 }
          ],
          away: [
              { id: 'p3', name: 'Tua Tagovailoa', avatar: 'https://ui-avatars.com/api/?name=Tua&background=008E97&color=fff', number: 1, position: 'QB', stats: [{ label: 'YDS', value: 180 }, { label: 'INT', value: 1 }], rating: 6.2 }
          ]
      },
      timeline: [
          { id: 'tl1', type: 'GOAL', minute: "62'", player: 'R. Stevenson', teamId: 't1', description: "Runs it in from 15 yards out! The blocking was incredible.", mediaUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=500&auto=format&fit=crop" },
          { id: 'tl2', type: 'SOCIAL', minute: "55'", source: "@NextGenStats", avatar: "https://ui-avatars.com/api/?name=NG&background=000&color=fff", description: "Mac Jones has completed 8/9 passes under pressure today. That's his season best.", likes: 1240 },
          { id: 'tl3', type: 'SOCIAL', minute: "48'", source: "@BleacherReport", avatar: "https://ui-avatars.com/api/?name=BR&background=000&color=fff", description: "This snow game is absolutely chaotic ❄️🏈", mediaUrl: "https://images.unsplash.com/photo-1517137879134-48acf67b9737?q=80&w=500&auto=format&fit=crop", likes: 8500 },
          { id: 'tl4', type: 'GOAL', minute: "34'", player: 'Tyreek Hill', teamId: 't2', description: "Caught a screen pass and TOOK OFF. 60 yard TD.", mediaUrl: "https://images.unsplash.com/photo-1611989679192-34f7803ba900?q=80&w=500&auto=format&fit=crop" }
      ],
      prediction: {
        outcome: 'HOME',
        confidence: 78,
        scorePrediction: '27-17',
        aiReasoning: 'Patriots defensive scheme limiting Dolphins run game. Home advantage significant in Q4.',
        keyInsight: 'Strong home advantage in snow.',
        xG: { home: 2.15, away: 0.88 },
        weather: 'Snow 2°C',
        sentiment: 'POSITIVE',
        injuries: ['Trent AA (Out)', 'Alisson (Doubt)'],
        probability: { home: 55, draw: 0, away: 45 },
        isValuePick: true,
        potentialReturn: '+120',
        odds: { home: 2.20, draw: 12.00, away: 1.65 },
        modelEdge: 8.5,
        systemRecord: "12-3 L15 in Snow",
        factors: [
            { label: 'Venue Conditions', weight: 15, description: "Patriots win 80% of snow games since 2010.", type: 'POSITIVE' },
            { label: 'Defensive Matchup', weight: 10, description: "Dolphins struggle vs heavy zone blitz.", type: 'POSITIVE' },
            { label: 'Key Injury', weight: -5, description: "Missing starting Safety increases deep ball risk.", type: 'NEGATIVE' }
        ]
      },
      context: {
          headline: "Mac Jones playing efficient football in snowy conditions.",
          injuryReport: "Tyreek Hill (Ankle) - Questionable return",
          commentCount: 4230,
          isHot: true
      },
      broadcaster: 'CBS',
      bettingTrends: {
          homeMoneyPercent: 65,
          homeTicketPercent: 45,
          lineMovement: 'DRIFTING_HOME',
          publicConsensus: 'Sharps pounding Patriots'
      }
    },
    {
      id: 'm4',
      league: 'NBA',
      homeTeam: {
        id: 'nba1',
        name: 'Lakers',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg',
        record: '24-12',
      },
      awayTeam: {
        id: 'nba2',
        name: 'Warriors',
        logo: 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg',
        record: '20-16',
      },
      status: MatchStatus.LIVE,
      time: 'Q3 8:42',
      score: { home: 89, away: 86 },
      stats: {
          possession: { home: 48, away: 42 },
          shots: { home: 48, away: 42 },
          shotsOnTarget: { home: 35, away: 38 },
          fouls: { home: 12, away: 14 },
      },
      prediction: {
        outcome: 'HOME',
        confidence: 65,
        scorePrediction: '112-108',
        aiReasoning: 'Lakers paint dominance (54 PIP) exploiting Warriors small ball lineup.',
        keyInsight: 'LeBron +12 when Curry sits',
        weather: 'Indoors',
        sentiment: 'POSITIVE',
        probability: { home: 60, draw: 0, away: 40 },
        isValuePick: false,
        odds: { home: 1.85, draw: 15.00, away: 2.05 },
        modelEdge: 3.2,
        systemRecord: "5-1 on Lakers Home Games",
        factors: [
             { label: 'Paint Dominance', weight: 12, description: "Lakers averaging +14 points in paint vs GSW.", type: 'POSITIVE' },
             { label: 'Fatigue', weight: 5, description: "Warriors on back-to-back.", type: 'POSITIVE' }
        ]
      },
      bettingTrends: {
          homeMoneyPercent: 80,
          homeTicketPercent: 78,
          lineMovement: 'STABLE',
          publicConsensus: 'Public heavy on Lakers'
      }
    },
     {
      id: 'm3',
      league: 'EPL',
      homeTeam: { 
          id: 't5', 
          name: 'Arsenal', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
          form: ['W', 'W', 'W', 'W', 'W'],
          record: '18-2-1',
          rank: 1
      },
      awayTeam: { 
          id: 't6', 
          name: 'Chelsea', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
          form: ['L', 'D', 'W', 'L', 'L'],
          record: '8-6-6',
          rank: 9
      },
      status: MatchStatus.SCHEDULED,
      time: '15:00',
      venue: 'Emirates Stadium',
      venueDetails: {
          capacity: "60,704",
          opened: "2006",
          city: "London",
          country: "UK",
          imageUrl: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=1000&auto=format&fit=crop",
          description: "The Emirates Stadium is the fourth-largest football stadium in England. Known for its immaculate playing surface and modern architecture, it replaced Highbury as Arsenal's home.",
          mapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop"
      },
      referee: 'Michael Oliver',
      stats: {
          possession: { home: 62, away: 38 },
          shots: { home: 15, away: 6 },
          shotsOnTarget: { home: 7, away: 2 },
          corners: { home: 8, away: 3 },
          fouls: { home: 9, away: 12 },
          yellowCards: { home: 1, away: 3 },
          passAccuracy: { home: 88, away: 79 }
      },
      keyPlayers: {
          home: [
              { id: 'kp1', name: 'Bukayo Saka', avatar: 'https://ui-avatars.com/api/?name=Bukayo+Saka&background=EF0107&color=fff', number: 7, position: 'RW', stats: [{label: 'G', value: 12}, {label: 'A', value: 8}], rating: 8.8 },
              { id: 'kp2', name: 'Martin Ødegaard', avatar: 'https://ui-avatars.com/api/?name=Martin+Odegaard&background=EF0107&color=fff', number: 8, position: 'CAM', stats: [{label: 'A', value: 10}], rating: 8.5 }
          ],
          away: [
              { id: 'kp3', name: 'Cole Palmer', avatar: 'https://ui-avatars.com/api/?name=Cole+Palmer&background=034694&color=fff', number: 20, position: 'CAM', stats: [{label: 'G', value: 14}, {label: 'A', value: 9}], rating: 8.9 },
              { id: 'kp4', name: 'Enzo Fernandez', avatar: 'https://ui-avatars.com/api/?name=Enzo+Fernandez&background=034694&color=fff', number: 8, position: 'CM', stats: [{label: 'P', value: '89%'}], rating: 7.2 }
          ]
      },
      timeline: [
           { id: 'tl_pre1', type: 'SOCIAL', minute: "Pre-Match", source: "@Arsenal", avatar: "https://ui-avatars.com/api/?name=AFC&background=EF0107&color=fff", description: "The boys have arrived at the Emirates. Huge atmosphere building! 🔴⚪️", mediaUrl: "https://images.unsplash.com/photo-1504198266287-1659872e6590?q=80&w=500&auto=format&fit=crop", likes: 25000 },
           { id: 'tl_pre2', type: 'INJURY', minute: "Pre-Match", description: "BREAKING: Reece James pulled out of warmups. Gusto expected to start.", source: "Sky Sports" }
      ],
      videos: [
           { id: 'v_preview', type: 'HIGHLIGHT', title: 'Match Preview & Analysis', duration: '2:30', thumbnail: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=500&auto=format&fit=crop' },
           { id: 'v_press', type: 'INTERVIEW', title: 'Arteta Press Conference', duration: '4:15', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500&auto=format&fit=crop' }
      ],
      prediction: {
        outcome: 'HOME',
        confidence: 82,
        scorePrediction: '3-1',
        aiReasoning: 'Arsenal dominant at home. Chelsea struggles against low block.',
        keyInsight: 'Saka vs Chilwell mismatch',
        xG: { home: 2.4, away: 0.6 },
        weather: 'Rain 9°C',
        sentiment: 'POSITIVE',
        injuries: [],
        probability: { home: 65, draw: 20, away: 15 },
        isValuePick: false,
        odds: { home: 1.62, draw: 4.00, away: 5.50 },
        modelEdge: 6.8,
        systemRecord: "18-2 in EPL Top 6 matchups",
        factors: [
             { label: 'Tactical Mismatch', weight: 20, description: "Arsenal's overload on right wing (Saka) exploits Chelsea's weakness.", type: 'POSITIVE' },
             { label: 'Home Form', weight: 15, description: "Arsenal undefeated at Emirates in last 12.", type: 'POSITIVE' },
             { label: 'Motivation', weight: 5, description: "Must win to keep title race alive.", type: 'POSITIVE' }
        ]
      },
      standings: [
          { rank: 1, teamId: 't5', teamName: 'Arsenal', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', played: 21, won: 18, drawn: 2, lost: 1, points: 56, form: ['W','W','W','W','W'] },
          { rank: 2, teamId: 'tX', teamName: 'Man City', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg', played: 21, won: 16, drawn: 3, lost: 2, points: 51, form: ['W','D','W','W','L'] },
          { rank: 3, teamId: 'tY', teamName: 'Liverpool', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg', played: 21, won: 15, drawn: 4, lost: 2, points: 49, form: ['D','W','W','L','W'] },
          { rank: 9, teamId: 't6', teamName: 'Chelsea', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg', played: 21, won: 8, drawn: 6, lost: 7, points: 30, form: ['L','D','W','L','L'] },
      ]
    },
  ];
  
  const news: NewsStory[] = [
    {
      id: 'n1',
      type: 'NEWS',
      title: "Liverpool and Barcelona in transfer talks",
      summary: "Breaking reports from Spain suggest a swap deal involving Frenkie de Jong is on the table.",
      imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2000&auto=format&fit=crop",
      source: "Sheena AI News Agent",
      timestamp: "10m",
      likes: 15400,
      comments: 3420,
      isHero: true,
      authorAvatar: 'https://ui-avatars.com/api/?name=Fabrizio',
      tags: ['Transfers', 'La Liga', 'EPL'],
      // RICH CONTENT BLOCKS
      contentBlocks: [
          { type: 'TEXT', content: "Reports emerging from Catalonia suggest Barcelona and Liverpool have opened preliminary discussions regarding a potential blockbuster midfield swap." },
          { 
              type: 'TWEET', 
              id: 'tw1', 
              author: 'Fabrizio Romano', 
              handle: '@FabrizioRomano', 
              text: "🚨 EXCLUSIVE: Liverpool have made contact with Frenkie de Jong's camp. Barcelona is open to sell due to FFP. Klopp is a huge admirer. 🔴🇳🇱 #LFC",
              url: 'twitter.com/fab/status/123' 
          },
          { type: 'TEXT', content: "The financial fair play regulations are believed to be a driving factor for the Catalan club, who need to offload salary mass before the summer window opens." },
          { 
              type: 'QUOTE', 
              text: "We are always looking for market opportunities. If a world-class player becomes available, we have to be in the conversation.", 
              author: 'Jurgen Klopp', 
              role: 'Liverpool Manager' 
          },
          { type: 'TEXT', content: "However, the player's high wages remain a stumbling block for the Reds structure." }
      ],
      relatedIds: ['n3']
    },
     {
        id: 'h1',
        type: 'HIGHLIGHT',
        title: "Best moments from last night",
        summary: "Top 10 plays from the NBA action.",
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ee2?q=80&w=2000&auto=format&fit=crop",
        source: "NBA Highlights",
        timestamp: "5h",
        likes: 5000,
        comments: 200,
        contentBlocks: [
             { type: 'TEXT', content: "A wild night in the NBA saw three games go to overtime and a buzzer beater in Miami." },
             { 
                 type: 'VIDEO', 
                 url: '', 
                 thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ee2?q=80&w=2000&auto=format&fit=crop', 
                 title: 'Top 10 Plays of the Night' 
             }
        ]
    }
  ];

  const alerts: SystemAlert[] = [
      {
          id: 'alert1',
          type: 'SYSTEM_ALERT',
          alertType: 'SHARP_MONEY',
          title: 'Sharp Action Alert',
          description: 'Heavy professional volume detected on Bills -2.5 despite public backing Chiefs.',
          dataPoint: '88% Money / 42% Tickets',
          league: 'NFL',
          timestamp: '2m ago',
          signalStrength: 'HIGH',
          actionableBet: 'Bills -2.5',
          relatedMatchId: 'm8'
      }
  ];
  
  return { matches, news, alerts };
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

    // Function to rebuild the feed based on current data
    const rebuildFeed = (currentMatches: Match[], currentNews: NewsStory[], currentAlerts: SystemAlert[]) => {
        const mixedFeed: FeedItem[] = [];
        
        // Find Hero
        const hero = currentNews.find(n => n.isHero);
        if (hero) mixedFeed.push(hero);

        const remainingNews = currentNews.filter(n => !n.isHero);
        // Prioritize Live matches or High Confidence
        const predictions = currentMatches.sort((a,b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0));

        let mIdx = 0;
        let nIdx = 0;
        let aIdx = 0;

        // Simple interleaving logic for the stream
        while (mIdx < predictions.length || nIdx < remainingNews.length || aIdx < currentAlerts.length) {
            // Pattern: Match -> News -> Alert -> Match ...
            if (aIdx < currentAlerts.length) mixedFeed.push(currentAlerts[aIdx++]);
            if (mIdx < predictions.length) mixedFeed.push(predictions[mIdx++]);
            if (nIdx < remainingNews.length) mixedFeed.push(remainingNews[nIdx++]);
            if (mIdx < predictions.length) mixedFeed.push(predictions[mIdx++]);
        }
        setFeedItems(mixedFeed);
    };

    // Initial Data Load
    useEffect(() => {
        const { matches, news, alerts } = generateMockData();
        setMatches(matches);
        setNews(news);
        setAlerts(alerts);
        rebuildFeed(matches, news, alerts);
    }, []);

    // Rebuild feed whenever underlying data changes
    useEffect(() => {
        if (matches.length > 0) {
            rebuildFeed(matches, news, alerts);
        }
    }, [matches, news, alerts]);

    const login = (email: string) => {
        // Mock Login with ADMIN capability if email contains 'admin'
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
                notifications: { gameStart: true, scoreUpdates: true, lineMoves: false, breakingNews: true },
                hasCompletedOnboarding: false
            }
        };
        setUser(mockUser);
        setAuthState('ONBOARDING');
    };

    const logout = () => {
        setUser(null);
        setAuthState('UNAUTHENTICATED');
    };

    const completeOnboarding = (prefs: { leagues: string[], teams: string[] }) => {
        if (!user) return;
        setUser({
            ...user,
            preferences: {
                ...user.preferences,
                favoriteLeagues: prefs.leagues,
                favoriteTeams: prefs.teams,
                hasCompletedOnboarding: true
            }
        });
        setAuthState('AUTHENTICATED');
    };

    const addToSlip = (match: Match) => {
      if (!match.prediction) return;
      const existing = betSlip.find(b => b.matchId === match.id);
      if (existing) return;

      const oddVal = match.prediction.outcome === 'HOME' ? match.prediction.odds?.home 
                     : match.prediction.outcome === 'AWAY' ? match.prediction.odds?.away 
                     : match.prediction.odds?.draw;

      const newItem: BetSlipItem = {
          id: Date.now().toString(),
          matchId: match.id,
          matchUp: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
          selection: match.prediction.outcome === 'HOME' ? match.homeTeam.name : match.prediction.outcome === 'AWAY' ? match.awayTeam.name : 'Draw',
          outcome: match.prediction.outcome,
          odds: oddVal || 1.91,
          confidence: match.prediction.confidence,
          timestamp: Date.now()
      };
      setBetSlip(prev => [...prev, newItem]);
    };

    const removeFromSlip = (id: string) => {
        setBetSlip(prev => prev.filter(item => item.id !== id));
    };

    const clearSlip = () => setBetSlip([]);
    
    const addRandomPick = () => {
      const candidates = matches.filter(m => m.prediction && !betSlip.find(b => b.matchId === m.id));
      if (candidates.length > 0) {
          const random = candidates[Math.floor(Math.random() * candidates.length)];
          addToSlip(random);
      }
    };

    // --- CMS ACTIONS ---
    const addNewsStory = (story: NewsStory) => {
        setNews(prev => [story, ...prev]);
    };

    const addSystemAlert = (alert: SystemAlert) => {
        setAlerts(prev => [alert, ...prev]);
    };

    return (
        <SportsContext.Provider value={{
            user,
            authState,
            login,
            logout,
            completeOnboarding,
            matches,
            news,
            feedItems,
            betSlip,
            addToSlip,
            removeFromSlip,
            clearSlip,
            addRandomPick,
            addNewsStory,
            addSystemAlert,
            isPwezaOpen,
            setIsPwezaOpen
        }}>
            {children}
        </SportsContext.Provider>
    );
};

export const useSports = () => {
    const context = useContext(SportsContext);
    if (!context) {
        throw new Error("useSports must be used within a SportsProvider");
    }
    return context;
};