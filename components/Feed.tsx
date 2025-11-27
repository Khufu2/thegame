
import React, { useState, useMemo } from 'react';
import { Match, NewsStory, MatchStatus, SystemAlert, FeedItem } from '../types';
import { TrendingUp, Zap, Sun, MoreHorizontal, Flame, MessageSquare, PlayCircle, ArrowRight, ChevronRight, Sparkles, Filter, CloudRain, Wind, Thermometer, Info, Activity, Cloud, CloudSnow, Droplets, TrendingDown, Brain, Trophy, DollarSign, Clock, Play, BarChart, Target, AlertTriangle, Terminal, Siren, Radar, Plus, ArrowUpRight, ChevronDown, LayoutGrid, Lock, ImageOff, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';

interface FeedProps {
  items: FeedItem[];
  matches: Match[]; // Still passed for Live Rail/Filtering
  onArticleClick?: (id: string) => void;
  onOpenPweza?: (prompt?: string) => void;
  onTailBet?: (matchId: string) => void;
}

// Helper for professional gradient backgrounds based on league
const getLeagueStyle = (league: string) => {
    switch (league) {
        case 'EPL': return 'bg-gradient-to-br from-[#38003C] to-[#1E1E1E] border-[#00FF85]';
        case 'LaLiga': return 'bg-gradient-to-br from-[#111] to-[#2a0e0e] border-[#EE3F46]';
        case 'NFL': return 'bg-gradient-to-br from-[#013369] to-[#1E1E1E] border-[#D50A0A]';
        case 'NBA': return 'bg-gradient-to-br from-[#1D428A] to-[#1E1E1E] border-[#C8102E]';
        case 'Serie A': return 'bg-gradient-to-br from-[#004D98] to-[#1E1E1E] border-[#00A1DF]';
        case 'UFC': return 'bg-gradient-to-br from-[#1E1E1E] to-[#000000] border-[#D20A0A]';
        case 'Bundesliga': return 'bg-gradient-to-br from-[#800000] to-[#1E1E1E] border-[#D20A0A]';
        case 'Ligue 1': return 'bg-gradient-to-br from-[#091c3e] to-[#1E1E1E] border-[#DAE025]';
        case 'NHL': return 'bg-gradient-to-br from-[#000000] to-[#1E1E1E] border-[#A2AAAD]';
        case 'NCAA': return 'bg-gradient-to-br from-[#003087] to-[#1E1E1E] border-[#FFFFFF]';
        default: return 'bg-gradient-to-br from-[#1E1E1E] to-[#252525] border-gray-700';
    }
}

// Helper for COMPACT card styling (Subtler gradients)
const getCompactLeagueStyle = (league: string) => {
    switch (league) {
        case 'EPL': return 'bg-gradient-to-r from-[#38003C]/80 to-[#121212] border-[#00FF85]/30 hover:border-[#00FF85]';
        case 'LaLiga': return 'bg-gradient-to-r from-[#2a0e0e]/90 to-[#121212] border-[#EE3F46]/30 hover:border-[#EE3F46]';
        case 'NFL': return 'bg-gradient-to-r from-[#013369]/80 to-[#121212] border-[#D50A0A]/30 hover:border-[#D50A0A]';
        case 'NBA': return 'bg-gradient-to-r from-[#1D428A]/80 to-[#121212] border-[#C8102E]/30 hover:border-[#C8102E]';
        case 'UFC': return 'bg-gradient-to-r from-[#333]/80 to-[#000] border-[#D20A0A]/30 hover:border-[#D20A0A]';
        default: return 'bg-[#161616] border-[#2C2C2C] hover:border-[#00FFB2]/50';
    }
}

const LEAGUES = ["All", "NFL", "NBA", "EPL", "LaLiga", "Serie A", "UFC"];

// Helper for Weather Icon
const WeatherIcon = ({ condition, size = 14 }: { condition?: string, size?: number }) => {
    if (!condition) return <Sun size={size} className="text-yellow-500" />;
    const c = condition.toLowerCase();
    if (c.includes('rain')) return <CloudRain size={size} className="text-blue-400" />;
    if (c.includes('snow')) return <CloudSnow size={size} className="text-white" />;
    if (c.includes('cloud')) return <Cloud size={size} className="text-gray-400" />;
    if (c.includes('indoor')) return <Thermometer size={size} className="text-orange-500" />;
    return <Sun size={size} className="text-yellow-500" />;
}

export const Feed: React.FC<FeedProps> = ({ items, matches, onArticleClick, onOpenPweza, onTailBet }) => {
  const { user } = useSports(); 
  const [activeLeague, setActiveLeague] = useState("For You"); // Default to For You
  const navigate = useNavigate();
  const dataSaver = user?.preferences.dataSaver || false;

  // 1. FILTERING LOGIC
  const { filteredStreamItems, topPicks, valuePicks, featuredMatch } = useMemo(() => {
    const isAll = activeLeague === "All";
    const isForYou = activeLeague === "For You";
    
    // Get Matches for this view
    const allMatches = matches.filter(m => {
        if (isAll) return true;
        if (isForYou) {
             // CRITICAL: Strictly obey user preferences
             if (!user) return true; // Fallback for guest
             const followsLeague = user.preferences.favoriteLeagues.includes(m.league);
             const followsTeam = user.preferences.favoriteTeams.includes(m.homeTeam.id) || user.preferences.favoriteTeams.includes(m.awayTeam.id);
             return followsLeague || followsTeam;
        }
        return m.league === activeLeague;
    });
    
    // 1. Featured (Live or First)
    const featured = allMatches.find(m => m.status === MatchStatus.LIVE) || allMatches[0];
    
    // 2. Sort remaining by confidence
    const sortedPredictions = allMatches
        .filter(m => m.prediction && m.id !== featured?.id)
        .sort((a, b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0));

    // 3. Slice Tiers
    // EXPANDED: Show more picks in the horizontal rail (up to 12)
    const top = sortedPredictions.slice(0, 12); 
    
    // EXPANDED: Value picks take the rest (up to 60 for the grid)
    const value = sortedPredictions.slice(12, 72); 
    
    // 4. Filter the main mixed stream
    const shownMatchIds = new Set([featured?.id, ...top.map(m => m.id), ...value.map(m => m.id)]);
    
    const fItems = items.filter(item => {
        // League Filter
        let matchesLeague = false;
        
        // Handle Match Item
        if ('league' in item) {
            const m = item as Match;
            if (isAll) matchesLeague = true;
            else if (isForYou) matchesLeague = user ? (user.preferences.favoriteLeagues.includes(m.league) || user.preferences.favoriteTeams.includes(m.homeTeam.id) || user.preferences.favoriteTeams.includes(m.awayTeam.id)) : true;
            else matchesLeague = m.league === activeLeague;
        }
        // Handle News Item
        else if ('source' in item) {
            const story = item as NewsStory;
            if (isAll) matchesLeague = true;
            else if (isForYou) {
                // Check if user follows the SOURCE or the LEAGUE tag
                if (!user) matchesLeague = true;
                else {
                    const followsSource = user.preferences.followedSources?.includes(story.source) || user.preferences.followedSources?.includes(story.author || '');
                    const followsTag = story.tags?.some(tag => user.preferences.favoriteLeagues.includes(tag));
                    matchesLeague = followsSource || followsTag || false;
                }
            }
            else matchesLeague = story.tags?.includes(activeLeague) || story.source.includes(activeLeague) || false;
        }
        // Handle Alert Item
        else if ('alertType' in item) {
             const alert = item as SystemAlert;
             if (isAll) matchesLeague = true;
             else if (isForYou) matchesLeague = user ? user.preferences.favoriteLeagues.includes(alert.league) : true;
             else matchesLeague = alert.league === activeLeague;
        }
        
        if (!matchesLeague) return false;

        // Dedup Logic: If it's a match, check if it's already shown above
        if ('homeTeam' in item) {
            return !shownMatchIds.has((item as Match).id);
        }
        return true;
    });

    return { 
        filteredStreamItems: fItems, 
        topPicks: top,
        valuePicks: value,
        featuredMatch: featured
    };
  }, [activeLeague, items, matches, user]);

  // LIVE TICKER MATCHES
  const liveTickerMatches = matches.filter(m => m.status === MatchStatus.LIVE);
  const demoTickerMatches = liveTickerMatches.length > 0 ? liveTickerMatches : matches.slice(0, 3);
  
  const handleMatchClick = (id: string) => {
      navigate(`/match/${id}`);
  };

  const openPwezaForMatch = (match: Match) => {
      const prompt = `Give me a quick 50-word sharp betting insight for ${match.homeTeam.name} vs ${match.awayTeam.name}. Focus on value and key stats.`;
      onOpenPweza?.(prompt);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] md:bg-br-bg md:max-w-[1000px] md:mx-auto pb-24 overflow-x-hidden">
      
      {/* 1. TOP SECTION: HAPPENING NOW (LIVE RAIL) */}
      {demoTickerMatches.length > 0 && (
          <section className="pt-2 pb-1 bg-[#F2F2F2] md:bg-br-bg">
            <div className="flex items-center gap-2 px-4 mb-2">
                 <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                 <h2 className="font-condensed font-bold text-sm uppercase tracking-wider text-gray-500 md:text-gray-400">Happening Now</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory">
                {demoTickerMatches.map((match) => (
                    <LivePulseCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                ))}
            </div>
          </section>
      )}

      {/* 2. LEAGUE FILTER STRIP */}
      <div className="sticky top-[44px] md:top-0 z-40 bg-[#F2F2F2]/95 backdrop-blur-xl md:bg-br-bg/95 border-b border-gray-200/50 md:border-white/10 py-3 shadow-sm transition-all">
          <div className="flex items-center gap-2 px-4 overflow-x-auto no-scrollbar w-full">
            <FilterChip 
                label="For You" 
                isActive={activeLeague === "For You"} 
                onClick={() => setActiveLeague("For You")} 
            />
            {LEAGUES.map(league => (
                <FilterChip 
                    key={league}
                    label={league}
                    isActive={activeLeague === league}
                    onClick={() => setActiveLeague(league)}
                />
            ))}
          </div>
      </div>

      <div className="space-y-6 animate-in fade-in duration-500">

        {/* 3. HERO: FEATURED GAME */}
        {featuredMatch ? (
            <section className="px-4 mt-4 relative z-10 cursor-pointer" onClick={() => handleMatchClick(featuredMatch.id)}>
                <div className="w-full rounded-[20px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-white/5 text-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-300 active:scale-[0.98]">
                    {/* Subtle graphic patterns */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-sheena-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start p-5 pb-2 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="font-condensed font-black text-lg italic tracking-tighter uppercase text-white/90">
                                {featuredMatch.league}
                            </span>
                            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                            <span className="font-sans text-xs font-medium text-white/60 uppercase tracking-wide">Featured Match</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-6 py-4 relative z-10">
                        <div className="flex flex-col items-center gap-3 w-[30%]">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-2 shadow-inner border border-white/5">
                                <img src={featuredMatch.homeTeam.logo} className="w-full h-full object-contain drop-shadow-lg" alt={featuredMatch.homeTeam.name} />
                            </div>
                            <span className="font-condensed font-bold text-xl uppercase tracking-tight text-center leading-none">{featuredMatch.homeTeam.name}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center w-[40%]">
                            <span className="font-condensed font-black text-[48px] tracking-tighter drop-shadow-2xl leading-none whitespace-nowrap">
                                {featuredMatch.status === MatchStatus.LIVE 
                                    ? `${featuredMatch.score?.home || 0}-${featuredMatch.score?.away || 0}`
                                    : 'VS'
                                }
                            </span>
                            <span className="text-[11px] font-bold text-sheena-primary mt-2 bg-sheena-primary/10 px-2 py-0.5 rounded border border-sheena-primary/20">
                                {featuredMatch.time}
                            </span>
                        </div>

                        <div className="flex flex-col items-center gap-3 w-[30%]">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center p-2 shadow-inner border border-white/5">
                                <img src={featuredMatch.awayTeam.logo} className="w-full h-full object-contain drop-shadow-lg" alt={featuredMatch.awayTeam.name} />
                            </div>
                            <span className="font-condensed font-bold text-xl uppercase tracking-tight text-center leading-none">{featuredMatch.awayTeam.name}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-center pb-5 mt-2 relative z-10">
                        <button 
                            onClick={(e) => { e.stopPropagation(); openPwezaForMatch(featuredMatch); }}
                            className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all active:scale-95"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-lg">
                                🐙
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-bold text-indigo-300 uppercase leading-none">Ask Pweza</span>
                                <span className="text-[10px] text-white/60 leading-none mt-0.5">Live Odds & Prediction</span>
                            </div>
                        </button>
                    </div>
                </div>
            </section>
        ) : (
            <div className="px-4 py-10 text-center text-gray-500">
                <span className="font-condensed font-bold text-lg uppercase">No featured matches found for this filter.</span>
            </div>
        )}

        {/* 4. PREMIUM PREDICTIONS (THE LOCKS - RAIL) */}
        {topPicks.length > 0 && (
        <section className="py-2 space-y-4">
             <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-sheena-primary" />
                    <h2 className="font-condensed font-black text-xl text-black md:text-white uppercase tracking-tighter italic">
                        Daily Locks
                    </h2>
                </div>
            </div>
             <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory px-4">
                {topPicks.map(match => (
                    <PremiumPredictionCard 
                        key={match.id} 
                        match={match} 
                        onClick={() => handleMatchClick(match.id)} 
                        onOpenPweza={() => openPwezaForMatch(match)} 
                        isLocked={!user}
                    />
                ))}
             </div>
        </section>
        )}

        {/* 5. VALUE RADAR (UPDATED: 4-ROW HIGH DENSITY GRID) */}
        {valuePicks.length > 0 && (
        <section className="py-2 space-y-4">
             <div className="flex items-center justify-between px-4">
                 <div className="flex items-center gap-2">
                     <Radar size={16} className="text-[#00FFB2]" />
                     <h2 className="font-condensed font-black text-xl text-black md:text-white uppercase tracking-tighter italic">
                         Value Radar
                     </h2>
                 </div>
                 <button 
                    onClick={() => navigate('/scores')}
                    className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 hover:text-[#00FFB2] transition-colors"
                >
                    View All <ArrowRight size={12} />
                </button>
             </div>
             
             {/* 
                 HORIZONTAL SCROLL CONTAINER WITH GRID 
                 Rows: 4 (Denser)
                 Flow: Column
                 Auto Columns: 240px (Compact Cards)
             */}
             <div className="grid grid-rows-4 grid-flow-col gap-2 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 auto-cols-[240px]">
                 {valuePicks.map(match => (
                     <div className="snap-start h-[60px]" key={match.id}>
                        <CompactPredictionCard 
                            match={match} 
                            onClick={() => handleMatchClick(match.id)} 
                            isLocked={!user}
                        />
                     </div>
                 ))}
             </div>
        </section>
        )}

        {/* 6. THE STREAM (Latest Wire & Mixed Content) */}
        <section className="px-4 py-2 pb-20">
             {/* UPDATED HEADER: Actionable Link */}
             <div 
                className="flex items-center justify-between mb-4 mt-4 cursor-pointer group"
                onClick={() => navigate('/explore')}
             >
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                    <h2 className="font-condensed font-black text-xl text-black md:text-white uppercase tracking-tighter italic group-hover:text-indigo-500 transition-colors">
                        Latest Wire
                    </h2>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                    View News <ChevronRight size={14} />
                </div>
             </div>
             
             <div className="space-y-4">
                {filteredStreamItems.map((item, index) => {
                    // RENDER: MATCH
                    if ('homeTeam' in item) {
                        return (
                            <SmartPredictionCard 
                                key={(item as Match).id} 
                                match={item as Match} 
                                onClick={() => handleMatchClick((item as Match).id)} 
                                onOpenPweza={() => openPwezaForMatch(item as Match)} 
                                isLocked={!user}
                            />
                        );
                    } 
                    // RENDER: NEWS
                    else if ('source' in item) {
                         const story = item as NewsStory;
                         if (story.type === 'HIGHLIGHT' && !dataSaver) return <HighlightCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} />;
                         if (story.isHero) return <HeroNewsCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} dataSaver={dataSaver} />;
                         return <StandardNewsCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} dataSaver={dataSaver} />;
                    }
                    // RENDER: SYSTEM ALERT (WAR ROOM)
                    else if ('alertType' in item) {
                        const alert = item as SystemAlert;
                        // HIDE ALERTS FOR GUEST USERS
                        if (!user) {
                             return (
                                 <div key={alert.id} className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-4 flex items-center justify-between opacity-50 relative overflow-hidden">
                                     <div className="flex items-center gap-2">
                                         <Siren size={16} className="text-red-500" />
                                         <span className="font-bold text-sm text-gray-400 uppercase">War Room Alert</span>
                                     </div>
                                     <Lock size={14} className="text-gray-500" />
                                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                         <span className="text-[10px] font-black uppercase text-gray-300">Locked</span>
                                     </div>
                                 </div>
                             );
                        }
                        return <WarRoomIntelCard key={alert.id} alert={alert} onTail={() => onTailBet?.(alert.relatedMatchId || '')} />;
                    }
                    return null;
                })}
             </div>
             
             {/* End of Stream Indicator */}
             <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400 opacity-50">
                 <div className="w-1 h-12 bg-gradient-to-b from-transparent via-gray-400 to-transparent"></div>
                 <span className="font-condensed font-bold uppercase tracking-widest text-xs">End of Stream</span>
             </div>
        </section>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const FilterChip: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-5 py-2 rounded-full font-condensed font-bold uppercase text-sm tracking-wide transition-all whitespace-nowrap ${
            isActive 
            ? 'bg-black text-white md:bg-white md:text-black shadow-lg transform scale-105' 
            : 'bg-white text-gray-500 border border-gray-200 md:bg-white/5 md:text-gray-400 md:border-white/10 hover:bg-gray-50'
        }`}
    >
        {label}
    </button>
);

const LivePulseCard: React.FC<{ match: Match, onClick: () => void }> = ({ match, onClick }) => (
    <div onClick={onClick} className="min-w-[280px] bg-black rounded-xl p-3 border border-[#2C2C2C] relative overflow-hidden flex items-center justify-between cursor-pointer group hover:border-[#444] transition-colors snap-center">
        {/* Glass effect bg */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent pointer-events-none"></div>
        
        <div className="flex items-center gap-3 relative z-10">
            <span className="text-[10px] font-black text-red-500 animate-pulse uppercase tracking-wider">
                {match.time}
            </span>
            <div className="w-[1px] h-6 bg-[#333]"></div>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <img src={match.homeTeam.logo} className="w-4 h-4 object-contain" />
                    <span className="font-bold text-sm text-white leading-none">{match.homeTeam.name}</span>
                    <span className="font-mono text-sm text-red-500 font-bold ml-auto">{match.score?.home}</span>
                </div>
                <div className="flex items-center gap-2">
                    <img src={match.awayTeam.logo} className="w-4 h-4 object-contain" />
                    <span className="font-bold text-sm text-white leading-none">{match.awayTeam.name}</span>
                    <span className="font-mono text-sm text-red-500 font-bold ml-auto">{match.score?.away}</span>
                </div>
            </div>
        </div>
        
        <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
    </div>
);

const PremiumPredictionCard: React.FC<{ match: Match, onClick: () => void, onOpenPweza: () => void, isLocked?: boolean }> = ({ match, onClick, onOpenPweza, isLocked }) => {
    const leagueStyle = getLeagueStyle(match.league);
    
    return (
        <div 
            onClick={onClick}
            className={`min-w-[320px] rounded-xl overflow-hidden relative cursor-pointer border ${leagueStyle} shadow-lg transition-transform hover:scale-[1.01] snap-center flex flex-col`}
        >
             {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2">
                    <span className="font-condensed font-black text-sm uppercase italic text-white/80">{match.league}</span>
                    {match.prediction?.confidence && match.prediction.confidence > 80 && (
                        <div className="flex items-center gap-1 bg-[#00FFB2]/20 text-[#00FFB2] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                            <Sparkles size={10} /> Lock
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-bold text-white/50 uppercase">{match.time}</span>
            </div>

            {/* Matchup */}
            <div className="flex items-center justify-between px-5 py-4 flex-1">
                <div className="flex flex-col items-center gap-2">
                    <img src={match.homeTeam.logo} className="w-10 h-10 object-contain drop-shadow-md" />
                    <span className="font-condensed font-bold text-lg uppercase text-white leading-none">{match.homeTeam.name}</span>
                </div>
                <span className="font-serif font-italic text-gray-500 text-sm">VS</span>
                <div className="flex flex-col items-center gap-2">
                    <img src={match.awayTeam.logo} className="w-10 h-10 object-contain drop-shadow-md" />
                    <span className="font-condensed font-bold text-lg uppercase text-white leading-none">{match.awayTeam.name}</span>
                </div>
            </div>

            {/* Prediction Footer */}
            <div className="bg-black/40 px-4 py-3 border-t border-white/5 flex items-center justify-between relative overflow-hidden">
                
                {/* GUEST LOCK OVERLAY */}
                {isLocked && (
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-2">
                        <Lock size={14} className="text-white/70" />
                        <span className="font-condensed font-black text-xs uppercase text-white tracking-wide">Member Access Only</span>
                    </div>
                )}

                <div className={isLocked ? 'blur-sm select-none' : ''}>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Sheena's Pick</span>
                    <div className="flex items-center gap-2">
                        <span className="font-condensed font-black text-xl text-white uppercase tracking-tight">
                            {match.prediction?.outcome === 'HOME' ? match.homeTeam.name : match.prediction?.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'}
                        </span>
                        {match.prediction?.odds && (
                             <span className="font-mono text-xs font-bold text-[#00FFB2] bg-[#00FFB2]/10 px-1.5 rounded">
                                 {match.prediction?.outcome === 'HOME' ? match.prediction.odds.home : match.prediction.odds.away}
                             </span>
                        )}
                    </div>
                </div>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); onOpenPweza(); }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg shadow-sm border border-white/5 transition-colors relative z-30"
                >
                    🐙
                </button>
            </div>
        </div>
    );
};

const CompactPredictionCard: React.FC<{ match: Match, onClick: () => void, isLocked?: boolean }> = ({ match, onClick, isLocked }) => {
    // UPDATED: Use dynamic league style for the card background
    const styleClass = getCompactLeagueStyle(match.league);

    return (
        <div 
            onClick={onClick}
            className={`w-full h-full rounded-lg p-2 flex items-center justify-between cursor-pointer group transition-all relative overflow-hidden border ${styleClass}`}
        >
            {/* Noise Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 relative z-10 w-full">
                 {/* Time Badge */}
                 <div className="flex flex-col items-center justify-center w-8 shrink-0 border-r border-white/10 pr-2">
                     <span className="text-[9px] font-mono text-gray-400 uppercase">{match.time.split(':')[0] || match.time}</span>
                     <span className="text-[8px] text-gray-500">{match.time.includes(':') ? 'PM' : ''}</span>
                 </div>

                 {/* Matchup */}
                 <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                         <img src={match.homeTeam.logo} className="w-3.5 h-3.5 object-contain opacity-90" />
                         <span className={`font-condensed font-bold text-xs leading-none truncate ${match.prediction?.outcome === 'HOME' ? 'text-white' : 'text-gray-400'}`}>
                             {match.homeTeam.name.substring(0,12)}
                         </span>
                         {match.prediction?.outcome === 'HOME' && <div className="w-1 h-1 bg-[#00FFB2] rounded-full ml-auto shadow-[0_0_5px_rgba(0,255,178,0.5)]"></div>}
                     </div>
                     <div className="flex items-center gap-2">
                         <img src={match.awayTeam.logo} className="w-3.5 h-3.5 object-contain opacity-90" />
                         <span className={`font-condensed font-bold text-xs leading-none truncate ${match.prediction?.outcome === 'AWAY' ? 'text-white' : 'text-gray-400'}`}>
                             {match.awayTeam.name.substring(0,12)}
                         </span>
                         {match.prediction?.outcome === 'AWAY' && <div className="w-1 h-1 bg-[#00FFB2] rounded-full ml-auto shadow-[0_0_5px_rgba(0,255,178,0.5)]"></div>}
                     </div>
                 </div>

                 {/* Odds / Lock */}
                 <div className="text-right shrink-0 pl-2">
                     {isLocked ? (
                        <div className="bg-black/40 p-1.5 rounded">
                            <Lock size={10} className="text-gray-500" />
                        </div>
                     ) : (
                         <div className="bg-black/40 px-2 py-1 rounded border border-white/10 group-hover:border-[#00FFB2]/30 transition-colors">
                             <span className="block font-mono font-bold text-xs text-[#00FFB2]">
                                 {match.prediction?.potentialReturn}
                             </span>
                         </div>
                     )}
                 </div>
            </div>
        </div>
    );
};

const SmartPredictionCard: React.FC<{ match: Match, onClick: () => void, onOpenPweza: () => void, isLocked?: boolean }> = ({ match, onClick, onOpenPweza, isLocked }) => {
    return (
        <div onClick={onClick} className="bg-[#121212] border border-[#2C2C2C] rounded-xl overflow-hidden cursor-pointer hover:border-[#3E3E3E] transition-all group relative">
            
            {/* GUEST LOCK OVERLAY */}
            {isLocked && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[3px] flex flex-col items-center justify-center p-6 text-center border border-white/5 m-1 rounded-lg">
                    <Lock size={24} className="text-white mb-2" />
                    <h3 className="font-condensed font-black text-lg uppercase text-white tracking-wide">Analysis Locked</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Join Sheena Sports to see this prediction.</p>
                </div>
            )}
            
            <div className={`p-4 ${isLocked ? 'blur-sm select-none opacity-50' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <span className="font-condensed font-bold text-xs text-gray-400 uppercase tracking-wide">{match.league}</span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase">• {match.time}</span>
                    </div>
                     {/* PWEZA BADGE */}
                     <div className="flex items-center gap-1 bg-indigo-900/30 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Pweza Edge</span>
                     </div>
                </div>

                {/* Matchup Row */}
                <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                         <img src={match.homeTeam.logo} className="w-8 h-8 object-contain" />
                         <span className="font-condensed font-black text-xl uppercase text-white">{match.homeTeam.name}</span>
                     </div>
                     <span className="font-serif italic text-gray-600 text-sm">vs</span>
                     <div className="flex items-center gap-3">
                         <span className="font-condensed font-black text-xl uppercase text-white">{match.awayTeam.name}</span>
                         <img src={match.awayTeam.logo} className="w-8 h-8 object-contain" />
                     </div>
                </div>

                {/* Smart Footer Strip */}
                <div className="flex items-center justify-between pt-3 border-t border-[#2C2C2C]">
                     <div className="flex gap-4">
                         {/* Weather */}
                         <div className="flex items-center gap-1.5" title={match.prediction?.weather}>
                             <WeatherIcon condition={match.prediction?.weather} size={14} />
                             <span className="text-[10px] font-bold text-gray-500 uppercase hidden sm:block">
                                 {match.prediction?.weather?.split(' ')[0] || 'Clear'}
                             </span>
                         </div>
                         
                         {/* Sentiment */}
                         {match.prediction?.sentiment && (
                             <div className="flex items-center gap-1.5">
                                 {match.prediction.sentiment === 'POSITIVE' ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
                                 <span className="text-[10px] font-bold text-gray-500 uppercase hidden sm:block">Market</span>
                             </div>
                         )}

                         {/* Dynamic Snippet (Injury/Headline) */}
                         <div className="flex items-center gap-1.5">
                             {match.context?.injuryReport ? (
                                 <>
                                     <Activity size={14} className="text-red-500" />
                                     <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[120px]">
                                         Injury Alert
                                     </span>
                                 </>
                             ) : (
                                 <>
                                     <Info size={14} className="text-blue-500" />
                                     <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[120px]">
                                         {match.context?.headline || 'Match Insights'}
                                     </span>
                                 </>
                             )}
                         </div>
                     </div>
                     
                     {/* Prediction Indicator */}
                     <div className="relative">
                         <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse absolute -top-0.5 -right-0.5"></div>
                         <div className="bg-indigo-600/20 p-1.5 rounded-md border border-indigo-500/30">
                             <Brain size={14} className="text-indigo-400" />
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export const HeroNewsCard: React.FC<{ story: NewsStory, onClick: () => void, dataSaver?: boolean }> = ({ story, onClick, dataSaver }) => (
    <div onClick={onClick} className="relative aspect-video w-full rounded-xl overflow-hidden cursor-pointer group shadow-2xl bg-[#121212]">
        {dataSaver ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-black">
                <Newspaper size={48} className="text-indigo-500/50" />
            </div>
        ) : (
            <img src={story.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
        <div className={`absolute inset-0 ${dataSaver ? '' : 'bg-gradient-to-t from-black via-black/40 to-transparent'}`}></div>
        
        <div className="absolute bottom-0 left-0 p-5 w-full">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide">Top Story</span>
                <span className="text-[10px] font-bold text-gray-300 uppercase">{story.timestamp}</span>
            </div>
            <h2 className="font-condensed font-black text-3xl uppercase text-white leading-[0.9] mb-2 tracking-tight group-hover:text-indigo-400 transition-colors">
                {story.title}
            </h2>
            <p className="text-sm text-gray-300 line-clamp-2 font-medium leading-relaxed max-w-[90%]">
                {story.summary}
            </p>
        </div>
    </div>
);

export const StandardNewsCard: React.FC<{ story: NewsStory, onClick: () => void, dataSaver?: boolean }> = ({ story, onClick, dataSaver }) => (
    <div onClick={onClick} className="flex gap-4 p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-transparent hover:border-[#333]">
        <div className="w-[100px] h-[80px] rounded-lg overflow-hidden shrink-0 relative bg-[#1E1E1E] flex items-center justify-center">
            {dataSaver ? (
                <ImageOff size={24} className="text-gray-600" />
            ) : (
                <img src={story.imageUrl} className="w-full h-full object-cover" />
            )}
            {story.type === 'RUMOR' && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[8px] font-black uppercase px-1 rounded">Rumor</div>
            )}
        </div>
        <div className="flex-1 flex flex-col justify-between py-1">
             <div>
                 <div className="flex items-center gap-2 mb-1">
                     <span className="text-[9px] font-bold text-gray-500 uppercase">{story.source}</span>
                     <span className="text-[9px] text-gray-600">• {story.timestamp}</span>
                 </div>
                 <h3 className="font-condensed font-bold text-lg uppercase text-white leading-none line-clamp-2">
                     {story.title}
                 </h3>
             </div>
             <div className="flex items-center gap-3 mt-2">
                 <div className="flex items-center gap-1 text-gray-500">
                     <MessageSquare size={12} /> <span className="text-[10px] font-bold">{story.comments}</span>
                 </div>
                 <div className="flex items-center gap-1 text-gray-500">
                     <Flame size={12} /> <span className="text-[10px] font-bold">{story.likes}</span>
                 </div>
             </div>
        </div>
    </div>
);

const HighlightCard: React.FC<{ story: NewsStory, onClick: () => void }> = ({ story, onClick }) => (
    <div onClick={onClick} className="relative w-full rounded-xl overflow-hidden cursor-pointer group border border-[#2C2C2C]">
        <div className="aspect-[16/9] w-full relative">
            <img src={story.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                    <PlayCircle size={28} className="text-white fill-white" />
                </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                0:45
            </div>
        </div>
        <div className="p-3 bg-[#121212]">
            <h3 className="font-condensed font-bold text-base uppercase text-white leading-none truncate">
                {story.title}
            </h3>
        </div>
    </div>
);

const WarRoomIntelCard: React.FC<{ alert: SystemAlert, onTail: () => void }> = ({ alert, onTail }) => (
    <div className="bg-black border border-[#2C2C2C] rounded-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase">
            War Room Alert
        </div>
        
        {/* Terminal Effect Lines */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

        <div className="p-4 relative z-10">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-900/20 rounded flex items-center justify-center shrink-0 border border-red-500/30">
                     {alert.alertType === 'SHARP_MONEY' ? <DollarSign size={16} className="text-red-500"/> : <Siren size={16} className="text-red-500"/>}
                </div>
                <div>
                    <h3 className="font-mono font-bold text-red-500 text-sm uppercase leading-tight mb-1">{alert.title}</h3>
                    <p className="font-mono text-xs text-gray-400 mb-3 leading-relaxed">
                        {alert.description}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="bg-[#1E1E1E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#333] font-mono">
                            {alert.dataPoint}
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase">
                            {alert.timestamp}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-[#2C2C2C] flex justify-end">
                <button 
                    onClick={onTail}
                    className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-red-500 transition-colors uppercase"
                >
                    <Target size={14} /> Tail Bet
                </button>
            </div>
        </div>
    </div>
);
