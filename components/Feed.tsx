

import React, { useState, useMemo, useEffect } from 'react';
import { Match, NewsStory, MatchStatus, SystemAlert, FeedItem } from '../types';
import { TrendingUp, Zap, Sun, MoreHorizontal, Flame, MessageSquare, PlayCircle, ArrowRight, ChevronRight, Sparkles, Filter, CloudRain, Wind, Thermometer, Info, Activity, Cloud, CloudSnow, Droplets, TrendingDown, Brain, Trophy, DollarSign, Clock, Play, BarChart2, Target, AlertTriangle, Terminal, Siren, Radar, Plus, ArrowUpRight, ChevronDown, LayoutGrid, Lock, ImageOff, Newspaper, Share2, Twitter, Facebook, Link, Youtube, Calendar, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';
import { formatMatchTime } from './utils/formatTime';
import { ShareModal } from './ShareModal';

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
  const [activeLeague, setActiveLeague] = useState("All"); // Default to All for more content
  const navigate = useNavigate();
  const dataSaver = user?.preferences.dataSaver || false;
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<NewsStory | null>(null);

  // NEW BLEACHER REPORT STYLE STATE
  const [featuredVideo, setFeaturedVideo] = useState({
    id: 'featured_1',
    title: 'Incredible Last-Minute Winner! ⚽️',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
    duration: '2:34',
    views: '125K',
    source: 'Premier League',
    url: '#'
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showYesterday, setShowYesterday] = useState(false);

  // LEAGUE PRIORITIZATION ALGORITHM
  const getPrioritizedLeagues = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const leagues = ['EPL', 'LaLiga', 'NBA', 'Serie A', 'Bundesliga', 'Ligue 1', 'NHL', 'UFC', 'F1', 'MLB'];
    const safeMatches = Array.isArray(matches) ? matches : [];

    // Count matches today for each league
    const leagueMatchCounts = leagues.map(league => {
      const todayMatches = safeMatches.filter(m =>
        m.league === league &&
        new Date(m.time).toDateString() === today.toDateString()
      ).length;

      const yesterdayMatches = safeMatches.filter(m =>
        m.league === league &&
        new Date(m.time).toDateString() === yesterday.toDateString()
      ).length;

      // Count news content for league
      const newsCount = items.filter(item =>
        'tags' in item && (item as NewsStory).tags?.includes(league)
      ).length;

      return {
        league,
        todayMatches,
        yesterdayMatches,
        newsCount,
        totalScore: (todayMatches * 3) + (yesterdayMatches * 2) + newsCount
      };
    });

    // Sort by total score (matches today > matches yesterday > news content)
    return leagueMatchCounts.sort((a, b) => b.totalScore - a.totalScore);
  }, [matches, items]);


  // 1. FILTERING LOGIC
  const { filteredStreamItems, topPicks, valuePicks, featuredMatch } = useMemo(() => {
    const isAll = activeLeague === "All";
    const isForYou = activeLeague === "For You";

    // Safety check: ensure matches is an array
    const safeMatches = Array.isArray(matches) ? matches : [];

    // Get Matches for this view
    const allMatches = safeMatches.filter(m => {
        if (isAll) return true;
        if (isForYou) {
             // Show all matches if no user or no preferences set
             if (!user) return true;
             const hasPreferences = (user.preferences.favoriteLeagues?.length > 0) || (user.preferences.favoriteTeams?.length > 0);
             if (!hasPreferences) return true; // Show all if no preferences
             const followsLeague = user.preferences.favoriteLeagues?.includes(m.league);
             const followsTeam = user.preferences.favoriteTeams?.includes(m.homeTeam.id) || user.preferences.favoriteTeams?.includes(m.awayTeam.id);
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
        if (!item) return false;
        
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
  const safeMatchesForTicker = Array.isArray(matches) ? matches : [];
  const liveTickerMatches = safeMatchesForTicker.filter(m => m.status === MatchStatus.LIVE);
  const demoTickerMatches = liveTickerMatches.length > 0 ? liveTickerMatches : safeMatchesForTicker.slice(0, 3);
  
  const handleMatchClick = (id: string) => {
      navigate(`/match/${id}`);
  };

  const openPwezaForMatch = (match: Match) => {
      const prompt = `Give me a quick 50-word sharp betting insight for ${match.homeTeam.name} vs ${match.awayTeam.name}. Focus on value and key stats.`;
      onOpenPweza?.(prompt);
  };

  return (
    <div className="min-h-screen bg-black md:bg-br-bg md:max-w-[1000px] md:mx-auto pb-24 overflow-x-hidden">
      
      {/* 1. TOP SECTION: HAPPENING NOW (LIVE RAIL) */}
      {demoTickerMatches.length > 0 && (
          <section className="pt-2 pb-1 bg-black md:bg-br-bg">
            <div className="flex items-center gap-2 px-4 mb-2">
                 <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                 <h2 className="font-condensed font-bold text-sm uppercase tracking-wider text-gray-500 md:text-gray-400">Happening Now</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory">
                {demoTickerMatches.map((match) => (
                    match && <LivePulseCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                ))}
            </div>
          </section>
      )}

      {/* 2. LEAGUE FILTER STRIP */}
      <div className="sticky top-[44px] md:top-0 z-40 bg-black/95 backdrop-blur-xl md:bg-br-bg/95 border-b border-white/10 py-3 shadow-sm transition-all">
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
                                {formatMatchTime(featuredMatch.time)}
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
                    match && <PremiumPredictionCard
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
                     match && <div className="snap-start h-[60px]" key={match.id}>
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

        {/* 6. THE WIRE - BLEACHER REPORT STYLE */}
        <section className="px-4 py-2 pb-20">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6 mt-4">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-[#00FFB2]" />
                    <h2 className="font-condensed font-black text-2xl text-white uppercase tracking-tighter italic">
                        The Wire
                    </h2>
                </div>
                <button
                   onClick={() => navigate('/explore')}
                   className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 hover:text-[#00FFB2] transition-colors"
               >
                   Explore All <ArrowRight size={12} />
               </button>
            </div>

            {/* FEATURED VIDEO - STICKY ON SCROLL */}
            <div className="sticky top-[120px] z-20 mb-6">
              <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2C2C2C] shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Youtube size={20} className="text-red-500" />
                  <h3 className="font-condensed font-black text-xl text-white uppercase tracking-tighter">
                    Featured Video
                  </h3>
                </div>
                <VideoCard
                  title={featuredVideo.title}
                  thumbnail={featuredVideo.thumbnail}
                  duration={featuredVideo.duration}
                  views={featuredVideo.views}
                  source={featuredVideo.source}
                />
              </div>
            </div>

            {/* TRENDING HEADLINES */}
            <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2C2C2C] mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-red-500" />
                    <span className="font-bold text-white text-sm uppercase tracking-wide">Trending Headlines</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {filteredStreamItems.filter(item => 'source' in item).slice(0, 8).map((item) => (
                        <TrendingNewsCard key={item.id} story={item as NewsStory} onClick={() => onArticleClick?.((item as NewsStory).id)} />
                    ))}
                </div>
            </div>

            {/* TOMORROW'S GAMES / THIS WEEKEND */}
            <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2C2C2C] mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-blue-400" />
                    <span className="font-bold text-white text-sm uppercase tracking-wide">Tomorrow's Games</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {topPicks.slice(0, 6).map(match => (
                        match && <PremiumPredictionCard
                            key={match.id}
                            match={match}
                            onClick={() => handleMatchClick(match.id)}
                            onOpenPweza={() => openPwezaForMatch(match)}
                            isLocked={!user}
                        />
                    ))}
                </div>
            </div>

            {/* AROUND THE LEAGUES - DYNAMIC PRIORITIZATION */}
            {getPrioritizedLeagues.slice(0, 4).map((leagueData) => {
              const leagueMatches = Array.isArray(matches) ? matches.filter(m => m.league === leagueData.league) : [];
              const leagueNews = items.filter(item => 'tags' in item && (item as NewsStory).tags?.includes(leagueData.league)).slice(0, 3) as NewsStory[];

              return (
                <LeagueSection
                  key={leagueData.league}
                  league={leagueData.league}
                  matches={leagueMatches}
                  news={leagueNews}
                  onMatchClick={handleMatchClick}
                  onNewsClick={onArticleClick}
                  onOpenPweza={openPwezaForMatch}
                  user={user}
                />
              );
            })}

            {/* MAIN NEWS GRID - Focus on content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStreamItems.filter(item => 'source' in item).slice(2, 14).map((item, index) => {
                    const story = item as NewsStory;
                    // Alternate between different card styles
                    if (index % 4 === 0) return <HeroNewsCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} dataSaver={dataSaver} />;
                    if (index % 3 === 0 && story.type === 'HIGHLIGHT') return <HighlightCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} />;
                    return <StandardNewsCard key={story.id} story={story} onClick={() => onArticleClick?.(story.id)} dataSaver={dataSaver} onShare={(story) => { setSelectedStory(story); setShareModalOpen(true); }} />;
                })}
            </div>

            {/* WHAT'S BUZZING - MATCH BUZZ CAROUSEL */}
            <div className="bg-black rounded-lg border border-[#2C2C2C] mt-6">
                <div className="px-4 py-3 border-b border-[#2C2C2C]">
                    <h3 className="font-bold text-white text-lg uppercase tracking-wide">What's Buzzing</h3>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-4 gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Cristiano Ronaldo",
                                    avatar: "https://pbs.twimg.com/profile_images/1594465820858509312/6p3Zx8QX_400x400.jpg",
                                    type: "official"
                                }}
                                timestamp="2h"
                                content={{
                                    type: "media",
                                    mediaUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop"
                                }}
                                caption="Al-Nassr star continues impressive preseason with intense training sessions."
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Sky Sports",
                                    avatar: "https://pbs.twimg.com/profile_images/1602271499060938752/3p1H4xKo_400x400.png",
                                    type: "media"
                                }}
                                timestamp="45m"
                                content={{
                                    type: "text",
                                    text: "🚨 BREAKING: Major transfer news incoming! Arsenal agree deal for £50m striker. Details to follow..."
                                }}
                                caption="Transfer deadline day drama unfolds with major Premier League moves."
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Luka Modrić",
                                    avatar: "https://pbs.twimg.com/profile_images/1588688236898953216/9p3Zx8QX_400x400.jpg",
                                    type: "official"
                                }}
                                timestamp="1h"
                                content={{
                                    type: "text",
                                    text: "What a season it's been! Grateful for every moment with Real Madrid. See you next year! 🌟 #HalaMadrid"
                                }}
                                caption="Real Madrid legend reflects on championship-winning campaign."
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Bleacher Report",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="3h"
                                content={{
                                    type: "text",
                                    text: "The Premier League title race is heating up! Who do you think will win it all this season? 🏆"
                                }}
                                caption="Premier League contenders emerge as season reaches critical phase."
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "ESPN FC",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="4h"
                                content={{
                                    type: "media",
                                    mediaUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop"
                                }}
                                caption="Champions League knockout rounds promise spectacular football ahead."
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Manchester City",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "official"
                                }}
                                timestamp="5h"
                                content={{
                                    type: "text",
                                    text: "Training intensity at maximum as we prepare for the title defense. 💪"
                                }}
                                caption="City's preparation for Premier League defense reaches peak intensity."
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "The Athletic",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="6h"
                                content={{
                                    type: "text",
                                    text: "Deep dive: How Liverpool's transfer strategy is reshaping their squad."
                                }}
                                caption="Liverpool's summer transfer activity analyzed in detail."
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Premier League",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "official"
                                }}
                                timestamp="7h"
                                content={{
                                    type: "text",
                                    text: "VAR controversies and referee decisions spark debate across the league."
                                }}
                                caption="VAR decisions continue to be a hot topic in Premier League discussions."
                                sourceUrl="#"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* VIDEO HIGHLIGHTS SECTION */}
            <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2C2C2C] mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <PlayCircle size={16} className="text-red-500" />
                    <span className="font-bold text-white text-sm uppercase tracking-wide">Latest Highlights</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <VideoCard
                        title="Incredible Last-Minute Winner!"
                        thumbnail="https://example.com/thumb1.jpg"
                        duration="2:34"
                        views="125K"
                        source="Premier League"
                    />
                    <VideoCard
                        title="Top 10 Goals of the Season"
                        thumbnail="https://example.com/thumb2.jpg"
                        duration="8:12"
                        views="89K"
                        source="Champions League"
                    />
                </div>
            </div>

            {/* LOAD MORE */}
            <div className="text-center py-8">
                <button
                    onClick={() => navigate('/explore')}
                    className="bg-[#1E1E1E] hover:bg-[#252525] text-white font-bold uppercase text-sm px-8 py-3 rounded-lg border border-[#2C2C2C] hover:border-[#00FFB2]/50 transition-colors"
                >
                    Load More Stories
                </button>
            </div>
        </section>

      </div>

      {/* SHARE MODAL */}
      {selectedStory && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => { setShareModalOpen(false); setSelectedStory(null); }}
          story={selectedStory}
        />
      )}
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

const LivePulseCard: React.FC<{ match: Match, onClick: () => void }> = ({ match, onClick }) => {
    // Helper to get possession safely
    const homePossession = match.stats?.possession?.home;
    const awayPossession = match.stats?.possession?.away;

    return (
        <div onClick={onClick} className="min-w-[300px] bg-black rounded-xl p-3 border border-[#2C2C2C] relative overflow-hidden cursor-pointer group hover:border-red-900/50 transition-colors snap-center shadow-lg">
            {/* Glass effect bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Header: Live Indicator & Time */}
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                        LIVE • {formatMatchTime(match.time)}
                    </span>
                </div>
                {/* Optional: League Badge */}
                <span className="text-[9px] font-bold text-gray-600 uppercase border border-gray-800 px-1.5 py-0.5 rounded">{match.league}</span>
            </div>
            
            {/* Teams & Scores */}
            <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={match.homeTeam.logo} className="w-5 h-5 object-contain" />
                        <span className="font-condensed font-bold text-base text-white">{match.homeTeam.name}</span>
                    </div>
                    <span className="font-mono text-lg font-bold text-white">{match.score?.home ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={match.awayTeam.logo} className="w-5 h-5 object-contain" />
                        <span className="font-condensed font-bold text-base text-white">{match.awayTeam.name}</span>
                    </div>
                    <span className="font-mono text-lg font-bold text-white">{match.score?.away ?? 0}</span>
                </div>
            </div>

            {/* Possession Stats (If Available) */}
            {homePossession !== undefined && (
                <div className="mt-3 relative z-10">
                    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase mb-1">
                        <span>Possession</span>
                        <div className="flex gap-2">
                            <span className={homePossession > 50 ? 'text-white' : ''}>{homePossession}%</span>
                            <span className={awayPossession && awayPossession > 50 ? 'text-white' : ''}>{awayPossession}%</span>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full flex overflow-hidden">
                        <div className="bg-red-600 transition-all duration-1000 ease-out" style={{ width: `${homePossession}%` }}></div>
                        <div className="bg-gray-700 transition-all duration-1000 ease-out flex-1"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

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
                    {match.prediction?.confidence && (
                        <div className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                            match.prediction.confidence > 80 ? 'bg-[#00FFB2]/20 text-[#00FFB2]' :
                            match.prediction.confidence > 60 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                        }`}>
                            <Sparkles size={10} />
                            {match.prediction.systemRecord === 'Basic Fallback' ? 'Basic' :
                             match.prediction.systemRecord === 'Elo-based' ? 'Elo' :
                             match.prediction.confidence > 80 ? 'Lock' :
                             match.prediction.confidence > 60 ? 'Safe' : 'Risk'}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {match.prediction?.confidence && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            match.prediction.confidence > 80 ? 'text-[#00FFB2] border-[#00FFB2]/30 bg-[#00FFB2]/10' :
                            match.prediction.confidence > 60 ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                            'text-red-400 border-red-400/30 bg-red-400/10'
                        }`}>
                            {match.prediction.confidence}%
                        </span>
                    )}
                    <span className="text-[10px] font-bold text-white/50 uppercase">{formatMatchTime(match.time)}</span>
                </div>
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
                            {match.prediction?.outcome === 'HOME' ? match.homeTeam.name :
                             match.prediction?.outcome === 'AWAY' ? match.awayTeam.name :
                             match.prediction?.outcome === 'DRAW' ? 'Draw' :
                             'Analyzing...'}
                        </span>
                        {match.prediction?.odds && (
                             <span className="font-mono text-xs font-bold text-[#00FFB2] bg-[#00FFB2]/10 px-1.5 rounded">
                                 {match.prediction?.outcome === 'HOME' ? match.prediction.odds.home :
                                  match.prediction?.outcome === 'AWAY' ? match.prediction.odds.away :
                                  match.prediction?.outcome === 'DRAW' ? match.prediction.odds.draw :
                                  '—'} odds
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

                 {/* Odds / Confidence */}
                 <div className="text-right shrink-0 pl-2">
                     {isLocked ? (
                        <div className="bg-black/40 p-1.5 rounded">
                            <Lock size={10} className="text-gray-500" />
                        </div>
                     ) : (
                         <div className={`px-2 py-1 rounded border transition-colors ${
                             match.prediction?.confidence > 80 ? 'bg-[#00FFB2]/10 border-[#00FFB2]/30' :
                             match.prediction?.confidence > 60 ? 'bg-yellow-400/10 border-yellow-400/30' :
                             'bg-red-400/10 border-red-400/30'
                         }`}>
                             <span className={`block font-mono font-bold text-xs ${
                                 match.prediction?.confidence > 80 ? 'text-[#00FFB2]' :
                                 match.prediction?.confidence > 60 ? 'text-yellow-400' :
                                 'text-red-400'
                             }`}>
                                 {match.prediction?.confidence || 0}%
                             </span>
                             <span className={`block font-mono text-[8px] uppercase ${
                                 match.prediction?.systemRecord === 'Elo-based' ? 'text-blue-400' :
                                 match.prediction?.systemRecord === 'Basic Fallback' ? 'text-gray-400' :
                                 'text-indigo-400'
                             }`}>
                                 {match.prediction?.systemRecord === 'Elo-based' ? 'Elo' :
                                  match.prediction?.systemRecord === 'Basic Fallback' ? 'Basic' :
                                  'AI'}
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
                        <span className="text-[10px] text-gray-600 font-bold uppercase">• {formatMatchTime(match.time)}</span>
                    </div>
                     {/* WEATHER ICON */}
                     {match.prediction?.weather && (
                         <div className="flex items-center gap-1" title={match.prediction.weather}>
                             <WeatherIcon condition={match.prediction.weather} size={12} />
                             <span className="text-[9px] font-bold text-gray-400 uppercase hidden sm:block">
                                 {match.prediction.weather.split(' ')[0]}
                             </span>
                         </div>
                     )}
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

export const StandardNewsCard: React.FC<{ story: NewsStory, onClick: () => void, dataSaver?: boolean, onShare?: (story: NewsStory) => void }> = ({ story, onClick, dataSaver, onShare }) => (
    <div className="bg-black/40 rounded-xl border border-transparent hover:border-[#333] transition-colors">
        <div onClick={onClick} className="flex gap-4 p-3 cursor-pointer hover:bg-black/60">
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
        <div className="px-3 pb-3 flex justify-end">
            <button
                onClick={(e) => { e.stopPropagation(); onShare?.(story); }}
                className="flex items-center gap-1 text-gray-500 hover:text-indigo-400 transition-colors text-xs font-bold uppercase"
            >
                <Share2 size={12} />
                Share
            </button>
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

// NEW BLEACHER REPORT STYLE CARDS
const HeroMatchCard: React.FC<{ match: Match, onClick: () => void, onOpenPweza: () => void }> = ({ match, onClick, onOpenPweza }) => (
    <div onClick={onClick} className="relative aspect-[16/9] w-full rounded-xl overflow-hidden cursor-pointer group shadow-2xl bg-gradient-to-br from-indigo-900/40 to-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

        <div className="absolute bottom-0 left-0 p-6 w-full">
            <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#00FFB2] text-black text-[9px] font-black uppercase px-2 py-1 rounded tracking-wide">Featured Match</span>
                <span className="text-[10px] font-bold text-gray-300 uppercase">{match.league}</span>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <img src={match.homeTeam.logo} className="w-8 h-8 object-contain" />
                    <span className="font-condensed font-black text-2xl uppercase text-white">{match.homeTeam.name}</span>
                </div>
                <span className="font-serif italic text-gray-300 text-lg">VS</span>
                <div className="flex items-center gap-3">
                    <span className="font-condensed font-black text-2xl uppercase text-white">{match.awayTeam.name}</span>
                    <img src={match.awayTeam.logo} className="w-8 h-8 object-contain" />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{formatMatchTime(match.time)}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenPweza(); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-xs px-4 py-2 rounded-lg transition-colors"
                >
                    Ask Pweza
                </button>
            </div>
        </div>
    </div>
);

const TrendingCard: React.FC<{ item: FeedItem, onClick: () => void }> = ({ item, onClick }) => {
    if ('homeTeam' in item) {
        const match = item as Match;
        return (
            <div onClick={onClick} className="min-w-[200px] bg-[#121212] border border-[#2C2C2C] rounded-lg p-3 cursor-pointer hover:border-[#00FFB2]/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <img src={match.homeTeam.logo} className="w-4 h-4 object-contain" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{match.league}</span>
                </div>
                <div className="text-xs text-white font-bold truncate">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{formatMatchTime(match.time)}</div>
            </div>
        );
    } else {
        const story = item as NewsStory;
        return (
            <div onClick={onClick} className="min-w-[200px] bg-[#121212] border border-[#2C2C2C] rounded-lg p-3 cursor-pointer hover:border-[#00FFB2]/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{story.source}</span>
                </div>
                <div className="text-xs text-white font-bold line-clamp-2 leading-tight">
                    {story.title}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{story.timestamp}</div>
            </div>
        );
    }
};

const SocialBuzzCard: React.FC<{ item: FeedItem, onClick: () => void }> = ({ item, onClick }) => {
    if ('homeTeam' in item) {
        const match = item as Match;
        return (
            <div onClick={onClick} className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-3 cursor-pointer hover:border-indigo-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Match Discussion</span>
                </div>
                <div className="text-sm text-white font-bold">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">Live fan reactions & predictions</div>
            </div>
        );
    } else {
        const story = item as NewsStory;
        return (
            <div onClick={onClick} className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-3 cursor-pointer hover:border-indigo-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <Twitter size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Social Buzz</span>
                </div>
                <div className="text-sm text-white font-bold line-clamp-2">
                    {story.title}
                </div>
                <div className="text-xs text-gray-400 mt-1">{story.likes} reactions</div>
            </div>
        );
    }
};

// NEW BLEACHER REPORT STYLE COMPONENTS
const TrendingNewsCard: React.FC<{ story: NewsStory, onClick: () => void }> = ({ story, onClick }) => (
    <div onClick={onClick} className="min-w-[280px] bg-[#121212] border border-[#2C2C2C] rounded-lg p-3 cursor-pointer hover:border-[#00FFB2]/50 transition-colors">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{story.source}</span>
            <span className="text-[10px] text-gray-600">• {story.timestamp}</span>
        </div>
        <div className="text-sm text-white font-bold line-clamp-2 leading-tight">
            {story.title}
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
);

const PollOption: React.FC<{ label: string, percentage: number, votes: number }> = ({ label, percentage, votes }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm text-white font-medium">{label}</span>
        <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#00FFB2] rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
            </div>
            <span className="text-xs text-gray-400 font-mono">{percentage}%</span>
        </div>
    </div>
);

const TweetCard: React.FC<{
    author: string;
    handle: string;
    avatar: string;
    content: string;
    timestamp: string;
    likes: number;
    retweets: number;
    image?: string;
}> = ({ author, handle, avatar, content, timestamp, likes, retweets, image }) => (
    <div className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-3">
        <div className="flex items-start gap-3">
            <img src={avatar} className="w-8 h-8 rounded-full" alt={author} />
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{author}</span>
                    <span className="text-xs text-gray-400">{handle}</span>
                    <span className="text-xs text-gray-600">• {timestamp}</span>
                </div>
                <p className="text-sm text-white leading-relaxed mb-2">{content}</p>
                {image && (
                    <img src={image} className="w-full rounded-lg mb-2" alt="Tweet image" />
                )}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-500">
                        <MessageSquare size={14} />
                        <span className="text-xs">{retweets}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                        <Flame size={14} />
                        <span className="text-xs">{likes.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// MATCH BUZZ CARD COMPONENT - 4-GRID CAROUSEL STYLE
const MatchBuzzCard: React.FC<{
    publisher: {
        name: string;
        avatar: string;
        type: 'official' | 'media' | 'team';
    };
    timestamp: string;
    content: {
        type: 'media' | 'text';
        mediaUrl?: string;
        text?: string;
    };
    caption: string;
    sourceUrl: string;
}> = ({ publisher, timestamp, content, caption, sourceUrl }) => (
    <div className="bg-black border border-gray-600 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer w-full aspect-square flex flex-col">
        {/* HEADER: Publisher info */}
        <div className="px-2 py-1.5 border-b border-gray-600">
            <div className="flex items-center gap-1.5 mb-0.5">
                <img
                    src={publisher.avatar}
                    alt={publisher.name}
                    className="w-4 h-4 rounded-full object-cover"
                />
                <span className="font-medium text-white text-xs truncate">
                    {publisher.name}
                </span>
                {publisher.type === 'official' && (
                    <div className="w-0.5 h-0.5 bg-[#00FFB2] rounded-full"></div>
                )}
            </div>
            <span className="text-[9px] text-gray-400">{timestamp}</span>
        </div>

        {/* CONTENT PREVIEW */}
        <div className="flex-1 px-2 py-1.5 flex items-center justify-center bg-black">
            {content.type === 'media' && content.mediaUrl ? (
                <div className="w-full h-full max-h-[80px] rounded overflow-hidden bg-[#121212]">
                    <img
                        src={content.mediaUrl}
                        alt="Content preview"
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className="w-full h-full max-h-[80px] bg-[#121212] rounded p-1.5 flex items-center justify-center">
                    <p className="text-xs text-gray-300 text-center line-clamp-3 leading-tight">
                        {content.text}
                    </p>
                </div>
            )}
        </div>

        {/* CAPTION */}
        <div className="px-2 py-1.5 border-t border-gray-600 bg-black">
            <p className="text-xs text-white font-medium line-clamp-2 leading-tight">
                {caption}
            </p>
        </div>

        {/* CTA BUTTON - BLACK BACKGROUND */}
        <div className="px-2 py-1.5 border-t border-gray-600 mt-auto bg-black">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    window.open(sourceUrl, '_blank');
                }}
                className="w-full bg-black text-white text-[10px] font-bold py-1.5 px-2 rounded border border-gray-600 hover:bg-gray-900 transition-colors"
            >
                View on X
            </button>
        </div>
    </div>
);

const VideoCard: React.FC<{
    title: string;
    thumbnail: string;
    duration: string;
    views: string;
    source: string;
}> = ({ title, thumbnail, duration, views, source }) => (
    <div className="relative rounded-lg overflow-hidden cursor-pointer group">
        <div className="aspect-video bg-gray-800 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                    <PlayCircle size={24} className="text-white fill-white ml-1" />
                </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                {duration}
            </div>
        </div>
        <div className="p-3 bg-[#121212]">
            <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1">{title}</h4>
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{source}</span>
                <span className="text-xs text-gray-500">{views} views</span>
            </div>
        </div>
    </div>
);

// CLEAN LEAGUE SECTION - NO DECORATIVE BACKGROUNDS
const LeagueSection: React.FC<{
    league: string;
    matches: Match[];
    news: NewsStory[];
    onMatchClick: (id: string) => void;
    onNewsClick?: (id: string) => void;
    onOpenPweza: (match: Match) => void;
    user: any;
}> = ({ league, matches, news, onMatchClick, onNewsClick, onOpenPweza, user }) => (
    <section className="px-4 pb-8">
        <div className="flex items-center gap-2 mb-4">
            <h2 className="font-condensed font-black text-xl text-white uppercase tracking-tighter">
                Around the {league}
            </h2>
        </div>

        <div className="space-y-4">
            {/* NEWS SECTION */}
            {news.length > 0 && (
                <div className="border border-[#2C2C2C] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold text-white text-sm uppercase tracking-wide">{league} News</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {news.map(story => (
                            <StandardNewsCard
                                key={story.id}
                                story={story}
                                onClick={() => onNewsClick?.(story.id)}
                                dataSaver={false}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* MATCHES SECTION */}
            {matches.length > 0 && (
                <div className="border border-[#2C2C2C] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold text-white text-sm uppercase tracking-wide">{league} Matches</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {matches.slice(0, 4).map(match => (
                            <PremiumPredictionCard
                                key={match.id}
                                match={match}
                                onClick={() => onMatchClick(match.id)}
                                onOpenPweza={() => onOpenPweza(match)}
                                isLocked={!user}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* TOP HIGHLIGHTS */}
            <div className="border border-[#2C2C2C] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-white text-sm uppercase tracking-wide">Top {league} Highlights</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <VideoCard
                        title={`${league} Goal of the Week! ⚽️`}
                        thumbnail="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop"
                        duration="1:45"
                        views="89K"
                        source={league}
                    />
                    <VideoCard
                        title={`Best Saves in ${league} This Week`}
                        thumbnail="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop"
                        duration="3:20"
                        views="156K"
                        source={league}
                    />
                </div>
            </div>

            {/* WHAT'S BUZZING - 4-GRID CAROUSEL */}
            <div className="border border-[#2C2C2C] rounded-lg">
                <div className="px-4 py-3 border-b border-[#2C2C2C]">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">What's Buzzing</h3>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-4 gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: `${league} Official`,
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "official"
                                }}
                                timestamp="1h"
                                content={{
                                    type: "text",
                                    text: `🔥 Big game coming up! Who are you backing this weekend? #${league.replace(/\s+/g, '')}`
                                }}
                                caption={`${league} title race intensifies with crucial weekend matchups ahead.`}
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Bleacher Report",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="2h"
                                content={{
                                    type: "media",
                                    mediaUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop"
                                }}
                                caption={`Key injury update: Star player returns for ${league} clash, could swing momentum.`}
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "ESPN",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="3h"
                                content={{
                                    type: "text",
                                    text: "Statistical breakdown shows defensive records could decide this matchup."
                                }}
                                caption={`Advanced stats reveal ${league} underdog has strong upset potential.`}
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Sky Sports",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="4h"
                                content={{
                                    type: "text",
                                    text: `Transfer rumors heating up as ${league} window approaches deadline.`
                                }}
                                caption={`${league} transfer market activity reaches fever pitch.`}
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "The Athletic",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="5h"
                                content={{
                                    type: "media",
                                    mediaUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop"
                                }}
                                caption={`Deep analysis: ${league} tactical trends that will define the season.`}
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: `${league} Fan Page`,
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="6h"
                                content={{
                                    type: "text",
                                    text: "Fan reactions pouring in as weekend fixtures approach. The excitement is building! ⚽️"
                                }}
                                caption={`Fan sentiment analysis shows high anticipation for ${league} weekend.`}
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Transfer News",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="7h"
                                content={{
                                    type: "text",
                                    text: `Latest ${league} transfer updates and contract negotiations.`
                                }}
                                caption={`${league} summer transfer window activity intensifies.`}
                                sourceUrl="#"
                            />
                        </div>
                        <div className="snap-start">
                            <MatchBuzzCard
                                publisher={{
                                    name: "Match Previews",
                                    avatar: "https://pbs.twimg.com/profile_images/default.jpg",
                                    type: "media"
                                }}
                                timestamp="8h"
                                content={{
                                    type: "text",
                                    text: `Expert analysis: ${league} weekend predictions and key matchups.`
                                }}
                                caption={`Comprehensive preview of all ${league} fixtures this weekend.`}
                                sourceUrl="#"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
