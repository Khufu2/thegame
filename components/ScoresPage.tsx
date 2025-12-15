
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Match, MatchStatus } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Star, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScoresPageProps {
  matches: Match[];
  onOpenPweza: (prompt?: string) => void;
}

export const ScoresPage: React.FC<ScoresPageProps> = ({ matches: initialMatches, onOpenPweza }) => {
   const navigate = useNavigate();
   const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'FAVORITES'>('ALL');
   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
   const [matches, setMatches] = useState<Match[]>(initialMatches);
   const [loading, setLoading] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [showSearch, setShowSearch] = useState(false);
   const [showCalendar, setShowCalendar] = useState(false);

   // Generate date range for the date strip
   const generateDateRange = useCallback(() => {
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       
       const dates: { label: string; dateStr: string; dateObj: Date; isToday: boolean }[] = [];
       
       // Past 3 days + Today + Next 4 days
       for (let i = -3; i <= 4; i++) {
           const dateObj = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
           let label: string;
           
           if (i === -1) {
               label = 'YEST';
           } else if (i === 0) {
               label = 'TODAY';
           } else if (i === 1) {
               label = 'TOM';
           } else {
               label = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3);
           }
           
           const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
           dates.push({ label, dateStr, dateObj, isToday: i === 0 });
       }
       
       return dates;
   }, []);

   const dynamicDates = useMemo(() => generateDateRange(), [generateDateRange]);

   // Format date for display
   const formatDateDisplay = (date: Date) => {
       return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
   };

   // Check if a date matches the selected date
   const isSelectedDate = (dateObj: Date) => {
       return dateObj.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
   };

   // Fetch matches for selected date
   const fetchMatchesForDate = useCallback(async (date: Date) => {
       setLoading(true);
       try {
           const dateStr = date.toISOString().split('T')[0];
           console.log('Fetching matches for date:', dateStr);
           
           const response = await fetch(
               `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/get-matches?date=${dateStr}&limit=200`,
               {
                   headers: {
                       'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA`,
                       'Content-Type': 'application/json'
                   }
               }
           );
           
           if (!response.ok) throw new Error('Failed to fetch matches');
           
           const matchesData = await response.json();
           console.log(`Fetched ${matchesData.length} matches for ${dateStr}`);
           setMatches(Array.isArray(matchesData) ? matchesData : []);
       } catch (error) {
           console.error('Error fetching matches:', error);
           setMatches([]);
       } finally {
           setLoading(false);
       }
   }, []);

   // Fetch on date change
   useEffect(() => {
       fetchMatchesForDate(selectedDate);
   }, [selectedDate, fetchMatchesForDate]);

   // Filter matches by search query and status
   const groupedMatches = useMemo(() => {
       let filtered = Array.isArray(matches) ? matches : [];

       // Filter by search query
       if (searchQuery.trim()) {
           const query = searchQuery.toLowerCase();
           filtered = filtered.filter(m => 
               m.homeTeam?.name?.toLowerCase().includes(query) ||
               m.awayTeam?.name?.toLowerCase().includes(query) ||
               m.league?.toLowerCase().includes(query)
           );
       }

       // Filter by status
       if (filter === 'LIVE') {
           filtered = filtered.filter(m => m.status === MatchStatus.LIVE || m.status === 'LIVE');
       }

       // Group by league
       const groups: Record<string, Match[]> = {};
       filtered.forEach(match => {
           const league = match.league || 'Other';
           if (!groups[league]) groups[league] = [];
           groups[league].push(match);
       });

       // Sort matches within each league by kickoff time
       Object.keys(groups).forEach(league => {
           groups[league].sort((a, b) => {
               const dateA = new Date(a.time || (a as any).kickoff_time || 0).getTime();
               const dateB = new Date(b.time || (b as any).kickoff_time || 0).getTime();
               return dateA - dateB;
           });
       });

       return groups;
   }, [matches, filter, searchQuery]);

   const leagueKeys = Object.keys(groupedMatches);

   const handlePwezaClick = (match: Match) => {
       const prompt = `Give me a quick 50-word sharp betting insight for ${match.homeTeam.name} vs ${match.awayTeam.name}. Focus on value and key stats.`;
       onOpenPweza(prompt);
   };

   // Navigate to previous/next day
   const navigateDay = (direction: number) => {
       const newDate = new Date(selectedDate.getTime() + direction * 24 * 60 * 60 * 1000);
       setSelectedDate(newDate);
   };

   return (
     <div className="min-h-screen bg-black pb-24 text-white font-sans">
       
       {/* HEADER & CONTROLS */}
       <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C]">
           
           {/* Top Bar */}
           <div className="flex items-center justify-between px-4 h-[50px]">
               {showSearch ? (
                   <div className="flex-1 flex items-center gap-2">
                       <Search size={18} className="text-gray-400" />
                       <input
                           type="text"
                           placeholder="Search teams or leagues..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                           autoFocus
                       />
                       <button 
                           onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                           className="text-gray-400 hover:text-white p-1"
                       >
                           <X size={18} />
                       </button>
                   </div>
               ) : (
                   <>
                       <h1 className="font-condensed font-black text-2xl uppercase italic tracking-tighter">Scores</h1>
                       <div className="flex items-center gap-4">
                           <button 
                               onClick={() => setShowSearch(true)}
                               className="text-gray-400 hover:text-white transition-colors"
                           >
                               <Search size={20} />
                           </button>
                           <button 
                               onClick={() => setShowCalendar(!showCalendar)}
                               className={`transition-colors ${showCalendar ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                           >
                               <Calendar size={20} />
                           </button>
                       </div>
                   </>
               )}
           </div>

           {/* Calendar Date Picker */}
           {showCalendar && (
               <div className="px-4 py-3 bg-[#0A0A0A] border-t border-[#2C2C2C]">
                   <div className="flex items-center justify-between mb-2">
                       <button 
                           onClick={() => navigateDay(-7)}
                           className="text-gray-400 hover:text-white p-1"
                       >
                           <ChevronLeft size={20} />
                       </button>
                       <span className="text-sm font-bold text-white">
                           {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                       </span>
                       <button 
                           onClick={() => navigateDay(7)}
                           className="text-gray-400 hover:text-white p-1"
                       >
                           <ChevronRight size={20} />
                       </button>
                   </div>
                   <input
                       type="date"
                       value={selectedDate.toISOString().split('T')[0]}
                       onChange={(e) => {
                           if (e.target.value) {
                               setSelectedDate(new Date(e.target.value + 'T12:00:00'));
                               setShowCalendar(false);
                           }
                       }}
                       className="w-full bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white text-sm"
                   />
               </div>
           )}

           {/* Date Strip */}
           <div className="flex items-center border-t border-[#2C2C2C] bg-[#0A0A0A]">
               <button 
                   onClick={() => navigateDay(-1)}
                   className="px-2 py-3 text-gray-400 hover:text-white"
               >
                   <ChevronLeft size={18} />
               </button>
               <div className="flex-1 overflow-x-auto no-scrollbar flex items-center">
                   {dynamicDates.map((d, i) => (
                       <button
                         key={i}
                         onClick={() => setSelectedDate(d.dateObj)}
                         className={`
                             flex flex-col items-center justify-center min-w-[60px] h-[50px] relative
                             ${isSelectedDate(d.dateObj) ? 'bg-[#1E1E1E]' : 'hover:bg-[#1E1E1E]/50'}
                         `}
                       >
                           <span className={`text-[10px] font-bold uppercase ${isSelectedDate(d.dateObj) ? 'text-indigo-400' : 'text-gray-500'}`}>
                               {d.label}
                           </span>
                           <span className={`text-xs font-bold ${isSelectedDate(d.dateObj) ? 'text-white' : 'text-gray-400'}`}>
                               {formatDateDisplay(d.dateObj)}
                           </span>
                           {isSelectedDate(d.dateObj) && <div className="absolute bottom-0 w-full h-[2px] bg-indigo-500"></div>}
                       </button>
                   ))}
               </div>
               <button 
                   onClick={() => navigateDay(1)}
                   className="px-2 py-3 text-gray-400 hover:text-white"
               >
                   <ChevronRight size={18} />
               </button>
           </div>

           {/* Filter Tabs */}
           <div className="flex items-center gap-1 p-2 bg-[#000000]">
               <FilterTab label="All Games" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
               <FilterTab 
                   label="Live" 
                   active={filter === 'LIVE'} 
                   count={Array.isArray(matches) ? matches.filter(m => m.status === 'LIVE' || m.status === MatchStatus.LIVE).length : 0} 
                   onClick={() => setFilter('LIVE')} 
                   isLive 
               />
               <FilterTab label="Favorites" active={filter === 'FAVORITES'} icon={<Star size={10} />} onClick={() => setFilter('FAVORITES')} />
           </div>
       </div>

       {/* MATCH LIST */}
       <div className="px-0 md:max-w-[800px] md:mx-auto">
           {loading ? (
               <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
                   <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="font-condensed font-bold uppercase tracking-wide">Loading matches...</span>
               </div>
           ) : leagueKeys.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
                   <Calendar size={40} className="opacity-20" />
                   <span className="font-condensed font-bold uppercase tracking-wide">No matches for {formatDateDisplay(selectedDate)}</span>
                   <button 
                       onClick={() => setSelectedDate(new Date())}
                       className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                   >
                       Go to Today
                   </button>
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

       {/* Floating Pweza FAB */}
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
        {count !== undefined && count > 0 && <span className="opacity-60 text-[10px] ml-0.5">({count})</span>}
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
            {/* League Header */}
            <div className="sticky top-[152px] z-30 flex items-center gap-3 px-4 py-2 bg-[#1A1A1A] border-y border-[#2C2C2C] shadow-sm">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center p-0.5">
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

const ScoreRow: React.FC<ScoreRowProps> = ({ match, isLast, onClick }) => {
    const isLive = match.status === MatchStatus.LIVE || match.status === 'LIVE';
    const isFinished = match.status === 'FINISHED' || match.status === MatchStatus.FINISHED;
    
    const homeScore = (match.score as any)?.fullTime?.home ?? match.score?.home;
    const awayScore = (match.score as any)?.fullTime?.away ?? match.score?.away;
    const isWinnerHome = homeScore != null && awayScore != null && homeScore > awayScore;
    const isWinnerAway = homeScore != null && awayScore != null && awayScore > homeScore;

    const formatLocalTime = (utcTimeStr: string | undefined | null): string => {
        if (!utcTimeStr) return '--:--';
        try {
            const utcDate = new Date(utcTimeStr);
            if (isNaN(utcDate.getTime())) return '--:--';
            return utcDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch {
            return '--:--';
        }
    };

    return (
        <div onClick={onClick} className={`bg-[#000000] hover:bg-[#0A0A0A] transition-colors cursor-pointer flex items-center py-3 px-4 ${!isLast ? 'border-b border-[#1E1E1E]' : ''}`}>
            
            {/* Time */}
            <div className="w-[50px] flex flex-col items-center justify-center border-r border-[#1E1E1E] pr-3 mr-3 shrink-0">
                {isLive ? (
                    <>
                        <span className="text-[10px] font-black text-red-500 uppercase">Live</span>
                        <span className="text-xs font-bold text-red-500">{formatLocalTime(match.time || match.kickoff_time)}</span>
                    </>
                ) : isFinished ? (
                    <>
                        <span className="text-[10px] font-black text-gray-500 uppercase">FT</span>
                        <span className="text-xs font-bold text-gray-500">Final</span>
                    </>
                ) : (
                    <span className="text-xs font-bold text-blue-400">{formatLocalTime(match.time || match.kickoff_time)}</span>
                )}
            </div>

            {/* Teams */}
            <div className="flex-1 flex flex-col gap-2 relative">
                {!isLive && !isFinished && (
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <span className="bg-black text-white px-2 py-1 rounded font-bold text-xs border border-gray-600">VS</span>
                    </div>
                )}
                {/* Home Team */}
                <div className="flex items-center justify-between h-[20px]">
                    <div className="flex items-center gap-3">
                        {(match.homeTeam?.logo || (match.homeTeam as any)?.crest) ? (
                            <img src={match.homeTeam.logo || (match.homeTeam as any).crest} className="w-5 h-5 object-contain" alt={match.homeTeam?.name} />
                        ) : (
                            <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {match.homeTeam?.name?.charAt(0) || 'H'}
                            </div>
                        )}
                        <span className={`font-condensed font-bold text-[15px] uppercase ${isWinnerHome || homeScore == null ? 'text-white' : 'text-gray-500'}`}>
                            {match.homeTeam?.name || 'Home'}
                        </span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${isLive ? 'text-red-500' : 'text-white'}`}>
                        {!isLive && !isFinished ? '-' : (homeScore ?? '-')}
                    </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between h-[20px]">
                     <div className="flex items-center gap-3">
                        {(match.awayTeam?.logo || (match.awayTeam as any)?.crest) ? (
                            <img src={match.awayTeam.logo || (match.awayTeam as any).crest} className="w-5 h-5 object-contain" alt={match.awayTeam?.name} />
                        ) : (
                            <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {match.awayTeam?.name?.charAt(0) || 'A'}
                            </div>
                        )}
                        <span className={`font-condensed font-bold text-[15px] uppercase ${isWinnerAway || awayScore == null ? 'text-white' : 'text-gray-500'}`}>
                            {match.awayTeam?.name || 'Away'}
                        </span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${isLive ? 'text-red-500' : 'text-white'}`}>
                        {!isLive && !isFinished ? '-' : (awayScore ?? '-')}
                    </span>
                </div>
            </div>

        </div>
    );
};

export default ScoresPage;
