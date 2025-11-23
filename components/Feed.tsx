import React, { useState, useMemo } from 'react';
import { Match, NewsStory, MatchStatus, SystemAlert, FeedItem } from '../types';
import { TrendingUp, Zap, Sun, MoreHorizontal, Flame, MessageSquare, PlayCircle, ArrowRight, ChevronRight, Sparkles, Filter, CloudRain, Wind, Thermometer, Info, Activity, Cloud, CloudSnow, Droplets, TrendingDown, Brain, Trophy, DollarSign, Clock, Play, BarChart, Target, AlertTriangle, Terminal, Siren, Radar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeedProps {
  items: FeedItem[];
  matches: Match[]; // Still passed for Live Rail/Filtering
  onArticleClick?: (id: string) => void;
  onOpenPweza?: () => void;
}

const LEAGUES = ["All", "NFL", "NBA", "EPL", "LaLiga", "Serie A", "UFC"];

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

export const Feed: React.FC<FeedProps> = ({ items, matches, onArticleClick, onOpenPweza }) => {
  const [activeLeague, setActiveLeague] = useState("All");
  const navigate = useNavigate();

  // 1. FILTERING LOGIC
  const { filteredStreamItems, topPicks, valuePicks, featuredMatch } = useMemo(() => {
    const isAll = activeLeague === "All" || activeLeague === "For You";
    
    // Get Matches for this view
    const allMatches = matches.filter(m => isAll || m.league === activeLeague);
    
    // 1. Featured (Live or First)
    const featured = allMatches.find(m => m.status === MatchStatus.LIVE) || allMatches[0];
    
    // 2. Sort remaining by confidence
    const sortedPredictions = allMatches
        .filter(m => m.prediction && m.id !== featured?.id)
        .sort((a, b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0));

    // 3. Slice Tiers
    const top = sortedPredictions.slice(0, 4); // Top 4 for Rail
    const value = sortedPredictions.slice(4, 10); // Next 6 for Grid
    
    // 4. Filter the main mixed stream
    // We filter OUT the matches that are already shown in featured, top, or value to avoid duplication
    // UNLESS we want them to repeat. For a cleaner UI, let's remove duplicates from the stream.
    const shownMatchIds = new Set([featured?.id, ...top.map(m => m.id), ...value.map(m => m.id)]);
    
    const fItems = items.filter(item => {
        // League Filter
        let matchesLeague = false;
        if ('league' in item) matchesLeague = isAll || item.league === activeLeague;
        else if ('type' in item) matchesLeague = isAll || (item as NewsStory).tags?.some(t => t === activeLeague) || (item as NewsStory).source.includes(activeLeague) || false;
        
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
  }, [activeLeague, items, matches]);

  // LIVE TICKER MATCHES
  const liveTickerMatches = matches.filter(m => m.status === MatchStatus.LIVE);
  const demoTickerMatches = liveTickerMatches.length > 0 ? liveTickerMatches : matches.slice(0, 3);
  
  const handleMatchClick = (id: string) => {
      navigate(`/match/${id}`);
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
            {LEAGUES.filter(l => l !== "All").map(league => (
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
        {featuredMatch && (
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
                            onClick={(e) => { e.stopPropagation(); onOpenPweza?.(); }}
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
                    <PremiumPredictionCard key={match.id} match={match} onOpenPweza={onOpenPweza} onClick={() => handleMatchClick(match.id)} />
                ))}
            </div>
        </section>
        )}

        {/* 5. NEW: VALUE RADAR (THE GRID - TIER 2) */}
        {valuePicks.length > 0 && (
            <section className="px-4 space-y-3">
                 <div className="flex items-center gap-2">
                    <Radar size={16} className="text-[#00FFB2]" />
                    <h2 className="font-condensed font-black text-xl text-black md:text-white uppercase tracking-tighter italic">
                        Value Radar
                    </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {valuePicks.map(match => (
                        <CompactPredictionCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                    ))}
                </div>
            </section>
        )}

        {/* 6. THE ENDLESS STREAM (MIXED CONTENT) */}
        <section className="px-4 space-y-4 pb-8">
            <div className="flex items-center justify-between border-t border-gray-200 md:border-white/10 pt-6 mt-4">
                 <div className="flex items-center gap-2">
                    <Activity size={16} className="text-sheena-primary" />
                    <h2 className="font-condensed font-black text-xl text-black md:text-white uppercase tracking-tighter italic">
                        Latest Wire
                    </h2>
                 </div>
                 <div className="flex gap-3">
                    <button className="text-[10px] font-bold uppercase text-gray-400 hover:text-black md:hover:text-white transition-colors">Top</button>
                    <button className="text-[10px] font-bold uppercase text-black md:text-white transition-colors border-b-2 border-sheena-primary pb-0.5">Newest</button>
                 </div>
            </div>

            <div className="flex flex-col gap-4">
                {filteredStreamItems.map((item) => {
                    // CASE: SYSTEM ALERT (WAR ROOM)
                    if ('alertType' in item) {
                         return <SystemAlertCard key={item.id} alert={item as SystemAlert} />;
                    }
                    
                    // CASE: NEWS STORY
                    if ('type' in item && 'summary' in item) { // Check specific props to disambiguate
                         const story = item as NewsStory;
                         if (story.type === 'HIGHLIGHT') {
                             return <HighlightCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} />
                         }
                         if (story.isHero) {
                             return <HeroNewsCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} />
                         }
                         return <StandardNewsCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} />
                    }
                    
                    // CASE: MATCH (Residual matches not in Top/Value)
                    if ('homeTeam' in item) {
                        return (
                            <SmartPredictionCard 
                                key={(item as Match).id} 
                                match={item as Match} 
                                onOpenPweza={onOpenPweza} 
                                onClick={() => handleMatchClick((item as Match).id)}
                            />
                        );
                    }
                    return null;
                })}
            </div>
            
            {/* End of Stream Indicator */}
            <div className="py-8 flex flex-col items-center justify-center text-gray-300 md:text-white/20 gap-2 opacity-60">
                <div className="w-1 h-8 bg-gradient-to-b from-transparent via-current to-transparent"></div>
                <span className="font-condensed font-bold text-xs uppercase tracking-widest">End of Stream</span>
            </div>
        </section>

      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

interface FilterChipProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`
            relative px-4 py-1.5 rounded-full font-condensed font-bold text-[14px] uppercase tracking-wide transition-all duration-200 shrink-0 border
            ${isActive 
                ? 'bg-black md:bg-white text-white md:text-black border-black md:border-white shadow-sm' 
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 md:bg-white/5 md:text-gray-400 md:border-white/10 md:hover:bg-white/10'
            }
        `}
    >
        {label}
    </button>
);

const FeedFooter = ({ likes, comments, source, isCompact = false }: { likes: number, comments: number, source: string, isCompact?: boolean }) => (
    <div className={`flex items-center justify-between ${isCompact ? '' : 'mt-2'}`}>
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{source}</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-500 md:text-gray-400">
                <Flame size={12} className={`${likes > 5000 ? 'text-[#F97316] fill-[#F97316]' : 'text-gray-400'}`} />
                <span className="font-condensed font-bold text-xs pt-0.5">{likes > 999 ? (likes/1000).toFixed(1) + 'k' : likes}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 md:text-gray-400">
                <MessageSquare size={12} />
                <span className="font-condensed font-bold text-xs pt-0.5">{comments}</span>
            </div>
        </div>
    </div>
);

// --- HELPER FOR SNIPPETS ---
const getCardContext = (match: Match) => {
    // Priority: Headline -> Injury -> Key Insight
    if (match.context?.headline) {
         return { icon: <Info size={12} />, text: match.context.headline, isInjury: false };
    }
    if (match.prediction?.injuries && match.prediction.injuries.length > 0) {
        return { icon: <Activity size={12} />, text: match.prediction.injuries[0], isInjury: true };
    }
    if (match.prediction?.keyInsight) {
         return { icon: <Sparkles size={12} />, text: match.prediction.keyInsight, isInjury: false };
    }
    return null;
}

// --- NEWS CARD VARIANTS ---

const HighlightCard: React.FC<{ story: NewsStory; onClick: () => void }> = ({ story, onClick }) => (
    <div onClick={onClick} className="relative group cursor-pointer rounded-xl overflow-hidden shadow-sm aspect-video w-full bg-black">
        <img src={story.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                <Play size={20} className="text-white fill-white ml-1" />
            </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                    Highlight
                </span>
                <span className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1">
                    <Clock size={10} /> {story.timestamp}
                </span>
            </div>
            <h3 className="font-condensed font-bold text-xl text-white leading-[0.95] uppercase drop-shadow-md mb-2 max-w-[90%]">
                {story.title}
            </h3>
            <FeedFooter likes={story.likes} comments={story.comments} source={story.source} isCompact />
        </div>
    </div>
);

const HeroNewsCard: React.FC<{ story: NewsStory; onClick: () => void }> = ({ story, onClick }) => {
    const isRumor = story.type === 'RUMOR';
    return (
        <div onClick={onClick} className="relative group cursor-pointer rounded-xl overflow-hidden shadow-sm min-h-[220px] bg-black">
            <img src={story.imageUrl} className="w-full h-full object-cover absolute inset-0 opacity-80 group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end h-full">
                <div className="mb-auto pt-2">
                     <span className={`text-[9px] font-black uppercase px-2 py-1 rounded inline-block ${isRumor ? 'bg-yellow-500 text-black' : 'bg-sheena-primary text-white'}`}>
                        {isRumor ? 'Transfer Rumor' : 'Breaking News'}
                     </span>
                </div>
                
                <h3 className="font-condensed font-black text-3xl md:text-4xl text-white leading-[0.9] uppercase drop-shadow-lg mb-3">
                    {story.title}
                </h3>
                
                <p className="text-sm font-medium text-gray-300 line-clamp-2 mb-4 leading-tight opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-12 bg-black/80 p-2 rounded backdrop-blur md:static md:bg-transparent md:p-0">
                    {story.summary}
                </p>

                <div className="border-t border-white/10 pt-3">
                    <FeedFooter likes={story.likes} comments={story.comments} source={story.source} isCompact />
                </div>
            </div>
        </div>
    )
};

const StandardNewsCard: React.FC<{ story: NewsStory; onClick: () => void }> = ({ story, onClick }) => (
    <div onClick={onClick} className="flex gap-4 cursor-pointer group bg-white md:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-100 md:border-[#2C2C2C] hover:border-gray-300 md:hover:border-white/20 transition-colors">
        <div className="flex flex-col justify-between flex-1 min-w-0">
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    {story.type === 'RUMOR' && <span className="text-[9px] font-black text-yellow-600 bg-yellow-100 px-1 py-0.5 rounded uppercase">Rumor</span>}
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{story.timestamp} • {story.source}</span>
                </div>
                <h3 className="font-condensed font-bold text-xl text-black md:text-white leading-[1.0] uppercase line-clamp-2 group-hover:text-sheena-primary transition-colors">
                    {story.title}
                </h3>
                <p className="text-xs text-gray-500 md:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {story.summary}
                </p>
            </div>
            <div className="mt-3">
                <FeedFooter likes={story.likes} comments={story.comments} source="" isCompact />
            </div>
        </div>
        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200">
            <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
    </div>
);


// --- NEW LIVE PULSE CARD ---
const LivePulseCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
    return (
        <div 
            onClick={onClick} 
            className="snap-center shrink-0 w-[200px] h-[80px] rounded-lg bg-white md:bg-[#1a1a1a] border border-gray-200 md:border-white/10 shadow-sm relative overflow-hidden cursor-pointer active:scale-95 transition-transform flex flex-col justify-center px-4"
        >
            <div className="absolute top-0 right-0 p-1.5">
                 <div className="flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                     <span className="text-[9px] font-black text-red-500 uppercase tracking-wide leading-none">{match.time}</span>
                 </div>
            </div>

            <div className="flex items-center gap-3">
                 <div className="flex-1 flex flex-col gap-2">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <img src={match.homeTeam.logo} className="w-5 h-5 object-contain" />
                             <span className="font-condensed font-bold text-sm text-gray-900 md:text-white truncate max-w-[80px]">{match.homeTeam.name}</span>
                         </div>
                         <span className="font-mono font-bold text-sm text-gray-900 md:text-white">{match.score?.home || 0}</span>
                     </div>
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <img src={match.awayTeam.logo} className="w-5 h-5 object-contain" />
                             <span className="font-condensed font-bold text-sm text-gray-900 md:text-white truncate max-w-[80px]">{match.awayTeam.name}</span>
                         </div>
                         <span className="font-mono font-bold text-sm text-gray-900 md:text-white">{match.score?.away || 0}</span>
                     </div>
                 </div>
            </div>
            
            {/* League Badge Background */}
            <span className="absolute bottom-1 right-2 text-[60px] font-black text-black/5 md:text-white/5 pointer-events-none italic leading-none -z-0">
                {match.league.substring(0,3)}
            </span>
        </div>
    )
}

// --- PREMIUM CARD (BROADCAST STYLE) ---
const PremiumPredictionCard: React.FC<{ match: Match; onOpenPweza?: () => void; onClick: () => void }> = ({ match, onOpenPweza, onClick }) => {
    const leagueStyle = getLeagueStyle(match.league);
    const snippet = getCardContext(match);

    return (
        <div onClick={onClick} className={`snap-center shrink-0 w-[240px] rounded-[16px] overflow-hidden shadow-lg border relative group cursor-pointer active:scale-95 transition-transform ${leagueStyle.includes('border') ? 'border-l-4' : ''} ${leagueStyle}`}>
            
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none"></div>

            {/* Broadcast Header */}
            <div className="flex justify-between items-center px-3 py-2 relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <span className="font-condensed font-black text-white uppercase tracking-wider text-xs italic">{match.league}</span>
                    <span className="font-sans font-medium text-[9px] text-white/70 tracking-wide uppercase ml-auto">{match.time}</span>
                </div>
            </div>

            {/* Matchup Center */}
            <div className="flex items-center justify-between px-4 py-4 relative z-10">
                <div className="flex flex-col items-center gap-2 w-[35%]">
                     <img src={match.homeTeam.logo} className="w-10 h-10 object-contain drop-shadow-md" alt={match.homeTeam.name} />
                     <span className="font-condensed font-bold text-sm leading-none text-center text-white tracking-tight">{match.homeTeam.name}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center w-[30%]">
                    <span className="font-black text-xl text-white/20 italic select-none">VS</span>
                </div>

                <div className="flex flex-col items-center gap-2 w-[35%]">
                     <img src={match.awayTeam.logo} className="w-10 h-10 object-contain drop-shadow-md" alt={match.awayTeam.name} />
                     <span className="font-condensed font-bold text-sm leading-none text-center text-white tracking-tight">{match.awayTeam.name}</span>
                </div>
            </div>

            {/* Footer with Snippet & Prediction Indicator */}
            <div className="px-3 pb-3 relative z-10">
                 <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded px-2.5 py-1.5 flex items-center gap-2 group-hover:bg-white/10 transition-colors h-[32px]">
                     {/* Weather */}
                     <div className="opacity-70">
                         <WeatherIcon condition={match.prediction?.weather} size={12} />
                     </div>
                     <div className="w-[1px] h-3 bg-white/20"></div>
                     
                     {/* Text Snippet */}
                     <div className="flex-1 overflow-hidden">
                         {snippet ? (
                             <div className={`flex items-center gap-1.5 ${snippet.isInjury ? 'text-red-400' : 'text-gray-300'}`}>
                                 {snippet.icon}
                                 <span className="text-[10px] font-bold truncate leading-none pt-[1px]">{snippet.text}</span>
                             </div>
                         ) : (
                             <span className="text-[10px] font-bold text-gray-400">Deep stats available</span>
                         )}
                     </div>

                     {/* Small Prediction Indicator */}
                     <div className="w-5 h-5 rounded-full bg-[#00FFB2]/20 border border-[#00FFB2]/50 flex items-center justify-center shrink-0">
                         <Sparkles size={10} className="text-[#00FFB2]" />
                     </div>
                 </div>
            </div>
            
            {/* Floating Octopus */}
            <button 
                onClick={(e) => { e.stopPropagation(); onOpenPweza?.(); }}
                className="absolute top-2 right-2 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-20"
            >
                <span className="text-sm">🐙</span>
            </button>
        </div>
    )
}

// --- COMPACT PREDICTION CARD (FOR GRID) ---
const CompactPredictionCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
    return (
        <div onClick={onClick} className="bg-white md:bg-[#1A1A1A] border border-gray-200 md:border-white/10 rounded-lg p-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
             <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-black uppercase text-gray-400">{match.league}</span>
                 <span className="text-[9px] font-bold text-gray-400">{match.time}</span>
             </div>
             
             <div className="flex items-center justify-between mb-3">
                 <div className="flex flex-col gap-1.5">
                     <div className="flex items-center gap-1.5">
                         <img src={match.homeTeam.logo} className="w-4 h-4 object-contain" />
                         <span className="font-condensed font-bold text-sm text-black md:text-white leading-none truncate max-w-[80px]">{match.homeTeam.name}</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                         <img src={match.awayTeam.logo} className="w-4 h-4 object-contain" />
                         <span className="font-condensed font-bold text-sm text-black md:text-white leading-none truncate max-w-[80px]">{match.awayTeam.name}</span>
                     </div>
                 </div>
                 {/* Quick Pick Badge */}
                 {match.prediction && (
                     <div className={`flex flex-col items-end ${match.prediction.isValuePick ? 'text-green-500' : 'text-indigo-500'}`}>
                         <span className="text-[10px] font-bold uppercase">Pick</span>
                         <span className="font-black text-sm leading-none">{match.prediction.outcome === 'HOME' ? '1' : match.prediction.outcome === 'AWAY' ? '2' : 'X'}</span>
                         {match.prediction.potentialReturn && <span className="text-[9px] font-mono opacity-80">{match.prediction.potentialReturn}</span>}
                     </div>
                 )}
             </div>
        </div>
    )
}

// --- STANDARD SMART CARD (FOR FEED MIX - ENHANCED) ---
const SmartPredictionCard: React.FC<{ match: Match; onOpenPweza?: () => void; onClick: () => void }> = ({ match, onOpenPweza, onClick }) => {
    const snippet = getCardContext(match);
    return (
        <div onClick={onClick} className="bg-white md:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-100 md:border-[#2C2C2C] overflow-hidden cursor-pointer group active:scale-[0.99] transition-all hover:border-gray-300 md:hover:border-white/20">
             {/* Header */}
             <div className="px-4 py-3 border-b border-gray-100 md:border-white/5 flex justify-between items-center bg-gray-50/50 md:bg-white/5">
                 <div className="flex items-center gap-2">
                     <span className={`w-1.5 h-1.5 rounded-full ${match.prediction?.outcome === 'HOME' ? 'bg-indigo-500' : match.prediction?.outcome === 'AWAY' ? 'bg-pink-500' : 'bg-gray-400'}`}></span>
                     <span className="font-condensed font-bold text-sm uppercase text-gray-600 md:text-gray-300 tracking-wide">{match.league}</span>
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{match.time}</span>
             </div>

             {/* Match Body */}
             <div className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3 w-[40%]">
                     <img src={match.homeTeam.logo} className="w-10 h-10 object-contain" />
                     <span className="font-condensed font-bold text-lg text-black md:text-white leading-none">{match.homeTeam.name}</span>
                 </div>
                 
                 <div className="flex flex-col items-center w-[20%]">
                     <span className="font-black text-xl text-gray-300 md:text-white/20 italic select-none">VS</span>
                 </div>

                 <div className="flex items-center gap-3 w-[40%] justify-end">
                     <span className="font-condensed font-bold text-lg text-black md:text-white leading-none text-right">{match.awayTeam.name}</span>
                     <img src={match.awayTeam.logo} className="w-10 h-10 object-contain" />
                 </div>
             </div>

             {/* Footer Info Bar */}
             <div className="mx-4 mb-4 bg-gray-100 md:bg-black/20 rounded-lg p-2.5 flex items-center justify-between gap-3 border border-transparent group-hover:border-gray-200 md:group-hover:border-white/10 transition-colors">
                 
                 {/* Left: Dynamic Snippet */}
                 <div className="flex items-center gap-2 overflow-hidden">
                     {snippet ? (
                         <>
                            <div className={`${snippet.isInjury ? 'text-red-500' : 'text-indigo-500'}`}>
                                {snippet.icon}
                            </div>
                            <span className="text-[11px] font-bold text-gray-600 md:text-gray-300 truncate leading-none pt-0.5">{snippet.text}</span>
                         </>
                     ) : (
                         <span className="text-[11px] font-bold text-gray-400">Match insights available</span>
                     )}
                 </div>

                 {/* Right: Indicators */}
                 <div className="flex items-center gap-3 shrink-0">
                     {match.prediction?.sentiment && (
                         <div className="flex items-center gap-1">
                             <TrendingUp size={12} className={match.prediction.sentiment === 'POSITIVE' ? 'text-green-500' : 'text-red-500'} />
                         </div>
                     )}
                     <div className="w-[1px] h-3 bg-gray-300 md:bg-white/10"></div>
                     <button onClick={(e) => { e.stopPropagation(); onOpenPweza?.() }} className="hover:scale-110 transition-transform opacity-60 hover:opacity-100">
                        <span className="text-sm">🐙</span>
                     </button>
                 </div>
             </div>
        </div>
    )
}

// --- SYSTEM ALERT CARD (WAR ROOM INTELLIGENCE) ---
const SystemAlertCard: React.FC<{ alert: SystemAlert }> = ({ alert }) => {
    return (
        <div className="relative overflow-hidden bg-[#0A0A0A] border border-[#00FFB2]/30 rounded-xl p-4 shadow-[0_0_20px_-10px_rgba(0,255,178,0.2)]">
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-0 opacity-20"></div>
            
            <div className="relative z-10 flex items-start gap-4">
                <div className="mt-1">
                    {alert.alertType === 'SHARP_MONEY' && <div className="w-10 h-10 rounded bg-[#00FFB2]/10 border border-[#00FFB2] flex items-center justify-center text-[#00FFB2]"><DollarSign size={20} /></div>}
                    {alert.alertType === 'LINE_MOVE' && <div className="w-10 h-10 rounded bg-orange-500/10 border border-orange-500 flex items-center justify-center text-orange-500"><TrendingUp size={20} /></div>}
                    {alert.alertType === 'TRENDING_PROP' && <div className="w-10 h-10 rounded bg-blue-500/10 border border-blue-500 flex items-center justify-center text-blue-500"><Flame size={20} /></div>}
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-[#00FFB2] uppercase tracking-widest flex items-center gap-2">
                             <Terminal size={10} />
                             System Alert
                        </span>
                        <span className="font-mono text-[10px] text-gray-500">{alert.timestamp}</span>
                    </div>
                    
                    <h3 className="font-condensed font-black text-xl text-white uppercase leading-none mb-1.5">
                        {alert.title}
                    </h3>
                    
                    <p className="font-mono text-xs text-gray-400 leading-relaxed mb-3">
                        {alert.description}
                    </p>

                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded">
                        <Activity size={12} className="text-white" />
                        <span className="font-mono text-xs font-bold text-white">{alert.dataPoint}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}