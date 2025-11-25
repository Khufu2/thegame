

import React, { useState, useMemo } from 'react';
import { Match, NewsStory, MatchStatus, SystemAlert, FeedItem } from '../types';
import { TrendingUp, Zap, Sun, MoreHorizontal, Flame, MessageSquare, PlayCircle, ArrowRight, ChevronRight, Sparkles, Filter, CloudRain, Wind, Thermometer, Info, Activity, Cloud, CloudSnow, Droplets, TrendingDown, Brain, Trophy, DollarSign, Clock, Play, BarChart, Target, AlertTriangle, Terminal, Siren, Radar, Plus, ArrowUpRight, ChevronDown } from 'lucide-react';
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
  const [showAllValuePicks, setShowAllValuePicks] = useState(false);
  const navigate = useNavigate();

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
    
    // EXPANDED: Value picks take the rest (up to 50 for the grid)
    const value = sortedPredictions.slice(12, 60); 
    
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
            else if (isForYou) matchesLeague = user ? story.tags?.some(tag => user.preferences.favoriteLeagues.includes(tag)) || false : true;
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

  const visibleValuePicks = showAllValuePicks ? valuePicks : valuePicks.slice(0, 6);

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
                <button 
                    onClick={() => navigate('/scores')}
                    className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 hover:text-indigo-500 transition-colors"
                >
                    All Games <ArrowRight size={12} />
                </button>
            </div>
             <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory px-4">
                {topPicks.map(match => (
                    <PremiumPredictionCard 
                        key={match.id} 
                        match={match} 
                        onClick={() => handleMatchClick(match.id)} 
                        onOpenPweza={() => openPwezaForMatch(match)} 
                    />
                ))}
             </div>
        </section>
        )}

        {/* 5. VALUE RADAR (GRID) */}
        {valuePicks.length > 0 && (
        <section className="px-4 py-2">
             <div className="flex items-center gap-2 mb-3">
                 <Radar size={16} className="text-[#00FFB2]" />
                 <h2 className="font-condensed font-black text-xl text-black md:text-white uppercase tracking-tighter italic">
                     Value Radar ({valuePicks.length})
                 </h2>
             </div>
             
             <div className="grid grid-cols-2 gap-3 mb-4">
                 {visibleValuePicks.map(match => (
                     <CompactPredictionCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                 ))}
             </div>

             {valuePicks.length > 6 && !showAllValuePicks && (
                 <button 
                    onClick={() => setShowAllValuePicks(true)}
                    className="w-full py-3 bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase hover:bg-[#252525] hover:text-white transition-colors"
                 >
                     Show {valuePicks.length - 6} More Picks <ChevronDown size={14} />
                 </button>
             )}
             
             {showAllValuePicks && (
                 <button 
                    onClick={() => setShowAllValuePicks(false)}
                    className="w-full py-3 bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase hover:bg-[#252525] hover:text-white transition-colors"
                 >
                     Show Less <ArrowUpRight size={14} />
                 </button>
             )}
        </section>
        )}

        {/* 6. THE STREAM (Latest Wire & Mixed Content) */}
        <section className="px-4 py-2 pb-20">
             <div className="flex items-center justify-between mb-4 mt-4">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                    <h2 className="font-condensed font-black text-xl text-black md:text-white uppercase tracking-tighter italic">
                        Latest Wire
                    </h2>
                </div>
                {/* View Options */}
                <button className="text-gray-400 hover:text-white">
                    <MoreHorizontal size={20} />
                </button>
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
                            />
                        );
                    } 
                    // RENDER: NEWS
                    else if ('source' in item) {
                         const story = item as NewsStory;
                         if (story.type === 'HIGHLIGHT') return <HighlightCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} />;
                         if (story.isHero) return <HeroNewsCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} />;
                         return <StandardNewsCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} />;
                    }
                    // RENDER: SYSTEM ALERT (WAR ROOM)
                    else if ('alertType' in item) {
                        const alert = item as SystemAlert;
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

const PremiumPredictionCard: React.FC<{ match: Match, onClick: () => void, onOpenPweza: () => void }> = ({ match, onClick, onOpenPweza }) => {
    const leagueStyle = getLeagueStyle(match.league);
    
    return (
        <div onClick={onClick} className={`min-w-[260px] max-w-[260px] ${leagueStyle} rounded-xl p-4 relative overflow-hidden cursor-pointer group snap-center border-t-2 shadow-lg`}>
             <div className="flex justify-between items-start mb-4">
                 <span className="font-condensed font-black text-xs text-white/50 uppercase tracking-widest">{match.league}</span>
                 {match.prediction?.confidence && (
                     <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
                         <Target size={12} className="text-[#00FFB2]" />
                         <span className="font-bold text-xs text-[#00FFB2]">{match.prediction.confidence}% Conf.</span>
                     </div>
                 )}
             </div>

             <div className="flex items-center justify-between mb-4">
                 <div className="flex flex-col items-center">
                     <img src={match.homeTeam.logo} className="w-10 h-10 object-contain drop-shadow-md" />
                     <span className="font-bold text-xs text-white mt-1 uppercase">{match.homeTeam.name.substring(0,3)}</span>
                 </div>
                 <div className="flex flex-col items-center">
                     <span className="font-condensed font-black text-2xl text-white/90 italic">VS</span>
                 </div>
                 <div className="flex flex-col items-center">
                     <img src={match.awayTeam.logo} className="w-10 h-10 object-contain drop-shadow-md" />
                     <span className="font-bold text-xs text-white mt-1 uppercase">{match.awayTeam.name.substring(0,3)}</span>
                 </div>
             </div>

             <div className="bg-black/40 rounded-lg p-2.5 backdrop-blur-sm border border-white/5 mb-3">
                 <div className="flex justify-between items-center mb-1">
                     <span className="text-[9px] font-bold text-gray-400 uppercase">Sheena's Pick</span>
                     <span className="text-[9px] font-bold text-[#00FFB2] uppercase">
                        {match.prediction?.potentialReturn || 'High Value'}
                     </span>
                 </div>
                 <div className="flex items-center justify-between">
                     <span className="font-condensed font-black text-lg text-white uppercase italic leading-none">
                         {match.prediction?.outcome === 'HOME' ? match.homeTeam.name : match.prediction?.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'}
                     </span>
                     {match.prediction?.modelEdge && <span className="text-[10px] font-bold text-green-400">+{match.prediction.modelEdge}% Edge</span>}
                 </div>
             </div>

             <div className="flex items-center justify-between pt-2 border-t border-white/10">
                 <div className="flex items-center gap-2">
                     <WeatherIcon condition={match.prediction?.weather} />
                     <span className="text-[10px] font-bold text-gray-400 uppercase">{match.time}</span>
                 </div>
                 <button onClick={(e) => {e.stopPropagation(); onOpenPweza();}} className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors">
                     <span className="text-xs">🐙</span>
                 </button>
             </div>
        </div>
    )
}

const CompactPredictionCard: React.FC<{ match: Match, onClick: () => void }> = ({ match, onClick }) => (
    <div onClick={onClick} className="bg-[#121212] rounded-xl p-3 border border-[#2C2C2C] hover:border-[#00FFB2]/50 transition-all cursor-pointer flex flex-col justify-between h-[150px] group relative overflow-hidden">
        {/* Background Tech Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#00FFB2]/5 rounded-full blur-xl group-hover:bg-[#00FFB2]/10 transition-colors"></div>
        
        <div className="flex justify-between items-start relative z-10">
             <div className="flex -space-x-2">
                 <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#333] flex items-center justify-center z-10">
                     <img src={match.homeTeam.logo} className="w-5 h-5 object-contain" />
                 </div>
                 <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#333] flex items-center justify-center z-0">
                     <img src={match.awayTeam.logo} className="w-5 h-5 object-contain" />
                 </div>
            </div>
            <div className="flex items-center gap-1 bg-[#00FFB2]/10 px-2 py-1 rounded border border-[#00FFB2]/20">
                <TrendingUp size={12} className="text-[#00FFB2]" />
                <span className="text-[10px] font-black text-[#00FFB2]">{match.prediction?.potentialReturn || '+100'}</span>
            </div>
        </div>
        
        <div className="relative z-10 mt-3">
             <div className="flex justify-between items-end mb-1">
                 <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{match.league}</span>
                 <span className="text-[9px] font-bold text-gray-500 uppercase">{match.time}</span>
             </div>
             
             <div className="bg-[#1E1E1E] rounded-lg p-2 border border-[#333] group-hover:border-gray-600 transition-colors">
                 <span className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Sheena's Value Pick</span>
                 <div className="flex items-center justify-between">
                     <span className="font-condensed font-black text-lg text-white uppercase leading-none truncate max-w-[80%]">
                        {match.prediction?.outcome === 'HOME' ? match.homeTeam.name : match.prediction?.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'}
                     </span>
                     {match.prediction?.confidence && (
                         <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB2]"></div>
                     )}
                 </div>
             </div>
        </div>
    </div>
)

const SmartPredictionCard: React.FC<{ match: Match, onClick: () => void, onOpenPweza?: () => void }> = ({ match, onClick, onOpenPweza }) => {
    return (
        <div onClick={onClick} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 cursor-pointer hover:border-indigo-500/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                     <span className="font-condensed font-black text-sm text-gray-400 uppercase tracking-wide">{match.league}</span>
                     <span className="text-[10px] font-bold text-red-500 uppercase">{match.time}</span>
                </div>
                {match.prediction?.isValuePick && (
                    <div className="flex items-center gap-1 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/30">
                        <TrendingUp size={12} className="text-green-400" />
                        <span className="text-[10px] font-bold text-green-400 uppercase">Value Pick</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                     <img src={match.homeTeam.logo} className="w-8 h-8 object-contain" />
                     <span className="font-bold text-lg text-white">{match.homeTeam.name}</span>
                 </div>
                 <div className="px-3 py-1 bg-[#121212] rounded text-lg font-mono font-bold text-white tracking-widest">
                     {match.score ? `${match.score.home} - ${match.score.away}` : 'VS'}
                 </div>
                 <div className="flex items-center gap-3 flex-row-reverse">
                     <img src={match.awayTeam.logo} className="w-8 h-8 object-contain" />
                     <span className="font-bold text-lg text-white">{match.awayTeam.name}</span>
                 </div>
            </div>

            {match.prediction && (
                <div className="bg-[#121212] rounded p-3 flex items-center justify-between">
                    <div>
                        <span className="block text-[10px] font-bold text-gray-500 uppercase">Sheena's Prediction</span>
                        <span className="font-condensed font-bold text-sm text-indigo-400 uppercase">
                            {match.prediction.outcome === 'HOME' ? match.homeTeam.name : match.prediction.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'} 
                            {match.prediction.confidence && ` (${match.prediction.confidence}%)`}
                        </span>
                    </div>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onOpenPweza?.(); }}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <span className="text-sm">🐙</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const WarRoomIntelCard: React.FC<{ alert: SystemAlert, onTail: () => void }> = ({ alert, onTail }) => (
    <div className="bg-black border border-l-4 border-[#2C2C2C] border-l-red-600 rounded-r-lg p-4 font-mono relative overflow-hidden group">
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase flex items-center gap-1">
            <Siren size={10} className="animate-pulse" /> War Room
        </div>
        
        <div className="flex items-start gap-3 relative z-10">
            <div className="mt-1"><Terminal size={18} className="text-red-500" /></div>
            <div className="flex-1">
                <h4 className="font-bold text-red-500 text-sm uppercase mb-1">{alert.title}</h4>
                <p className="text-xs text-gray-300 mb-3 leading-relaxed">{alert.description}</p>
                
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-[#1E1E1E] text-white px-1.5 py-0.5 rounded border border-[#333]">
                        {alert.dataPoint}
                    </span>
                    {alert.actionableBet && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onTail(); }}
                            className="flex items-center gap-1 text-[10px] font-black uppercase bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors"
                        >
                            Tail Bet <ArrowRight size={10} />
                        </button>
                    )}
                </div>
            </div>
        </div>
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
    </div>
)

// --- NEWS CARDS ---

const HeroNewsCard: React.FC<{ story: NewsStory, onClick: () => void }> = ({ story, onClick }) => (
    <div onClick={onClick} className="w-full aspect-video md:aspect-[21/9] rounded-xl relative overflow-hidden cursor-pointer group">
        <img src={story.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-5 w-full">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#00FFB2] text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Breaking
                </span>
                <span className="text-[10px] font-bold text-gray-300 uppercase">{story.timestamp}</span>
            </div>
            <h3 className="font-condensed font-black text-2xl md:text-3xl text-white uppercase leading-[0.95] mb-2 drop-shadow-lg">
                {story.title}
            </h3>
            <p className="text-gray-300 text-xs line-clamp-2 md:w-2/3 leading-relaxed font-medium">
                {story.summary}
            </p>
        </div>
    </div>
)

const StandardNewsCard: React.FC<{ story: NewsStory, onClick: () => void }> = ({ story, onClick }) => (
    <div onClick={onClick} className="flex gap-3 bg-[#1E1E1E] border border-[#2C2C2C] p-3 rounded-lg cursor-pointer hover:bg-[#252525] transition-colors group">
        <div className="flex-1 flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wide">{story.source}</span>
                    <span className="text-[9px] text-gray-500 font-bold">• {story.timestamp}</span>
                </div>
                <h3 className="font-condensed font-bold text-lg text-white leading-tight uppercase group-hover:underline underline-offset-2 decoration-2 decoration-indigo-500">
                    {story.title}
                </h3>
            </div>
            <div className="flex items-center gap-4 mt-2">
                 <div className="flex items-center gap-1 text-gray-500 text-[10px] font-bold">
                     <Flame size={12} /> {story.likes}
                 </div>
                 <div className="flex items-center gap-1 text-gray-500 text-[10px] font-bold">
                     <MessageSquare size={12} /> {story.comments}
                 </div>
            </div>
        </div>
        <div className="w-24 h-24 rounded bg-gray-800 overflow-hidden shrink-0">
            <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
    </div>
)

const HighlightCard: React.FC<{ story: NewsStory, onClick: () => void }> = ({ story, onClick }) => (
    <div onClick={onClick} className="relative rounded-lg overflow-hidden aspect-[16/9] cursor-pointer group border border-[#2C2C2C]">
        <img src={story.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={20} className="fill-white text-white ml-1" />
            </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
             <div className="flex items-center gap-2 mb-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                 <span className="text-[9px] font-black text-white uppercase tracking-wide">Highlight</span>
             </div>
             <h3 className="font-condensed font-bold text-sm text-white uppercase leading-tight">{story.title}</h3>
        </div>
    </div>
)
