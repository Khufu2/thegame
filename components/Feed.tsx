

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Match, NewsStory, MatchStatus, SystemAlert, FeedItem } from '../types';
import { TrendingUp, Zap, Sun, MoreHorizontal, Flame, MessageSquare, PlayCircle, ArrowRight, ChevronRight, ChevronLeft, Sparkles, Filter, CloudRain, Wind, Thermometer, Info, Activity, Cloud, CloudSnow, Droplets, TrendingDown, Brain, Trophy, DollarSign, Clock, Play, BarChart2, Target, AlertTriangle, Terminal, Siren, Radar, Plus, ArrowUpRight, ChevronDown, LayoutGrid, Lock, ImageOff, Newspaper, Share2, Twitter, Facebook, Link, Youtube, Calendar, Users, Star, RefreshCw } from 'lucide-react';
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

// ===== NEW FEED STRUCTURE COMPONENTS =====

// SECTION 1: FEATURED MOMENT (Hero)
const FeaturedMoment: React.FC<{
  featuredItem: FeedItem | null;
  onItemClick: (item: FeedItem) => void;
}> = ({ featuredItem, onItemClick }) => {
  if (!featuredItem) return null;

  const isVideo = 'video_url' in featuredItem && featuredItem.video_url;
  const imageUrl = 'imageUrl' in featuredItem ? featuredItem.imageUrl :
                   'video_url' in featuredItem ? `https://img.youtube.com/vi/${featuredItem.video_url?.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg` : '';

  return (
    <section className="px-4 py-6">
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900/20 to-black shadow-2xl">
        {/* Background Image/Video */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Featured Moment"
            className="w-full h-full object-cover"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Play Button for Videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30 hover:scale-110 transition-transform cursor-pointer">
              <PlayCircle size={40} className="text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full tracking-wide">
              FEATURED MOMENT
            </span>
          </div>

          <h1 className="font-condensed font-black text-4xl md:text-5xl uppercase text-white leading-[0.9] mb-2 tracking-tight">
            {'title' in featuredItem ? featuredItem.title : 'Breaking Moment'}
          </h1>

          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
            {'summary' in featuredItem ? featuredItem.summary : 'A moment that changed the game'}
          </p>
        </div>

        {/* Click Handler */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => onItemClick(featuredItem)}
        />
      </div>
    </section>
  );
};

// SECTION 2: WHAT JUST HAPPENED (Trending Feed)
const WhatJustHappened: React.FC<{
  items: FeedItem[];
  onItemClick: (item: FeedItem) => void;
}> = ({ items, onItemClick }) => {
  // Get latest 8 items, mixed leagues, chronological
  const trendingItems = items.slice(0, 8);

  return (
    <section className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={20} className="text-blue-400" />
        <h2 className="font-condensed font-black text-xl uppercase text-white tracking-tighter">
          What Just Happened
        </h2>
      </div>

      <div className="space-y-3">
        {trendingItems.map((item, index) => (
          <TrendingItemCard
            key={index}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    </section>
  );
};

// Individual trending item card - Twitter/X style
const TrendingItemCard: React.FC<{
  item: FeedItem;
  onClick: () => void;
}> = ({ item, onClick }) => {
  const isMatch = 'homeTeam' in item;
  const isNews = 'source' in item;

  let title = '';
  let subtitle = '';
  let league = '';
  let timestamp = 'Just now';

  if (isMatch) {
    const match = item as Match;
    title = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    subtitle = match.status === MatchStatus.FINISHED ?
      `Final: ${match.score?.home ?? 0}-${match.score?.away ?? 0}` :
      formatMatchTime(match.time);
    league = match.league;
  } else if (isNews) {
    const news = item as NewsStory;
    title = news.title;
    subtitle = news.excerpt || '';
    league = news.tags?.[0] || '';
    timestamp = news.timestamp;
  }

  return (
    <div
      onClick={onClick}
      className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 cursor-pointer hover:border-blue-500/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* League/Icon indicator */}
        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
          {isMatch ? (
            <Trophy size={16} className="text-blue-400" />
          ) : (
            <Newspaper size={16} className="text-blue-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {league}
            </span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500">{timestamp}</span>
          </div>

          <h3 className="font-condensed font-bold text-white text-sm leading-tight line-clamp-2 mb-1">
            {title}
          </h3>

          {subtitle && (
            <p className="text-xs text-gray-400 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Thumbnail if available */}
        {isNews && (item as NewsStory).imageUrl && (
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={(item as NewsStory).imageUrl}
              alt="thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const Feed: React.FC<FeedProps> = ({ items, matches, onArticleClick, onOpenPweza, onTailBet }) => {
  const { user } = useSports();
  const [activeLeague, setActiveLeague] = useState("All"); // Default to All for more content
  const navigate = useNavigate();
  const dataSaver = user?.preferences.dataSaver || false;
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<NewsStory | null>(null);

  // DYNAMIC FEATURED VIDEO - Find the most recent video from feeds
  const featuredVideo = useMemo(() => {
    // Look for news stories with video_url (featured videos from admin)
    const videoStories = items.filter(item =>
      'source' in item && (item as NewsStory).video_url
    ) as NewsStory[];

    if (videoStories.length > 0) {
      const latestVideo = videoStories[0]; // Assuming items are sorted by recency
      return {
        id: latestVideo.id,
        title: latestVideo.title,
        thumbnail: latestVideo.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
        duration: '2:34', // Could be extracted from video metadata
        views: 'Featured',
        source: latestVideo.source,
        url: latestVideo.video_url,
        story: latestVideo
      };
    }

    // Fallback to default
    return {
      id: 'featured_1',
      title: 'Incredible Last-Minute Winner! ⚽️',
      thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
      duration: '2:34',
      views: '125K',
      source: 'Premier League',
      url: '#'
    };
  }, [items]);
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

  // LIVE TICKER MATCHES - Always show live games first, then soonest upcoming
  const safeMatchesForTicker = Array.isArray(matches) ? matches : [];
  const liveTickerMatches = safeMatchesForTicker.filter(m => m.status === MatchStatus.LIVE);
  
  // Get upcoming matches sorted by time (soonest first)
  const upcomingMatches = safeMatchesForTicker
    .filter(m => m.status === MatchStatus.SCHEDULED || m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  
  // Combine: Live games first, then fill with soonest upcoming (always show at least 3)
  const happeningNowMatches = useMemo(() => {
    if (liveTickerMatches.length > 0) {
      // If we have live games, show them + fill remaining slots with upcoming
      const remainingSlots = Math.max(0, 5 - liveTickerMatches.length);
      return [...liveTickerMatches, ...upcomingMatches.slice(0, remainingSlots)];
    }
    // No live games - show soonest upcoming (at least 3)
    return upcomingMatches.slice(0, 5);
  }, [liveTickerMatches, upcomingMatches]);

  const hasLiveGames = liveTickerMatches.length > 0;
  
  const handleMatchClick = (id: string) => {
      navigate(`/match/${id}`);
  };

  const openPwezaForMatch = (match: Match) => {
      const prompt = `Give me a quick 50-word sharp betting insight for ${match.homeTeam.name} vs ${match.awayTeam.name}. Focus on value and key stats.`;
      onOpenPweza?.(prompt);
  };

  return (
    <div className="min-h-screen bg-black md:bg-br-bg md:max-w-[1000px] md:mx-auto pb-24 overflow-x-hidden">
      
      {/* 1. TOP SECTION: HAPPENING NOW (ALWAYS VISIBLE) */}
      <section className="pt-2 pb-1 bg-black md:bg-br-bg">
        <div className="flex items-center gap-2 px-4 mb-2">
             {hasLiveGames ? (
               <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
             ) : (
               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             )}
             <h2 className="font-condensed font-bold text-sm uppercase tracking-wider text-gray-500 md:text-gray-400">
               {hasLiveGames ? 'Happening Now' : 'Coming Up'}
             </h2>
             {hasLiveGames && (
               <span className="text-[10px] font-bold text-red-500 uppercase ml-2">{liveTickerMatches.length} Live</span>
             )}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory">
            {happeningNowMatches.length > 0 ? (
              happeningNowMatches.map((match) => (
                  match && <LivePulseCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
              ))
            ) : (
              <div className="w-full py-6 text-center text-gray-500">
                <span className="text-sm">No matches scheduled</span>
              </div>
            )}
        </div>
      </section>

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

        {/* WHAT JUST HAPPENED (Trending Feed) */}
        <WhatJustHappened
          items={items}
          onItemClick={(item) => {
            if ('source' in item) {
              onArticleClick?.((item as NewsStory).id);
            } else {
              handleMatchClick((item as Match).id);
            }
          }}
        />

        {/* TODAY'S PREDICTIONS */}
        <TodaysPredictions
          matches={matches}
          onMatchClick={handleMatchClick}
          onOpenPweza={openPwezaForMatch}
          user={user}
        />

        {/* LEAGUE SPOTLIGHT BLOCKS */}
        {['EPL', 'Bundesliga', 'Serie A', 'NBA'].map((league) => {
          const leagueMatches = Array.isArray(matches) ? matches.filter(m => m.league === league) : [];
          const leagueNews = items.filter(item => 'tags' in item && (item as NewsStory).tags?.includes(league)).slice(0, 3) as NewsStory[];

          return (
            <LeagueSpotlight
              key={league}
              league={league}
              matches={leagueMatches}
              news={leagueNews}
              onMatchClick={handleMatchClick}
              onNewsClick={onArticleClick}
              onOpenPweza={openPwezaForMatch}
              user={user}
            />
          );
        })}

        {/* DEEP DIVE (Meta Content Hub) */}
        <DeeperContext
          items={items}
          onItemClick={(item) => {
            if ('source' in item) {
              onArticleClick?.((item as NewsStory).id);
            }
          }}
        />

        {/* CONTINUOUS FEED (Endless Scroll) */}
        <ContinuousFeed
          items={items}
          matches={matches}
          onItemClick={(item) => {
            if ('source' in item) {
              onArticleClick?.((item as NewsStory).id);
            } else {
              handleMatchClick((item as Match).id);
            }
          }}
          onMatchClick={handleMatchClick}
          onOpenPweza={openPwezaForMatch}
          user={user}
        />

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
    
    // SECTION 3: TODAY'S PREDICTIONS
    const TodaysPredictions: React.FC<{
      matches: Match[];
      onMatchClick: (id: string) => void;
      onOpenPweza: (match: Match) => void;
      user: any;
    }> = ({ matches, onMatchClick, onOpenPweza, user }) => {
      // Get top 5 matches with predictions for today
      const todaysPicks = matches
        .filter(match => match.prediction)
        .sort((a, b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0))
        .slice(0, 5);
    
      if (todaysPicks.length === 0) return null;
    
      return (
        <section className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-green-400" />
            <h2 className="font-condensed font-black text-xl uppercase text-white tracking-tighter">
              Today's Picks
            </h2>
          </div>
    
          <div className="space-y-3">
            {todaysPicks.map((match, index) => (
              <PredictionCard
                key={match.id}
                match={match}
                onClick={() => onMatchClick(match.id)}
                onOpenPweza={() => onOpenPweza(match)}
                isLocked={!user}
                showVerdict={false} // Will be handled separately
              />
            ))}
          </div>
        </section>
      );
    };
    
    // Enhanced Prediction Card for Today's Picks
    const PredictionCard: React.FC<{
      match: Match;
      onClick: () => void;
      onOpenPweza: () => void;
      isLocked?: boolean;
      showVerdict?: boolean;
    }> = ({ match, onClick, onOpenPweza, isLocked, showVerdict = false }) => {
      const confidence = match.prediction?.confidence || 0;
      const outcome = match.prediction?.outcome;
    
      const getConfidenceColor = (conf: number) => {
        if (conf >= 80) return 'text-green-400 border-green-400/30 bg-green-400/10';
        if (conf >= 60) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      };
    
      const getConfidenceLabel = (conf: number) => {
        if (conf >= 80) return 'Lock';
        if (conf >= 60) return 'Safe';
        return 'Risk';
      };
    
      return (
        <div
          onClick={onClick}
          className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 cursor-pointer hover:border-indigo-500/50 transition-colors relative"
        >
          {/* GUEST LOCK OVERLAY */}
          {isLocked && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-2 rounded-xl">
              <Lock size={16} className="text-white/70" />
              <span className="font-condensed font-black text-sm uppercase text-white tracking-wide">Member Access Only</span>
            </div>
          )}
    
          <div className={`relative z-10 ${isLocked ? 'blur-sm select-none' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {match.league}
                </span>
                <span className="text-xs text-gray-600">•</span>
                <span className="text-xs text-gray-500">{formatMatchTime(match.time)}</span>
              </div>
    
              <div className={`px-2 py-1 rounded border text-xs font-bold uppercase ${getConfidenceColor(confidence)}`}>
                {getConfidenceLabel(confidence)}
              </div>
            </div>
    
            {/* Teams */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src={match.homeTeam.logo} className="w-8 h-8 object-contain" />
                <span className="font-condensed font-bold text-white text-lg uppercase">
                  {match.homeTeam.name}
                </span>
              </div>
    
              <span className="font-serif italic text-gray-500 text-sm">vs</span>
    
              <div className="flex items-center gap-3">
                <span className="font-condensed font-bold text-white text-lg uppercase">
                  {match.awayTeam.name}
                </span>
                <img src={match.awayTeam.logo} className="w-8 h-8 object-contain" />
              </div>
            </div>
    
            {/* Prediction */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-400">Sheena's Pick:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-condensed font-black text-xl text-white uppercase">
                    {outcome === 'HOME' ? match.homeTeam.name :
                     outcome === 'AWAY' ? match.awayTeam.name :
                     outcome === 'DRAW' ? 'Draw' : 'Analyzing...'}
                  </span>
                  {match.prediction?.odds && (
                    <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">
                      {outcome === 'HOME' ? match.prediction.odds.home :
                       outcome === 'AWAY' ? match.prediction.odds.away :
                       outcome === 'DRAW' ? match.prediction.odds.draw : '—'} odds
                    </span>
                  )}
                </div>
              </div>
    
              <button
                onClick={(e) => { e.stopPropagation(); onOpenPweza(); }}
                className="w-10 h-10 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 flex items-center justify-center text-indigo-400 transition-colors"
              >
                🐙
              </button>
            </div>
    
            {/* Verdict Overlay (if match is finished) */}
            {showVerdict && match.status === MatchStatus.FINISHED && match.prediction && (
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur rounded-lg px-2 py-1">
                <span className="text-xs font-bold text-white">
                  {match.prediction.outcome === 'HOME' && match.score?.home! > match.score?.away! ? '✅ Correct' :
                   match.prediction.outcome === 'AWAY' && match.score?.away! > match.score?.home! ? '✅ Correct' :
                   match.prediction.outcome === 'DRAW' && match.score?.home === match.score?.away ? '✅ Correct' :
                   '❌ Incorrect'}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    };
    
    // SECTION 5: DEEPER CONTEXT (Meta Content Hub)
    const DeeperContext: React.FC<{
      items: FeedItem[];
      onItemClick: (item: FeedItem) => void;
    }> = ({ items, onItemClick }) => {
      // Filter for meta content (power rankings, storylines, players to watch, injury roundups)
      const metaContent = items.filter(item =>
        'tags' in item && (
          (item as NewsStory).tags?.includes('power-rankings') ||
          (item as NewsStory).tags?.includes('top-storylines') ||
          (item as NewsStory).tags?.includes('players-to-watch') ||
          (item as NewsStory).tags?.includes('injury-roundup') ||
          (item as NewsStory).tags?.includes('analysis')
        )
      ) as NewsStory[];
    
      if (metaContent.length === 0) return null;
    
      // Group by type
      const groupedContent = metaContent.reduce((acc, item) => {
        const type = item.tags?.find(tag =>
          ['power-rankings', 'top-storylines', 'players-to-watch', 'injury-roundup'].includes(tag)
        ) || 'analysis';
    
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
      }, {} as Record<string, NewsStory[]>);
    
      return (
        <section className="px-4 py-6 border-t border-[#2C2C2C]">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={20} className="text-purple-400" />
            <h2 className="font-condensed font-black text-xl uppercase text-white tracking-tighter">
              Deep Dive
            </h2>
          </div>
    
          <div className="space-y-4">
            {Object.entries(groupedContent).map(([type, stories]) => (
              <MetaContentCard
                key={type}
                type={type}
                stories={stories}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        </section>
      );
    };
    
    // Meta Content Card - For deeper analysis content
    const MetaContentCard: React.FC<{
      type: string;
      stories: NewsStory[];
      onItemClick: (item: FeedItem) => void;
    }> = ({ type, stories, onItemClick }) => {
      const getTypeLabel = (type: string) => {
        switch (type) {
          case 'power-rankings': return 'Power Rankings';
          case 'top-storylines': return 'Top 5 Storylines';
          case 'players-to-watch': return 'Players to Watch';
          case 'injury-roundup': return 'Injury Roundup';
          default: return 'Analysis';
        }
      };
    
      const getTypeIcon = (type: string) => {
        switch (type) {
          case 'power-rankings': return <Trophy size={16} className="text-yellow-400" />;
          case 'top-storylines': return <TrendingUp size={16} className="text-blue-400" />;
          case 'players-to-watch': return <Users size={16} className="text-green-400" />;
          case 'injury-roundup': return <Activity size={16} className="text-red-400" />;
          default: return <Brain size={16} className="text-purple-400" />;
        }
      };
    
      return (
        <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            {getTypeIcon(type)}
            <h3 className="font-condensed font-bold text-lg uppercase text-white tracking-wide">
              {getTypeLabel(type)}
            </h3>
          </div>
    
          <div className="space-y-3">
            {stories.slice(0, 3).map((story, index) => (
              <div
                key={story.id}
                onClick={() => onItemClick(story)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#252525] cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-300">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-condensed font-bold text-sm text-white line-clamp-2 leading-tight">
                    {story.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {story.excerpt}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">{story.timestamp}</span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">{story.source}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    // SECTION 6: CONTINUOUS FEED (Endless Scroll)
    const ContinuousFeed: React.FC<{
      items: FeedItem[];
      matches: Match[];
      onItemClick: (item: FeedItem) => void;
      onMatchClick: (id: string) => void;
      onOpenPweza: (match: Match) => void;
      user: any;
    }> = ({ items, matches, onItemClick, onMatchClick, onOpenPweza, user }) => {
      const [visibleItems, setVisibleItems] = useState<FeedItem[]>([]);
      const [loading, setLoading] = useState(false);
      const [hasMore, setHasMore] = useState(true);
    
      // Organize remaining content by priority tiers
      const organizeContent = useMemo(() => {
        const remainingItems = items.slice(8); // Skip items used in main sections
        const remainingMatches = matches.filter(m => !m.prediction || m.prediction.confidence < 70); // Skip top predictions
    
        // Tier 1: Hot content (older post-match, recent verdicts, injuries)
        const tier1 = [
          ...remainingItems.filter(item =>
            'source' in item && (
              (item as NewsStory).tags?.includes('post-match') ||
              (item as NewsStory).tags?.includes('verdict') ||
              (item as NewsStory).tags?.includes('injury')
            )
          ),
          ...remainingMatches.filter(m => m.status === MatchStatus.FINISHED).slice(0, 5)
        ];
    
        // Tier 2: Relevant content (previews, explainers, features)
        const tier2 = [
          ...remainingItems.filter(item =>
            'source' in item && (
              (item as NewsStory).tags?.includes('preview') ||
              (item as NewsStory).tags?.includes('analysis') ||
              (item as NewsStory).tags?.includes('feature')
            )
          ),
          ...remainingMatches.filter(m => m.status === MatchStatus.SCHEDULED).slice(0, 5)
        ];
    
        // Tier 3: Archive content (old recaps, historical)
        const tier3 = [
          ...remainingItems.filter(item =>
            'source' in item && (
              (item as NewsStory).tags?.includes('recap') ||
              (item as NewsStory).tags?.includes('historical') ||
              (item as NewsStory).tags?.includes('long-form')
            )
          ),
          ...remainingMatches.slice(10) // Very old matches
        ];
    
        return { tier1, tier2, tier3 };
      }, [items, matches]);
    
      // Load initial content
      useEffect(() => {
        const initialLoad = [
          ...organizeContent.tier1.slice(0, 6),
          ...organizeContent.tier2.slice(0, 4),
          ...organizeContent.tier3.slice(0, 2)
        ];
        setVisibleItems(initialLoad);
      }, [organizeContent]);
    
      // Load more content
      const loadMore = useCallback(() => {
        if (loading || !hasMore) return;
    
        setLoading(true);
    
        // Simulate API delay
        setTimeout(() => {
          const currentLength = visibleItems.length;
          const nextBatch = [
            ...organizeContent.tier1.slice(currentLength, currentLength + 3),
            ...organizeContent.tier2.slice(Math.max(0, currentLength - organizeContent.tier1.length), currentLength - organizeContent.tier1.length + 3),
            ...organizeContent.tier3.slice(Math.max(0, currentLength - organizeContent.tier1.length - organizeContent.tier2.length), currentLength - organizeContent.tier1.length - organizeContent.tier2.length + 2)
          ];
    
          if (nextBatch.length === 0) {
            setHasMore(false);
          } else {
            setVisibleItems(prev => [...prev, ...nextBatch]);
          }
    
          setLoading(false);
        }, 1000);
      }, [visibleItems, organizeContent, loading, hasMore]);
    
      // Infinite scroll trigger
      useEffect(() => {
        const handleScroll = () => {
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
            loadMore();
          }
        };
    
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
      }, [loadMore]);
    
      // Group items with section dividers every 6-8 items
      const groupedItems = useMemo(() => {
        const groups = [];
        for (let i = 0; i < visibleItems.length; i += 7) {
          const sectionType = ['news', 'prediction', 'insight'][i % 3];
          groups.push({
            type: sectionType,
            items: visibleItems.slice(i, i + 7)
          });
        }
        return groups;
      }, [visibleItems]);
    
      return (
        <section className="px-4 py-6 border-t border-[#2C2C2C]">
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw size={20} className="text-gray-400" />
            <h2 className="font-condensed font-black text-xl uppercase text-white tracking-tighter">
              More Stories
            </h2>
          </div>
    
          <div className="space-y-8">
            {groupedItems.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Section Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-1 bg-[#1E1E1E] rounded-full">
                    {group.type === 'news' ? 'Latest News' :
                     group.type === 'prediction' ? 'Prediction Hub' :
                     'Deep Analysis'}
                  </span>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1" />
                </div>
    
                {/* Items */}
                <div className="space-y-4">
                  {group.items.map((item, itemIndex) => {
                    if ('homeTeam' in item) {
                      const match = item as Match;
                      return (
                        <div key={match.id} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase">{match.league}</span>
                            <span className="text-xs text-gray-500">{formatMatchTime(match.time)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={match.homeTeam.logo} className="w-8 h-8 object-contain" />
                              <span className="font-condensed font-bold text-white">{match.homeTeam.name}</span>
                            </div>
                            <span className="font-serif italic text-gray-500 text-sm">vs</span>
                            <div className="flex items-center gap-3">
                              <span className="font-condensed font-bold text-white">{match.awayTeam.name}</span>
                              <img src={match.awayTeam.logo} className="w-8 h-8 object-contain" />
                            </div>
                          </div>
                          {match.prediction && (
                            <div className="mt-3 pt-3 border-t border-[#2C2C2C]">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Prediction:</span>
                                <span className="font-condensed font-bold text-indigo-400">
                                  {match.prediction.outcome === 'HOME' ? match.homeTeam.name :
                                   match.prediction.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      const story = item as NewsStory;
                      return (
                        <div
                          key={story.id}
                          onClick={() => onItemClick(story)}
                          className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 cursor-pointer hover:border-indigo-500/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {story.imageUrl && (
                              <img
                                src={story.imageUrl}
                                alt={story.title}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">{story.source}</span>
                                <span className="text-xs text-gray-600">•</span>
                                <span className="text-xs text-gray-500">{story.timestamp}</span>
                              </div>
                              <h3 className="font-condensed font-bold text-lg text-white line-clamp-2 leading-tight">
                                {story.title}
                              </h3>
                              <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                                {story.excerpt}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ))}
          </div>
    
          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="animate-spin text-gray-500" />
              <span className="ml-3 text-gray-500">Loading more stories...</span>
            </div>
          )}
    
          {/* End of content */}
          {!hasMore && visibleItems.length > 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm">
                You've reached the end of today's content
              </div>
              <div className="text-gray-600 text-xs mt-1">
                Check back tomorrow for fresh updates
              </div>
            </div>
          )}
        </section>
      );
    };
    
    // SECTION 4: LEAGUE SPOTLIGHT (Repeatable Structure)
    const LeagueSpotlight: React.FC<{
      league: string;
      matches: Match[];
      news: NewsStory[];
      onMatchClick: (id: string) => void;
      onNewsClick: (id: string) => void;
      onOpenPweza: (match: Match) => void;
      user: any;
    }> = ({ league, matches, news, onMatchClick, onNewsClick, onOpenPweza, user }) => {
      // Get league-specific data
      const leagueMatches = matches.filter(m => m.league === league);
      const leagueNews = news.filter(n => n.tags?.includes(league));
    
      // League hero: most recent important story
      const leagueHero = leagueNews.find(n => n.type === 'HIGHLIGHT') || leagueNews[0];
    
      // Quick hits: 2-4 recent items
      const quickHits = [...leagueMatches.slice(0, 2), ...leagueNews.slice(0, 2)].slice(0, 4);
    
      // League insight: power rankings or key stat
      const leagueInsight = leagueNews.find(n => n.tags?.includes('power-rankings') || n.tags?.includes('analysis'));
    
      return (
        <section className="px-4 py-6 border-t border-[#2C2C2C]">
          {/* A) League Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">
                {league === 'EPL' ? '⚽' :
                 league === 'Bundesliga' ? '🇩🇪' :
                 league === 'Serie A' ? '🇮🇹' :
                 league === 'NBA' ? '🏀' : '⚽'}
              </span>
            </div>
            <h2 className="font-condensed font-black text-2xl uppercase text-white tracking-tighter">
              {league === 'EPL' ? 'Premier League' : league}
            </h2>
          </div>
    
          {/* B) League Hero Highlight */}
          {leagueHero && (
            <div className="mb-6">
              <LeagueHeroCard
                story={leagueHero}
                onClick={() => onNewsClick(leagueHero.id)}
              />
            </div>
          )}
    
          {/* C) League Quick Hits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {quickHits.map((item, index) => (
              <QuickHitCard
                key={index}
                item={item}
                onClick={() => 'homeTeam' in item ? onMatchClick((item as Match).id) : onNewsClick((item as NewsStory).id)}
              />
            ))}
          </div>
    
          {/* D) League Social/X Pulse */}
          <div className="mb-6">
            <LeagueSocialPulse league={league} />
          </div>
    
          {/* E) League Insight/Meta */}
          {leagueInsight && (
            <div className="mb-6">
              <LeagueInsightCard
                story={leagueInsight}
                onClick={() => onNewsClick(leagueInsight.id)}
              />
            </div>
          )}
    
          {/* League Picks (Predictions) */}
          {leagueMatches.filter(m => m.prediction).length > 0 && (
            <div>
              <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-3 tracking-wide">
                {league} Picks
              </h3>
              <div className="space-y-2">
                {leagueMatches
                  .filter(m => m.prediction)
                  .slice(0, 3)
                  .map(match => (
                    <CompactPredictionCard
                      key={match.id}
                      match={match}
                      onClick={() => onMatchClick(match.id)}
                      isLocked={!user}
                    />
                  ))}
              </div>
            </div>
          )}
        </section>
      );
    };
    
    // League Hero Card - Featured story for the league
    const LeagueHeroCard: React.FC<{
      story: NewsStory;
      onClick: () => void;
    }> = ({ story, onClick }) => (
      <div
        onClick={onClick}
        className="relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer group shadow-lg"
      >
        {story.imageUrl && (
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-condensed font-black text-xl uppercase text-white leading-tight line-clamp-2 mb-2">
            {story.title}
          </h3>
          <p className="text-sm text-gray-300 line-clamp-2">
            {story.excerpt}
          </p>
        </div>
      </div>
    );
    
    // Quick Hit Card - Small cards for recent activity
    const QuickHitCard: React.FC<{
      item: FeedItem;
      onClick: () => void;
    }> = ({ item, onClick }) => {
      const isMatch = 'homeTeam' in item;
      const isNews = 'source' in item;
    
      let title = '';
      let subtitle = '';
      let icon = <Trophy size={16} className="text-blue-400" />;
    
      if (isMatch) {
        const match = item as Match;
        title = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
        subtitle = match.status === MatchStatus.FINISHED ?
          `Final: ${match.score?.home ?? 0}-${match.score?.away ?? 0}` :
          formatMatchTime(match.time);
      } else if (isNews) {
        const news = item as NewsStory;
        title = news.title;
        subtitle = news.timestamp;
        icon = <Newspaper size={16} className="text-green-400" />;
      }
    
      return (
        <div
          onClick={onClick}
          className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg p-3 cursor-pointer hover:border-indigo-500/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-condensed font-bold text-sm text-white line-clamp-2 leading-tight">
                {title}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      );
    };
    
    // League Social Pulse - Fan reactions section
    const LeagueSocialPulse: React.FC<{
      league: string;
    }> = ({ league }) => {
      // Mock social reactions - in real app, fetch from API
      const reactions = [
        { text: "That refereeing was criminal...", likes: 1240, time: "2h" },
        { text: "Best performance of the season", likes: 892, time: "4h" },
        { text: "Unbelievable comeback! 🔥", likes: 654, time: "6h" }
      ];
    
      return (
        <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-pink-400" />
            <span className="font-bold text-white text-sm uppercase tracking-wide">Fan Reactions</span>
          </div>
    
          <div className="space-y-3">
            {reactions.map((reaction, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">F</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    "{reaction.text}"
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Flame size={12} />
                      <span className="text-xs">{reaction.likes.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-gray-600">{reaction.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    // League Insight Card - Power rankings, analysis, etc.
    const LeagueInsightCard: React.FC<{
      story: NewsStory;
      onClick: () => void;
    }> = ({ story, onClick }) => (
      <div
        onClick={onClick}
        className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-4 cursor-pointer hover:border-indigo-500/50 transition-colors"
      >
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-indigo-400" />
          <span className="font-bold text-indigo-400 text-sm uppercase tracking-wide">
            {story.tags?.includes('power-rankings') ? 'Power Rankings' : 'League Insight'}
          </span>
        </div>
    
        <h3 className="font-condensed font-bold text-lg text-white leading-tight line-clamp-2 mb-2">
          {story.title}
        </h3>
    
        <p className="text-sm text-gray-300 line-clamp-3">
          {story.excerpt}
        </p>
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

// BLEACHER REPORT STYLE - WHAT'S BUZZING SECTION
const WhatsBuzzingSection: React.FC = () => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const buzzCards = [
        {
            source: { name: "Grind City Media", verified: true, logo: "B·R" },
            time: "3h",
            image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400&auto=format&fit=crop",
            isVideo: true,
            caption: "",
        },
        {
            source: { name: "NBA", verified: true, logo: "B·R" },
            time: "3h",
            image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=400&auto=format&fit=crop",
            isVideo: false,
            caption: "NBA STANDINGS UPDATE ‼️ MEM (#9 in West) improves to 8-3 in its last 11 📈 CHI",
        },
        {
            source: { name: "NBA", verified: true, logo: "B·R" },
            time: "3h",
            image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=400&auto=format&fit=crop",
            isVideo: false,
            caption: "NBA STANDINGS UPDATE ‼️ MEM (#9 in West) wins 2nd straight, 8-3 in last 11 📈 CHI",
        },
        {
            source: { name: "NBA", verified: true, logo: "B·R" },
            time: "3h",
            image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=400&auto=format&fit=crop",
            isVideo: false,
            caption: "🏀 WEDNESDAY'S FINAL SCORES 🏀 Jaren Jackson Jr. and the @memgrizz win on the road and",
        },
    ];

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 280;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="bg-[#1a1a1a] rounded-xl mt-6 overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3">
                <h3 className="font-bold text-[#FFD700] text-sm uppercase tracking-widest">
                    What's Buzzing
                </h3>
                <div className="flex items-center gap-3">
                    <a href="#" className="text-gray-400 hover:text-white text-xs font-medium transition-colors">
                        Go to Social
                    </a>
                    <div className="flex gap-1">
                        <button
                            onClick={() => scroll('left')}
                            className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-8 h-8 rounded-full border border-gray-600 bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CARDS CAROUSEL */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4 snap-x snap-mandatory"
            >
                {buzzCards.map((card, index) => (
                    <BRBuzzCard key={index} card={card} />
                ))}
            </div>
        </div>
    );
};

// Bleacher Report Style Buzz Card
const BRBuzzCard: React.FC<{
    card: {
        source: { name: string; verified: boolean; logo: string };
        time: string;
        image: string;
        isVideo: boolean;
        caption: string;
    };
}> = ({ card }) => (
    <div className="snap-start shrink-0 w-[220px] bg-[#252525] rounded-lg overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors">
        {/* HEADER */}
        <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <span className="text-white text-[8px] font-black">{card.source.logo}</span>
            </div>
            <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-white text-xs font-medium truncate">{card.source.name}</span>
                {card.source.verified && (
                    <svg className="w-3 h-3 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                )}
            </div>
            <span className="text-gray-500 text-[10px] shrink-0">{card.time}</span>
        </div>

        {/* IMAGE/VIDEO */}
        <div className="relative aspect-[4/3] bg-black">
            <img
                src={card.image}
                alt="Buzz content"
                className="w-full h-full object-cover"
            />
            {card.isVideo && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px]">
                    <PlayCircle size={12} className="fill-white" />
                    <span>Video thumbnail</span>
                </div>
            )}
        </div>

        {/* CAPTION */}
        {card.caption && (
            <div className="px-3 py-2">
                <p className="text-white text-xs leading-relaxed line-clamp-3">
                    {card.caption}
                </p>
            </div>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700">
            <span className="text-gray-400 text-[10px]">View on X</span>
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
        </div>
    </div>
);

const VideoCard: React.FC<{
    title: string;
    thumbnail: string;
    duration: string;
    views: string;
    source: string;
    videoUrl?: string;
    onClick?: () => void;
}> = ({ title, thumbnail, duration, views, source, videoUrl, onClick }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handleClick = () => {
        if (videoUrl && videoUrl !== '#') {
            setIsPlaying(true);
            if (onClick) onClick();
        } else {
            // Fallback: open in new tab
            window.open(videoUrl, '_blank');
        }
    };

    return (
        <div className="relative rounded-lg overflow-hidden cursor-pointer group" onClick={handleClick}>
            <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                {!isPlaying ? (
                    <>
                        <img
                            src={thumbnail}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                                <PlayCircle size={24} className="text-white fill-white ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                            {duration}
                        </div>
                    </>
                ) : (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoUrl?.split('v=')[1]?.split('&')[0]}?autoplay=1`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={title}
                    />
                )}
            </div>
            {!isPlaying && (
                <div className="p-3 bg-[#121212]">
                    <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1">{title}</h4>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{source}</span>
                        <span className="text-xs text-gray-500">{views} views</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// CLEAN LEAGUE SECTION - PRIORITIZE NEWS OVER MATCHES
const LeagueSection: React.FC<{
    league: string;
    matches: Match[];
    news: NewsStory[];
    onMatchClick: (id: string) => void;
    onNewsClick?: (id: string) => void;
    onOpenPweza: (match: Match) => void;
    user: any;
}> = ({ league, matches, news, onMatchClick, onNewsClick, onOpenPweza, user }) => (
    <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
            <h2 className="font-condensed font-black text-xl text-white uppercase tracking-tighter">
                Around the {league}
            </h2>
            <button className="text-xs text-gray-400 hover:text-white transition-colors">
                See All
            </button>
        </div>

        {/* NEWS CARDS - MAIN FOCUS (Always show news first) */}
        {news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {news.slice(0, 3).map(story => (
                    <LeagueNewsCard
                        key={story.id}
                        story={story}
                        onClick={() => onNewsClick?.(story.id)}
                    />
                ))}
            </div>
        ) : (
            <div className="bg-[#1a1a1a] rounded-lg p-6 text-center mb-4">
                <Newspaper size={24} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No {league} news available</p>
            </div>
        )}

        {/* WHAT'S BUZZING FOR THIS LEAGUE */}
        <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <span className="text-[#FFD700] text-xs font-bold uppercase tracking-wider">What's Buzzing</span>
                    <span className="text-gray-600 text-[10px]">in {league}</span>
                </div>
                <a href="#" className="text-gray-500 hover:text-white text-[10px] transition-colors flex items-center gap-1">
                    View all <ChevronRight size={12} />
                </a>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar p-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="snap-start shrink-0 w-[180px] bg-[#252525] rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 px-2 py-1.5">
                            <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                                <span className="text-white text-[7px] font-black">B·R</span>
                            </div>
                            <span className="text-white text-[10px] font-medium truncate">{league}</span>
                            <span className="text-blue-400 text-[8px]">✓</span>
                            <span className="text-gray-500 text-[9px] ml-auto">{i}h</span>
                        </div>
                        <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <span className="text-white text-3xl font-black opacity-20">B·R</span>
                        </div>
                        <div className="px-2 py-1.5">
                            <p className="text-white text-[10px] leading-tight line-clamp-2">
                                {league} update: Key match developments and player news...
                            </p>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-700">
                            <span className="text-gray-500 text-[9px]">View on X</span>
                            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// League News Card - Clean modern design
const LeagueNewsCard: React.FC<{
    story: NewsStory;
    onClick: () => void;
}> = ({ story, onClick }) => (
    <div
        onClick={onClick}
        className="bg-[#1a1a1a] rounded-lg overflow-hidden cursor-pointer hover:bg-[#222] transition-colors group"
    >
        {story.imageUrl && (
            <div className="aspect-video relative overflow-hidden">
                <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
        )}
        <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{story.source}</span>
                <span className="text-gray-600 text-[10px]">•</span>
                <span className="text-[10px] text-gray-600">{story.timestamp}</span>
            </div>
            <h4 className="text-white text-sm font-bold leading-tight line-clamp-2 group-hover:text-[#00FFB2] transition-colors">
                {story.title}
            </h4>
            {story.excerpt && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{story.excerpt}</p>
            )}
        </div>
    </div>
);
