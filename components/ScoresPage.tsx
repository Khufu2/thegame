
import React, { useState, useMemo } from 'react';
import { Match, MatchStatus } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Star, Search, Filter, Circle, Clock, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScoresPageProps {
  matches: Match[];
  onOpenPweza: (prompt?: string) => void;
}

const DATES = [
    { label: 'YEST', date: 'Yesterday' },
    { label: 'TODAY', date: 'Today', active: true },
    { label: 'TOM', date: 'Tomorrow' },
];

export const ScoresPage: React.FC<ScoresPageProps> = ({ matches, onOpenPweza }) => {
   const navigate = useNavigate();
   const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'FAVORITES'>('ALL');
   const [activeDate, setActiveDate] = useState('Today');

   // Generate date range like Bleacher Report / 365Scores
   const generateDateRange = () => {
       const now = new Date();
       const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
       
       const dates: { label: string; date: string; dateObj: Date; isToday?: boolean }[] = [];
       
       // Past 3 days + Today + Next 4 days = 8 days total
       for (let i = -3; i <= 4; i++) {
           const dateObj = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
           let label: string;
           let dateLabel: string;
           
           if (i === -1) {
               label = 'YEST';
               dateLabel = 'Yesterday';
           } else if (i === 0) {
               label = 'TODAY';
               dateLabel = 'Today';
           } else if (i === 1) {
               label = 'TOM';
               dateLabel = 'Tomorrow';
           } else {
               label = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3);
               dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
           }
           
           dates.push({ label, date: dateLabel, dateObj, isToday: i === 0 });
       }
       
       return dates;
   };

   const dynamicDates = generateDateRange();

  // Helper to parse match time safely
  const parseMatchDate = (timeStr: string | undefined | null): Date | null => {
    if (!timeStr) return null;
    try {
      let date: Date;
      if (timeStr.includes('T')) {
        date = new Date(timeStr.endsWith('Z') ? timeStr : timeStr + 'Z');
      } else if (timeStr.includes('-') && timeStr.length === 10) {
        date = new Date(timeStr + 'T12:00:00Z');
      } else {
        date = new Date(timeStr);
      }
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  // 1. Filter & Group Matches
  const groupedMatches = useMemo(() => {
    // Ensure matches is always an array
    const safeMatches = Array.isArray(matches) ? matches : [];
    let filtered = safeMatches;

    // Filter by Status
    if (filter === 'LIVE') {
        filtered = filtered.filter(m => m.status === MatchStatus.LIVE);
    }

    // Filter by Date - always apply date filter
    const targetDateEntry = dynamicDates.find(d => d.date === activeDate);
    if (targetDateEntry) {
        const targetDate = targetDateEntry.dateObj;
        filtered = filtered.filter(match => {
            const matchDate = parseMatchDate(match.time);
            if (!matchDate) return activeDate === 'Today'; // Show timeless matches on Today
            
            const matchLocal = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
            const targetLocal = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            return matchLocal.getTime() === targetLocal.getTime();
        });
    }

    // Group by League and sort within each league
    const groups: Record<string, Match[]> = {};
    filtered.forEach(match => {
        if (!groups[match.league]) {
            groups[match.league] = [];
        }
        groups[match.league].push(match);
    });

    // Sort matches within each league by kickoff time
    Object.keys(groups).forEach(league => {
        groups[league].sort((a, b) => {
            const dateA = parseMatchDate(a.time);
            const dateB = parseMatchDate(b.time);
            return (dateA?.getTime() ?? 0) - (dateB?.getTime() ?? 0);
        });
    });

    return groups;
  }, [matches, filter, activeDate, dynamicDates]);

  const leagueKeys = Object.keys(groupedMatches);

  const handlePwezaClick = (match: Match) => {
      const prompt = `Give me a quick 50-word sharp betting insight for ${match.homeTeam.name} vs ${match.awayTeam.name}. Focus on value and key stats.`;
      onOpenPweza(prompt);
  };

  return (
    <div className="min-h-screen bg-black pb-24 text-white font-sans">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C]">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 h-[50px]">
              <h1 className="font-condensed font-black text-2xl uppercase italic tracking-tighter">Scores</h1>
              <div className="flex items-center gap-4">
                  <button className="text-gray-400 hover:text-white transition-colors">
                      <Search size={20} />
                  </button>
                  <button className="text-gray-400 hover:text-white transition-colors">
                      <Calendar size={20} />
                  </button>
              </div>
          </div>

          {/* Date Strip */}
          <div className="flex items-center border-t border-[#2C2C2C] bg-[#0A0A0A]">
              <div className="flex-1 overflow-x-auto no-scrollbar flex items-center">
                  {dynamicDates.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveDate(d.date)}
                        className={`
                            flex flex-col items-center justify-center min-w-[60px] h-[50px] relative
                            ${activeDate === d.date ? 'bg-[#1E1E1E]' : 'hover:bg-[#1E1E1E]/50'}
                        `}
                      >
                          <span className={`text-[10px] font-bold uppercase ${activeDate === d.date ? 'text-indigo-400' : 'text-gray-500'}`}>{d.label}</span>
                          <span className={`text-xs font-bold ${activeDate === d.date ? 'text-white' : 'text-gray-400'}`}>{d.date}</span>
                          {activeDate === d.date && <div className="absolute bottom-0 w-full h-[2px] bg-indigo-500"></div>}
                      </button>
                  ))}
              </div>
          </div>

          {/* Filter Tabs (All / Live) */}
          <div className="flex items-center gap-1 p-2 bg-[#000000]">
              <FilterTab label="All Games" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
              <FilterTab label="Live" active={filter === 'LIVE'} count={Array.isArray(matches) ? matches.filter(m => m.status === 'LIVE').length : 0} onClick={() => setFilter('LIVE')} isLive />
              <FilterTab label="Favorites" active={filter === 'FAVORITES'} icon={<Star size={10} />} onClick={() => setFilter('FAVORITES')} />
          </div>
      </div>

      {/* 2. MATCH LIST */}
      <div className="px-0 md:max-w-[800px] md:mx-auto">
          {leagueKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
                  <Calendar size={40} className="opacity-20" />
                  <span className="font-condensed font-bold uppercase tracking-wide">No matches scheduled</span>
              </div>
          ) : (
              leagueKeys.map(league => (
                  <LeagueGroup 
                    key={league} 
                    league={league} 
                    matches={groupedMatches[league]} 
                    onMatchClick={(id) => navigate(`/match/${id}`)}
                    onPwezaClick={handlePwezaClick}
                  />
              ))
          )}
      </div>

      {/* Floating Pweza FAB (Mobile Fallback) */}
      <button 
        onClick={() => onOpenPweza()}
        className="fixed bottom-[80px] right-4 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center z-30 transition-transform active:scale-95 md:hidden"
      >
          <span className="text-xl">🐙</span>
      </button>

    </div>
  );
};

// --- SUB-COMPONENTS ---

interface FilterTabProps {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  isLive?: boolean;
  icon?: React.ReactNode;
}

const FilterTab: React.FC<FilterTabProps> = ({ label, active, count, onClick, isLive, icon }) => (
    <button 
        onClick={onClick}
        className={`
            flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all
            ${active 
                ? 'bg-white text-black border-white' 
                : 'bg-[#121212] text-gray-400 border-[#2C2C2C] hover:border-gray-500'
            }
        `}
    >
        {isLive && <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-red-500' : 'bg-red-500'} animate-pulse`}></div>}
        {icon}
        {label}
        {count !== undefined && <span className="opacity-60 text-[10px] ml-0.5">({count})</span>}
    </button>
);

interface LeagueGroupProps {
  league: string;
  matches: Match[];
  onMatchClick: (id: string) => void;
  onPwezaClick: (match: Match) => void;
}

const LeagueGroup: React.FC<LeagueGroupProps> = ({ league, matches, onMatchClick, onPwezaClick }) => {
    return (
        <div className="mb-2">
            {/* Sticky League Header */}
            <div className="sticky top-[102px] z-30 flex items-center gap-3 px-4 py-2 bg-[#1A1A1A] border-y border-[#2C2C2C] shadow-sm">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center p-0.5">
                    {/* Placeholder for League Logo logic */}
                    <span className="text-[9px] font-black">{league.substring(0,1)}</span>
                </div>
                <span className="font-condensed font-bold text-sm text-gray-200 uppercase tracking-wide">{league}</span>
                <ChevronRight size={14} className="text-gray-500 ml-auto" />
            </div>
            
            {/* Matches */}
            <div>
                {matches.map((match, idx) => (
                    <ScoreRow 
                        key={match.id} 
                        match={match} 
                        isLast={idx === matches.length - 1} 
                        onClick={() => onMatchClick(match.id)}
                        onPwezaClick={() => onPwezaClick(match)}
                    />
                ))}
            </div>
        </div>
    )
};

interface ScoreRowProps {
  match: Match;
  isLast: boolean;
  onClick: () => void;
  onPwezaClick: () => void;
}

const ScoreRow: React.FC<ScoreRowProps> = ({ match, isLast, onClick, onPwezaClick }) => {
    const isLive = match.status === MatchStatus.LIVE;
    // Handle both score formats: { home, away } and { fullTime: { home, away } }
    const homeScore = (match.score as any)?.fullTime?.home ?? match.score?.home;
    const awayScore = (match.score as any)?.fullTime?.away ?? match.score?.away;
    const isWinnerHome = homeScore != null && awayScore != null && homeScore > awayScore;
    const isWinnerAway = homeScore != null && awayScore != null && awayScore > homeScore;

    // Convert UTC time to user's local timezone
    const formatLocalTime = (utcTimeStr: string | undefined | null): string => {
        if (!utcTimeStr) return '--:--';
        try {
            let utcDate: Date;
            
            // Handle ISO format with timezone offset like "2024-12-05T19:30:00+00:00"
            if (utcTimeStr.includes('T') && (utcTimeStr.includes('+') || utcTimeStr.endsWith('Z'))) {
                utcDate = new Date(utcTimeStr);
            }
            // Handle ISO format without timezone like "2024-12-05T19:30:00"
            else if (utcTimeStr.includes('T')) {
                utcDate = new Date(utcTimeStr + 'Z');
            } 
            // Handle simple time format like "19:30"
            else if (utcTimeStr.includes(':') && utcTimeStr.length <= 5) {
                const today = new Date();
                const [hours, minutes] = utcTimeStr.split(':').map(Number);
                if (isNaN(hours) || isNaN(minutes)) return utcTimeStr;
                utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0));
            }
            // Handle date string like "2024-12-05"
            else if (utcTimeStr.includes('-') && utcTimeStr.length === 10) {
                return 'TBD';
            }
            else {
                // Try parsing as-is
                utcDate = new Date(utcTimeStr);
            }

            // Validate the date
            if (isNaN(utcDate.getTime())) {
                return '--:--';
            }

            return utcDate.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
        } catch {
            return '--:--';
        }
    };

    return (
        <div onClick={onClick} className={`bg-[#000000] hover:bg-[#0A0A0A] transition-colors cursor-pointer flex items-center py-3 px-4 ${!isLast ? 'border-b border-[#1E1E1E]' : ''}`}>
            
            {/* Left: Time */}
            <div className="w-[50px] flex flex-col items-center justify-center border-r border-[#1E1E1E] pr-3 mr-3 shrink-0">
                {isLive ? (
                    <>
                        <span className="text-[10px] font-black text-red-500 uppercase">Live</span>
                        <span className="text-xs font-bold text-red-500">{formatLocalTime(match.time)}</span>
                    </>
                ) : match.status === 'FINISHED' ? (
                    <>
                        <span className="text-[10px] font-black text-gray-500 uppercase">FT</span>
                        <span className="text-xs font-bold text-gray-500">Final</span>
                    </>
                ) : (
                    <span className="text-xs font-bold text-blue-400">{formatLocalTime(match.time)}</span>
                )}
            </div>

            {/* Middle: Teams */}
            <div className="flex-1 flex flex-col gap-2 relative">
                {match.status === 'SCHEDULED' && (
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <span className="bg-black text-white px-2 py-1 rounded font-bold text-xs border border-gray-600">VS</span>
                    </div>
                )}
                {/* Home Team */}
                <div className="flex items-center justify-between h-[20px]">
                    <div className="flex items-center gap-3">
                        {(match.homeTeam.logo || (match.homeTeam as any).crest) ? (
                            <img src={match.homeTeam.logo || (match.homeTeam as any).crest} className="w-5 h-5 object-contain" alt={match.homeTeam.name} />
                        ) : (
                            <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {match.homeTeam.name.charAt(0)}
                            </div>
                        )}
                        <span className={`font-condensed font-bold text-[15px] uppercase ${isWinnerHome || homeScore == null ? 'text-white' : 'text-gray-500'}`}>
                            {match.homeTeam.name}
                        </span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${isLive ? 'text-red-500' : 'text-white'}`}>
                        {match.status === 'SCHEDULED' ? '-' : (homeScore ?? '-')}
                    </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between h-[20px]">
                     <div className="flex items-center gap-3">
                        {(match.awayTeam.logo || (match.awayTeam as any).crest) ? (
                            <img src={match.awayTeam.logo || (match.awayTeam as any).crest} className="w-5 h-5 object-contain" alt={match.awayTeam.name} />
                        ) : (
                            <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {match.awayTeam.name.charAt(0)}
                            </div>
                        )}
                        <span className={`font-condensed font-bold text-[15px] uppercase ${isWinnerAway || awayScore == null ? 'text-white' : 'text-gray-500'}`}>
                            {match.awayTeam.name}
                        </span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${isLive ? 'text-red-500' : 'text-white'}`}>
                        {match.status === 'SCHEDULED' ? '-' : (awayScore ?? '-')}
                    </span>
                </div>
            </div>

            {/* Right: Actions/Context */}
            <div className="pl-4 ml-2 border-l border-[#1E1E1E] flex flex-col items-center gap-1 justify-center shrink-0 w-[40px]">
                 <button onClick={(e) => e.stopPropagation()} className="text-gray-600 hover:text-yellow-500 transition-colors">
                     <Star size={16} />
                 </button>
                 
                 {/* PWEZA BUTTON ADDED */}
                 <button onClick={(e) => { e.stopPropagation(); onPwezaClick(); }} className="mt-2 w-6 h-6 rounded-full bg-indigo-600/20 hover:bg-indigo-600 flex items-center justify-center transition-colors group">
                     <span className="text-xs group-hover:text-white">🐙</span>
                 </button>
            </div>

        </div>
    )
};
