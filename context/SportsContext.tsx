

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
    Comment
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
      momentum: { home: 75, away: 25 }, // High home momentum
      stats: {
          possession: { home: 55, away: 45 },
          shots: { home: 340, away: 280 }, // NFL stats are weird in this context, keeping simplified
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
      },
      comments: [
          { id: 'c1', userId: 'u5', userName: 'TomBradyBurner', userAvatar: 'https://ui-avatars.com/api/?name=TB', text: 'This defense is unreal in the snow!', timestamp: Date.now() - 300000, likes: 45, teamSupport: 'HOME' },
          { id: 'c2', userId: 'u6', userName: 'MiamiMike', userAvatar: 'https://ui-avatars.com/api/?name=MM', text: 'Tua cannot throw in the cold. We knew this.', timestamp: Date.now() - 120000, likes: 12, teamSupport: 'AWAY' }
      ]
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
      status: MatchStatus.FINISHED,
      time: 'Final',
      score: { home: 112, away: 108 },
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
      },
      boxScore: {
          headers: ['MIN', 'PTS', 'REB', 'AST'],
          home: [
              { id: 'lbj', name: 'L. James', minutes: '36', stats: { PTS: 28, REB: 11, AST: 8 } },
              { id: 'ad', name: 'A. Davis', minutes: '34', stats: { PTS: 22, REB: 14, AST: 2 } },
              { id: 'ar', name: 'A. Reaves', minutes: '30', stats: { PTS: 18, REB: 3, AST: 5 } }
          ],
          away: [
              { id: 'sc', name: 'S. Curry', minutes: '38', stats: { PTS: 32, REB: 5, AST: 6 } },
              { id: 'kt', name: 'K. Thompson', minutes: '32', stats: { PTS: 15, REB: 4, AST: 2 } }
          ]
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
          // General
          possession: { home: 62, away: 38 },
          expectedGoals: { home: 2.40, away: 0.60 },
          
          // Attack
          shots: { home: 18, away: 6 },
          shotsOnTarget: { home: 8, away: 2 },
          shotsOffTarget: { home: 6, away: 3 },
          shotsBlocked: { home: 4, away: 1 },
          shotsInsideBox: { home: 14, away: 3 },
          shotsOutsideBox: { home: 4, away: 3 },
          bigChances: { home: 4, away: 0 },
          hitWoodwork: { home: 1, away: 0 },

          // Distribution
          passes: { home: 580, away: 320 },
          passesCompleted: { home: 510, away: 250 },
          passAccuracy: { home: 88, away: 78 },
          crosses: { home: 24, away: 9 },
          longBalls: { home: 35, away: 42 },

          // Defense
          tackles: { home: 16, away: 24 },
          interceptions: { home: 8, away: 12 },
          clearances: { home: 10, away: 28 },
          saves: { home: 1, away: 5 },

          // Discipline
          corners: { home: 8, away: 3 },
          fouls: { home: 9, away: 14 },
          yellowCards: { home: 1, away: 3 },
          redCards: { home: 0, away: 0 },
          offsides: { home: 2, away: 1 }
      },
      // NEW: Lineup Data for Pitch View
      lineups: {
          home: {
              formation: "4-3-3",
              coach: "Mikel Arteta",
              starting: [
                  { id: 'h1', name: 'Raya', number: 22, position: 'GK', avatar: '', rating: 7.2 },
                  { id: 'h2', name: 'White', number: 4, position: 'DF', avatar: '', rating: 7.0 },
                  { id: 'h3', name: 'Saliba', number: 2, position: 'DF', avatar: '', rating: 7.5 },
                  { id: 'h4', name: 'Gabriel', number: 6, position: 'DF', avatar: '', rating: 7.6 },
                  { id: 'h5', name: 'Zinchenko', number: 35, position: 'DF', avatar: '', rating: 6.8 },
                  { id: 'h6', name: 'Rice', number: 41, position: 'MF', avatar: '', rating: 8.1 },
                  { id: 'h7', name: 'Odegaard', number: 8, position: 'MF', avatar: '', rating: 8.5, isCaptain: true },
                  { id: 'h8', name: 'Havertz', number: 29, position: 'MF', avatar: '', rating: 7.3 },
                  { id: 'h9', name: 'Saka', number: 7, position: 'FW', avatar: '', rating: 8.8 },
                  { id: 'h10', name: 'Jesus', number: 9, position: 'FW', avatar: '', rating: 7.1 },
                  { id: 'h11', name: 'Martinelli', number: 11, position: 'FW', avatar: '', rating: 7.4 }
              ],
              subs: [
                  { id: 'hs1', name: 'Ramsdale', number: 1, position: 'GK', avatar: '' },
                  { id: 'hs2', name: 'Trossard', number: 19, position: 'FW', avatar: '' },
                  { id: 'hs3', name: 'Jorginho', number: 20, position: 'MF', avatar: '' },
                  { id: 'hs4', name: 'Smith Rowe', number: 10, position: 'MF', avatar: '' },
              ]
          },
          away: {
              formation: "4-2-3-1",
              coach: "Mauricio Pochettino",
              starting: [
                  { id: 'a1', name: 'Petrovic', number: 28, position: 'GK', avatar: '', rating: 6.5 },
                  { id: 'a2', name: 'Gusto', number: 27, position: 'DF', avatar: '', rating: 6.2 },
                  { id: 'a3', name: 'Disasi', number: 2, position: 'DF', avatar: '', rating: 6.4 },
                  { id: 'a4', name: 'Silva', number: 6, position: 'DF', avatar: '', rating: 6.7 },
                  { id: 'a5', name: 'Chilwell', number: 21, position: 'DF', avatar: '', rating: 6.3 },
                  { id: 'a6', name: 'Caicedo', number: 25, position: 'MF', avatar: '', rating: 7.0 },
                  { id: 'a7', name: 'Enzo', number: 8, position: 'MF', avatar: '', rating: 7.2 },
                  { id: 'a8', name: 'Palmer', number: 20, position: 'MF', avatar: '', rating: 8.9 },
                  { id: 'a9', name: 'Gallagher', number: 23, position: 'MF', avatar: '', rating: 6.9, isCaptain: true },
                  { id: 'a10', name: 'Sterling', number: 7, position: 'MF', avatar: '', rating: 6.5 },
                  { id: 'a11', name: 'Jackson', number: 15, position: 'FW', avatar: '', rating: 6.6 }
              ],
              subs: [
                   { id: 'as1', name: 'Sanchez', number: 1, position: 'GK', avatar: '' },
                   { id: 'as2', name: 'Mudryk', number: 10, position: 'FW', avatar: '' },
                   { id: 'as3', name: 'Madueke', number: 11, position: 'FW', avatar: '' }
              ]
          }
      },
      timeline: [
           { id: 'tl_end', type: 'PERIOD', minute: "FT", description: "Match Ended 3-1", teamId: '' },
           { id: 'tl_g3', type: 'GOAL', minute: "88'", player: "Leandro Trossard", description: "Trossard seals it! A calm finish through the keepers legs.", mediaUrl: "https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=500", teamId: 't5' },
           { id: 'tl_s1', type: 'SUB', minute: "82'", description: "Substitution Arsenal. Trossard ON, Martinelli OFF.", player: "Trossard", subPlayer: "Martinelli", teamId: 't5' },
           { id: 'tl_c1', type: 'CARD', minute: "74'", player: "Moises Caicedo", description: "Yellow Card for a late tackle on Odegaard.", teamId: 't6' },
           { id: 'tl_g2', type: 'GOAL', minute: "67'", player: "Cole Palmer", description: "Goal! Palmer pulls one back with a stunning curler.", teamId: 't6' },
           { id: 'tl_ht', type: 'PERIOD', minute: "HT", description: "Half Time 2-0", teamId: '' },
           { id: 'tl_g1', type: 'GOAL', minute: "34'", player: "Bukayo Saka", description: "GOAL! Saka converts the penalty after being brought down.", teamId: 't5' },
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
      ],
      comments: [
           { id: 'c1', userId: 'u10', userName: 'Gooner4Life', userAvatar: 'https://ui-avatars.com/api/?name=G4L&background=EF0107&color=fff', text: 'This is our year! Chelsea look lost.', timestamp: Date.now() - 3600000, likes: 212, teamSupport: 'HOME', isPro: true },
           { id: 'c2', userId: 'u11', userName: 'BlueBlood', userAvatar: 'https://ui-avatars.com/api/?name=BB&background=034694&color=fff', text: 'Wait until Nkunku is back. We will cook.', timestamp: Date.now() - 1800000, likes: 54, teamSupport: 'AWAY' }
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
    const [pwezaPrompt, setPwezaPrompt] = useState<string | null>(null);
    const [flashAlert, setFlashAlert] = useState<FlashAlert | null>(null);

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
        
        // TRIGGER DEMO FLASH ALERT ON LOAD
        setTimeout(() => {
            triggerFlashAlert({
                id: 'flash-demo',
                message: "⚡ MOMENTUM SHIFT: Patriots driving late in 4th!",
                type: 'MOMENTUM',
                matchId: 'm1'
            });
        }, 5000);

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

    const generateMkeka = (type: MkekaType) => {
        setBetSlip([]); // Clear current
        
        // Filter candidates based on Type
        let candidates = matches.filter(m => m.prediction);

        if (type === 'SAFE') {
            // High confidence, low odds (simulated by finding >70% confidence)
            candidates = candidates.filter(m => (m.prediction?.confidence || 0) > 70);
        } else if (type === 'LONGSHOT') {
            // Risky bets (lower confidence but high return)
            candidates = candidates.filter(m => (m.prediction?.confidence || 0) < 70 && m.prediction?.isValuePick);
        } else if (type === 'GOALS') {
             // Mock Goal Fest logic (Usually would check for Over 2.5 markets)
             // For now just pick high scoring predicted games
             candidates = candidates.filter(m => (m.prediction?.xG?.home || 0) + (m.prediction?.xG?.away || 0) > 3);
        }

        // Shuffle
        candidates.sort(() => 0.5 - Math.random());
        
        // Take top 3-5
        const selection = candidates.slice(0, Math.min(candidates.length, 4));
        selection.forEach(m => addToSlip(m));
    };

    // --- CMS ACTIONS ---
    const addNewsStory = (story: NewsStory) => {
        setNews(prev => [story, ...prev]);
    };

    const addSystemAlert = (alert: SystemAlert) => {
        setAlerts(prev => [alert, ...prev]);
    };

    // --- FLASH ALERTS ---
    const triggerFlashAlert = (alert: FlashAlert) => {
        setFlashAlert(alert);
        // Auto dismiss after 5s
        setTimeout(() => setFlashAlert(null), 5000);
    };

    // --- COMMUNITY ---
    const addComment = (matchId: string, text: string, teamSupport?: 'HOME' | 'AWAY') => {
        if (!user) return;
        
        const newComment: Comment = {
            id: `c_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            isPro: user.isPro,
            text,
            timestamp: Date.now(),
            likes: 0,
            teamSupport
        };

        setMatches(prev => prev.map(m => {
            if (m.id === matchId) {
                return { ...m, comments: [newComment, ...(m.comments || [])] };
            }
            return m;
        }));
    };

    // --- PWEZA MANAGEMENT ---
    const handleSetIsPwezaOpen = (open: boolean, prompt?: string) => {
        setIsPwezaOpen(open);
        if (open && prompt) {
            setPwezaPrompt(prompt);
        } else if (!open) {
            setPwezaPrompt(null);
        }
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
            flashAlert,
            addToSlip,
            removeFromSlip,
            clearSlip,
            addRandomPick,
            generateMkeka, 
            addComment,
            triggerFlashAlert,
            addNewsStory,
            addSystemAlert,
            isPwezaOpen,
            pwezaPrompt,
            setIsPwezaOpen: handleSetIsPwezaOpen
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