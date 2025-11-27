







export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED'
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  record?: string; // e.g. "14-2-4"
  form?: string[]; // e.g. ['W', 'L', 'D', 'W', 'W']
  rank?: number; // e.g. 1, 4, 25 (null if unranked)
}

export interface Standing {
  rank: number;
  teamId: string;
  teamName: string;
  logo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  form: string[]; // ['W', 'L', 'D']
}

export interface BettingTrends {
  homeMoneyPercent: number; // e.g. 65% of cash on home
  homeTicketPercent: number; // e.g. 40% of bets on home (indicates sharp money if diff is high)
  lineMovement: 'OPENING' | 'DRIFTING_HOME' | 'DRIFTING_AWAY' | 'STABLE';
  publicConsensus: string; // "Heavy Public on Over"
}

export interface Player {
  id: string;
  name: string;
  avatar: string; // URL
  number: number;
  position: string;
  rating?: number; // 1-10
  stats?: { label: string; value: string | number }[]; // e.g. [{label: 'G', value: 1}, {label: 'A', value: 1}]
}

// NEW: Lineup Types for Visual Pitch
export interface LineupPlayer {
    id: string;
    name: string;
    number: number;
    position: string; // 'GK', 'CB', 'CM', 'ST' etc
    avatar: string;
    rating?: number;
    isCaptain?: boolean;
    events?: { type: 'GOAL' | 'CARD' | 'SUB_OUT' | 'SUB_IN'; minute: string }[];
}
  
export interface TeamLineup {
    formation: string; // "4-3-3"
    starting: LineupPlayer[];
    subs: LineupPlayer[];
    coach: string;
}

export interface BoxScorePlayer {
    id: string;
    name: string;
    minutes?: string;
    stats: Record<string, string | number>; // Dynamic: { PTS: 24, AST: 5 } or { G: 1, A: 0 }
}

export interface BoxScore {
    headers: string[]; // ['MIN', 'PTS', 'REB', 'AST']
    home: BoxScorePlayer[];
    away: BoxScorePlayer[];
}

export interface MatchStats {
  // General
  possession?: { home: number; away: number };
  expectedGoals?: { home: number; away: number }; // xG
  
  // Attack
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  shotsOffTarget?: { home: number; away: number };
  shotsBlocked?: { home: number; away: number };
  shotsInsideBox?: { home: number; away: number };
  shotsOutsideBox?: { home: number; away: number };
  bigChances?: { home: number; away: number };
  hitWoodwork?: { home: number; away: number };
  
  // Distribution
  passAccuracy?: { home: number; away: number };
  passes?: { home: number; away: number }; // Total Passes
  passesCompleted?: { home: number; away: number };
  longBalls?: { home: number; away: number }; // % Success or count
  crosses?: { home: number; away: number }; // % Success or count
  
  // Defense
  tackles?: { home: number; away: number };
  interceptions?: { home: number; away: number };
  clearances?: { home: number; away: number };
  saves?: { home: number; away: number };
  
  // Discipline & Other
  corners?: { home: number; away: number };
  fouls?: { home: number; away: number };
  yellowCards?: { home: number; away: number };
  redCards?: { home: number; away: number };
  offsides?: { home: number; away: number };
}

export interface MatchVideo {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  type: 'GOAL' | 'HIGHLIGHT' | 'INTERVIEW';
}

export interface VenueDetails {
  capacity: string;
  opened?: string;
  city: string;
  country: string;
  imageUrl: string;
  description: string;
  mapUrl?: string; // static map image URL
}

export interface TimelineEvent {
  id: string;
  type: 'GOAL' | 'CARD' | 'SUB' | 'SOCIAL' | 'PERIOD' | 'INJURY';
  minute: string; // "67'" or "Pre-Match"
  teamId?: string; // ID of the team involved
  player?: string; // Name of main actor
  subPlayer?: string; // For Subs
  description: string; // Text content or commentary
  mediaUrl?: string; // Video or Image URL
  source?: string; // e.g. "@BRFootball" or "Official Feed"
  avatar?: string; // Author avatar for social posts
  likes?: number;
}

export interface PredictionFactor {
    label: string; // e.g. "Home Form", "Sharp Money", "Injury Impact"
    weight: number; // e.g. +15 or -5 (Impact on score)
    description: string; // "Arsenal averaged 2.8 goals at home"
    type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface Prediction {
  outcome: 'HOME' | 'DRAW' | 'AWAY';
  confidence: number; // 0-100
  scorePrediction: string;
  aiReasoning: string;
  keyInsight: string;
  bettingAngle?: string;
  odds?: { home: number; draw: number; away: number };
  xG?: { home: number; away: number };
  injuries?: string[];
  weather?: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  probability?: { home: number; draw: number; away: number }; // Visual bars
  
  // New Deep Data
  factors?: PredictionFactor[]; // The "Brain" breakdown
  modelEdge?: number; // e.g. 5.2% edge over bookies
  systemRecord?: string; // e.g. "8-2 L10"
  
  // New Betting/Engagement Fields
  isValuePick?: boolean;
  potentialReturn?: string; // e.g. "+140" or "2.40"
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
  isPro?: boolean;
  likes: number;
  teamSupport?: 'HOME' | 'AWAY';
}

export interface MatchContext {
  headline?: string;
  injuryReport?: string;
  commentCount?: number;
  isHot?: boolean;
}

export interface Match {
  id: string;
  league: string;
  homeTeam: Team;
  awayTeam: Team;
  status: MatchStatus;
  time: string; // "14:00" or "34'"
  score?: { home: number; away: number };
  prediction?: Prediction;
  context?: MatchContext;
  trending?: boolean;
  broadcaster?: string;
  
  // New Details
  venue?: string;
  venueDetails?: VenueDetails;
  referee?: string;
  attendance?: string;
  stats?: MatchStats;
  keyPlayers?: { home: Player[]; away: Player[] }; // Deprecated favor of lineups for Lineup View
  lineups?: { home: TeamLineup; away: TeamLineup }; // NEW: Full Lineups
  videos?: MatchVideo[];
  timeline?: TimelineEvent[]; // New Social/Match Feed
  
  // Robustness Features
  standings?: Standing[]; // Contextual table
  bettingTrends?: BettingTrends;
  boxScore?: BoxScore; // NEW: Detailed Box Score
  momentum?: { home: number; away: number }; // New: Live Pressure Index (0-100)
  comments?: Comment[]; // NEW: Fan Community
}

// --- RICH CONTENT BLOCKS ---
export type ArticleBlock = 
  | { type: 'TEXT'; content: string }
  | { type: 'IMAGE'; url: string; caption?: string }
  | { type: 'TWEET'; id: string; url?: string; author: string; handle: string; text: string; avatar?: string }
  | { type: 'QUOTE'; text: string; author: string; role?: string }
  | { type: 'VIDEO'; url: string; thumbnail: string; title?: string };

export interface NewsStory {
  id: string;
  type: 'NEWS' | 'HIGHLIGHT' | 'RUMOR' | 'SOCIAL';
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  author?: string;
  authorAvatar?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isHero?: boolean;
  tags?: string[];
  
  // UPDATED: Rich Content
  contentBlocks?: ArticleBlock[]; 
  relatedIds?: string[]; // IDs of related stories
  
  // Legacy support (optional)
  body?: string[]; 
}

// NEW: System Intelligence Alerts for the Feed
export interface SystemAlert {
  id: string;
  type: 'SYSTEM_ALERT';
  alertType: 'SHARP_MONEY' | 'LINE_MOVE' | 'INJURY_CRITICAL' | 'TRENDING_PROP';
  title: string;
  description: string;
  dataPoint: string; // e.g., "88% Money"
  league: string;
  timestamp: string;
  relatedMatchId?: string;
  signalStrength?: 'HIGH' | 'MEDIUM' | 'LOW';
  actionableBet?: string; // e.g. "Bet Arsenal -0.5"
}

export interface FlashAlert {
  id: string;
  message: string;
  type: 'MOMENTUM' | 'VALUE' | 'GOAL';
  matchId?: string;
}

export interface BetSlipItem {
    id: string;
    matchId: string;
    matchUp: string; // e.g. "Arsenal vs Chelsea"
    selection: string; // e.g. "Arsenal" or "Over 2.5"
    odds: number; // Decimal format e.g. 1.95
    outcome: 'HOME' | 'DRAW' | 'AWAY';
    timestamp: number;
    confidence?: number;
    status?: 'PENDING' | 'WON' | 'LOST'; // For history tracking
    wager?: number;
    payout?: number;
}

export type FeedItem = Match | NewsStory | SystemAlert;

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- USER PROFILE TYPES ---
export interface UserPreferences {
    favoriteLeagues: string[];
    favoriteTeams: string[]; // Team IDs
    followedSources?: string[]; // NEW: Follow specific journalists/sources
    notifications: {
        gameStart: boolean;
        scoreUpdates: boolean;
        lineMoves: boolean; // Premium feature?
        breakingNews: boolean;
        whatsappUpdates: boolean; // NEW: WhatsApp integration
    };
    communicationChannel: 'EMAIL' | 'WHATSAPP' | 'BOTH'; // NEW
    whatsappNumber?: string; // NEW
    oddsFormat: 'DECIMAL' | 'AMERICAN'; // NEW: Localization
    dataSaver: boolean; // NEW: Data Saver Mode
    theme: 'LIGHT' | 'DARK'; // NEW: Theme Switching
    hasCompletedOnboarding: boolean;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string;
    isPro: boolean;
    stats: {
        betsPlaced: number;
        wins: number;
        losses: number;
        winRate: number; // Percentage
        netProfit: number; // Virtual currency/tracking
    };
    preferences: UserPreferences;
    isAdmin?: boolean; // For CMS access
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    userAvatar: string;
    winRate: number;
    netProfit: number;
    isPro?: boolean;
    streak?: number;
}

export type AuthState = 'UNAUTHENTICATED' | 'ONBOARDING' | 'AUTHENTICATED' | 'GUEST';

export type MkekaType = 'SAFE' | 'LONGSHOT' | 'GOALS';

// --- CONTEXT TYPE ---
export interface SportsContextType {
    user: UserProfile | null;
    authState: AuthState;
    login: (email: string) => void;
    loginAsGuest: () => void; // NEW
    logout: () => void;
    completeOnboarding: (prefs: { leagues: string[], teams: string[] }) => void;
    updatePreferences: (prefs: Partial<UserPreferences>) => void; // NEW
    
    matches: Match[];
    news: NewsStory[];
    alerts: SystemAlert[];
    feedItems: FeedItem[];
    betSlip: BetSlipItem[];
    flashAlert: FlashAlert | null; 
    leaderboard: LeaderboardEntry[]; // NEW
    
    addToSlip: (match: Match) => void;
    removeFromSlip: (id: string) => void;
    clearSlip: () => void;
    addRandomPick: () => void;
    generateMkeka: (type: MkekaType) => void; 
    
    // Community & Alerts
    addComment: (matchId: string, text: string, teamSupport?: 'HOME' | 'AWAY') => void;
    triggerFlashAlert: (alert: FlashAlert) => void;

    // Admin / CMS Actions
    addNewsStory: (story: NewsStory) => void;
    addSystemAlert: (alert: SystemAlert) => void;
    deleteNewsStory: (id: string) => void; // NEW
    deleteSystemAlert: (id: string) => void; // NEW
    
    isPwezaOpen: boolean;
    pwezaPrompt: string | null;
    setIsPwezaOpen: (open: boolean, prompt?: string) => void;
}