

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

export interface MatchStats {
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  corners?: { home: number; away: number };
  fouls?: { home: number; away: number };
  yellowCards?: { home: number; away: number };
  passAccuracy?: { home: number; away: number };
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
  description: string; // Text content or commentary
  mediaUrl?: string; // Video or Image URL
  source?: string; // e.g. "@BRFootball" or "Official Feed"
  avatar?: string; // Author avatar for social posts
  likes?: number;
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
  
  // New Betting/Engagement Fields
  isValuePick?: boolean;
  potentialReturn?: string; // e.g. "+140" or "2.40"
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
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
  keyPlayers?: { home: Player[]; away: Player[] };
  videos?: MatchVideo[];
  timeline?: TimelineEvent[]; // New Social/Match Feed
  
  // Robustness Features
  standings?: Standing[]; // Contextual table
  bettingTrends?: BettingTrends;
}

export interface NewsStory {
  id: string;
  type: 'NEWS' | 'HIGHLIGHT' | 'RUMOR' | 'SOCIAL';
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  authorAvatar?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isHero?: boolean;
  tags?: string[];
  body?: string[]; // Array of paragraphs/html for the full article
  relatedIds?: string[]; // IDs of related stories
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
}

export type FeedItem = Match | NewsStory | SystemAlert;

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}