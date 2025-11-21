
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
  trending?: boolean;
  broadcaster?: string;
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
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
