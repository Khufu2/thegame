import React, { useState, useMemo, useEffect } from 'react';
import { Search, TrendingUp, Hash, Users, ArrowRight, Shield, CheckCircle2, Plus, X, Newspaper, Trophy, Calculator, DollarSign, Trash2, Calendar, LayoutGrid, Sparkles, UserPlus, MessageCircle, Flame, Check } from 'lucide-react';
import { useSports } from '../context/SportsContext';
import { useNavigate } from 'react-router-dom';
import { Match, NewsStory, MatchStatus } from '../types';
import supabase from '../services/supabaseClient';

interface League {
  id: string;
  name: string;
  code: string | null;
  logo_url: string | null;
  country: string | null;
}

// Generate trending topics from actual matches
const generateTrendingTopics = (matches: Match[]) => {
  const liveMatches = matches.filter(m => m.status === MatchStatus.LIVE);
  const recentFinished = matches.filter(m => m.status === MatchStatus.FINISHED).slice(0, 3);
  
  const topics: { id: string; name: string; category: string; posts: string; isLive: boolean }[] = [];
  
  // Add live matches as trending
  liveMatches.slice(0, 2).forEach((m, i) => {
    topics.push({
      id: `live-${i}`,
      name: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
      category: m.league || 'Football',
      posts: `${Math.floor(Math.random() * 50 + 10)}K`,
      isLive: true,
    });
  });
  
  // Add high-scoring finished matches
  recentFinished.forEach((m, i) => {
    const totalGoals = (m.score?.home || 0) + (m.score?.away || 0);
    if (totalGoals >= 3) {
      topics.push({
        id: `result-${i}`,
        name: `${m.homeTeam.name} ${m.score?.home}-${m.score?.away} ${m.awayTeam.name}`,
        category: m.league || 'Football',
        posts: `${Math.floor(Math.random() * 30 + 5)}K`,
        isLive: false,
      });
    }
  });
  
  // Fallback topics if no matches
  if (topics.length < 2) {
    topics.push(
      { id: 'default-1', name: 'Champions League Action', category: 'UCL', posts: '45K', isLive: false },
      { id: 'default-2', name: 'Premier League Updates', category: 'Football', posts: '32K', isLive: false }
    );
  }
  
  return topics.slice(0, 4);
};

const SUGGESTED_SOURCES = [
    { id: 'a1', name: 'Fabrizio Romano', handle: '@FabrizioRomano', avatar: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Fabrizio_Romano_2021.jpg', type: 'Journalist' },
    { id: 'a2', name: 'The Athletic', handle: '@TheAthletic', avatar: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/The_Athletic_Logo.png', type: 'Media' },
    { id: 'a3', name: 'ESPN FC', handle: '@ESPNFC', avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ESPN_wordmark.svg', type: 'Media' },
    { id: 'a4', name: 'Sky Sports', handle: '@SkySports', avatar: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Sky_Sports_logo_2020.svg', type: 'Media' },
];

const COMMUNITIES = [
    { id: 'c1', name: 'Football Fanatics', members: '145K', icon: '⚽' },
    { id: 'c2', name: 'Basketball Talk', members: '82K', icon: '🏀' },
    { id: 'c3', name: 'Betting Tips', members: '210K', icon: '📊' },
];

// Default leagues (fallback) - expanded with multi-sport
const DEFAULT_LEAGUES = [
    { code: 'PL', name: 'Premier League', logo_url: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg', color: 'bg-purple-900', accent: 'border-purple-500' },
    { code: 'CL', name: 'Champions League', logo_url: 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg', color: 'bg-slate-900', accent: 'border-slate-400' },
    { code: 'NBA', name: 'NBA', logo_url: 'https://upload.wikimedia.org/wikipedia/en/0/03/National_Basketball_Association_logo.svg', color: 'bg-orange-900', accent: 'border-orange-500' },
    { code: 'BL1', name: 'Bundesliga', logo_url: 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg', color: 'bg-red-900', accent: 'border-red-500' },
    { code: 'PD', name: 'La Liga', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg', color: 'bg-orange-800', accent: 'border-orange-400' },
    { code: 'SA', name: 'Serie A', logo_url: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg', color: 'bg-blue-900', accent: 'border-blue-500' },
    { code: 'FL1', name: 'Ligue 1', logo_url: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Ligue_1_Uber_Eats.svg', color: 'bg-blue-800', accent: 'border-blue-400' },
    { code: 'F1', name: 'Formula 1', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg', color: 'bg-red-800', accent: 'border-red-500' },
];

const getLeagueStyle = (code: string) => {
    const styles: Record<string, { color: string; accent: string }> = {
        'PL': { color: 'bg-purple-900', accent: 'border-purple-500' },
        'BL1': { color: 'bg-red-900', accent: 'border-red-500' },
        'SA': { color: 'bg-blue-900', accent: 'border-blue-500' },
        'PD': { color: 'bg-orange-900', accent: 'border-orange-500' },
        'FL1': { color: 'bg-blue-800', accent: 'border-blue-400' },
        'CL': { color: 'bg-slate-900', accent: 'border-slate-400' },
        'EL': { color: 'bg-orange-800', accent: 'border-orange-400' },
        'NBA': { color: 'bg-orange-900', accent: 'border-orange-500' },
        'F1': { color: 'bg-red-800', accent: 'border-red-500' },
        'UFC': { color: 'bg-red-900', accent: 'border-red-600' },
        'NHL': { color: 'bg-blue-900', accent: 'border-blue-400' },
    };
    return styles[code] || { color: 'bg-gray-900', accent: 'border-gray-500' };
};

export const ExplorePage: React.FC = () => {
  const { matches, news, addToSlip, user, updatePreferences } = useSports();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAcca, setSelectedAcca] = useState<string[]>([]);
  const [wager, setWager] = useState<number>(10);
  const [leagues, setLeagues] = useState(DEFAULT_LEAGUES);

  // Fetch leagues from database with priority ordering
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const { data, error } = await supabase
          .from('leagues')
          .select('id, name, code, logo_url, country, sport')
          .order('name', { ascending: true })
          .limit(20);
        
        if (!error && data && data.length > 0) {
          // Prioritize popular leagues
          const priorityOrder = ['PL', 'CL', 'NBA', 'BL1', 'PD', 'SA', 'FL1', 'EL', 'F1'];
          const sorted = [...data].sort((a, b) => {
            const aIdx = priorityOrder.indexOf(a.code || '');
            const bIdx = priorityOrder.indexOf(b.code || '');
            if (aIdx === -1 && bIdx === -1) return 0;
            if (aIdx === -1) return 1;
            if (bIdx === -1) return -1;
            return aIdx - bIdx;
          });
          
          const mappedLeagues = sorted.slice(0, 8).map(l => ({
            code: l.code || l.id,
            name: l.name,
            logo_url: l.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.name)}&background=6366F1&color=fff`,
            ...getLeagueStyle(l.code || '')
          }));
          setLeagues(mappedLeagues);
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    };
    fetchLeagues();
  }, []);

  // --- SEARCH LOGIC ---
  const searchResults = useMemo(() => {
      if (!searchTerm) return null;
      const term = searchTerm.toLowerCase();

      const matchedMatches = (matches || []).filter(m => 
        m.homeTeam?.name?.toLowerCase().includes(term) || 
        m.awayTeam?.name?.toLowerCase().includes(term) ||
        m.league?.toLowerCase().includes(term)
      ).slice(0, 5);

      const matchedNews = (news || []).filter(n => 
        n.title?.toLowerCase().includes(term) ||
        n.tags?.some(t => t.toLowerCase().includes(term))
      ).slice(0, 5);

      return { matches: matchedMatches, news: matchedNews };
  }, [searchTerm, matches, news]);

  // --- ACCUMULATOR LOGIC ---
  const sureBets = matches.filter(m => {
      if (!m.prediction) return false;
      const confidence = m.prediction.confidence || 0;
      return confidence > 65; 
  });

  const accaStats = useMemo(() => {
      const selectedMatches = sureBets.filter(m => selectedAcca.includes(m.id));
      const totalOdds = selectedMatches.reduce((acc, m) => {
          const odds = m.prediction?.outcome === 'HOME' ? m.prediction.odds?.home 
                     : m.prediction?.outcome === 'AWAY' ? m.prediction.odds?.away 
                     : m.prediction?.odds?.draw;
          return acc * (odds || 1);
      }, 1);
      
      return {
          totalOdds: totalOdds,
          potentialReturn: (totalOdds * wager).toFixed(2),
          count: selectedMatches.length,
          legs: selectedMatches
      };
  }, [selectedAcca, sureBets, wager]);

  const toggleAccaSelection = (id: string) => {
      if (selectedAcca.includes(id)) setSelectedAcca(prev => prev.filter(x => x !== id));
      else setSelectedAcca(prev => [...prev, id]);
  };

  const removeAccaLeg = (id: string) => {
      setSelectedAcca(prev => prev.filter(x => x !== id));
  };

  // AI HELPING HAND
  const handleAiSmartBuild = () => {
      // Logic: Pick top 4 highest confidence bets
      const bestBets = [...sureBets]
        .sort((a,b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0))
        .slice(0, 4)
        .map(m => m.id);
      
      setSelectedAcca(bestBets);
  };

  const buildAccumulator = () => {
      sureBets.filter(m => selectedAcca.includes(m.id)).forEach(m => addToSlip(m));
      navigate('/slip');
  };

  // --- FOLLOW LOGIC ---
  const toggleFollow = (sourceName: string) => {
      if (!user) {
          alert("Sign up to follow sources!");
          return;
      }
      const current = user.preferences.followedSources || [];
      let newSources;
      if (current.includes(sourceName)) {
          newSources = current.filter(s => s !== sourceName);
      } else {
          newSources = [...current, sourceName];
      }
      updatePreferences({ followedSources: newSources });
  };

  const isFollowing = (sourceName: string) => {
      return user?.preferences.followedSources?.includes(sourceName) || false;
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
        
        {/* SEARCH HEADER */}
        <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 py-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search teams, players, or news..."
                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-600 transition-colors"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>

        <div className="px-4 py-6 max-w-[700px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* --- SEARCH RESULTS VIEW --- */}
            {searchTerm ? (
                <div className="space-y-6">
                    <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide text-gray-400">
                        Results for "{searchTerm}"
                    </h2>

                    {searchResults?.matches && searchResults.matches.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Trophy size={16} className="text-indigo-500"/> Matches</h3>
                            <div className="space-y-2">
                                {searchResults.matches.map(m => (
                                    <div key={m.id} onClick={() => navigate(`/match/${m.id}`)} className="flex items-center justify-between p-3 bg-[#1E1E1E] rounded-lg border border-[#333] cursor-pointer hover:bg-[#252525]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                <img src={m.homeTeam.logo} className="w-6 h-6 object-contain z-10" />
                                                <img src={m.awayTeam.logo} className="w-6 h-6 object-contain" />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-sm text-white">{m.homeTeam.name} vs {m.awayTeam.name}</span>
                                                <span className="text-xs text-gray-500">{m.league} • {m.time}</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-gray-600" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <>
                    {/* 1. BROWSE LEAGUES (REALISTIC) */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <LayoutGrid size={20} className="text-indigo-500" />
                                <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Browse Leagues</h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {leagues.map(league => (
                                <button 
                                    key={league.code} 
                                    onClick={() => navigate(`/league/${league.code}`)}
                                    className={`
                                        relative overflow-hidden h-28 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 group
                                        ${league.color} ${league.accent} border-opacity-30 hover:border-opacity-100 hover:scale-[1.03]
                                    `}
                                >
                                    {/* Glass Shine */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="w-12 h-12 mb-2 relative z-10 drop-shadow-lg">
                                        <img src={league.logo_url} alt={league.name} className="w-full h-full object-contain filter drop-shadow-md" />
                                    </div>
                                    <span className="font-condensed font-bold text-sm uppercase text-white/90 tracking-wider z-10">{league.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 2. DYNAMIC ACCA (AI POWERED) */}
                    <section className="bg-gradient-to-br from-[#1E1E1E] to-[#0A0A0A] border border-[#2C2C2C] rounded-xl overflow-hidden shadow-2xl relative">
                        {/* Background FX */}
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-green-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                        <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between bg-black/40 backdrop-blur-sm relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Shield size={16} className="text-green-500" />
                                </div>
                                <div>
                                    <h2 className="font-condensed font-black text-lg uppercase italic tracking-wide text-white">Dynamic Acca</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Smart Builder</p>
                                </div>
                            </div>
                            
                            {/* AI BUTTON */}
                            <button 
                                onClick={handleAiSmartBuild}
                                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-lg shadow-indigo-600/20 animate-pulse"
                            >
                                <Sparkles size={12} /> AI Smart Build
                            </button>
                        </div>
                        
                        {/* Match List Selector */}
                        <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar relative z-10 bg-black/20">
                            {sureBets.length > 0 ? sureBets.map(match => (
                                match && (
                                <div 
                                    key={match.id} 
                                    onClick={() => toggleAccaSelection(match.id)}
                                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-all ${selectedAcca.includes(match.id) ? 'bg-green-900/20 border-green-500/50' : 'bg-transparent border-transparent hover:bg-[#252525]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedAcca.includes(match.id) ? 'bg-green-500 border-green-500' : 'border-gray-600 bg-black/50'}`}>
                                            {selectedAcca.includes(match.id) && <CheckCircle2 size={12} className="text-black" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm text-white">{match.prediction?.outcome === 'HOME' ? match.homeTeam.name : match.awayTeam.name}</span>
                                                <span className={`text-[10px] font-bold px-1.5 rounded ${selectedAcca.includes(match.id) ? 'bg-green-500 text-black' : 'bg-[#2C2C2C] text-gray-400'}`}>
                                                    {match.prediction?.outcome === 'HOME' ? match.prediction.odds?.home : match.prediction.odds?.away}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold block">
                                                vs {match.prediction?.outcome === 'HOME' ? match.awayTeam.name : match.homeTeam.name}
                                            </span>
                                        </div>
                                    </div>
                                    {match.prediction?.confidence && match.prediction.confidence > 75 && (
                                        <div className="hidden sm:block">
                                            <span className="text-[9px] font-bold text-green-500 border border-green-500/30 px-1 rounded uppercase">Safe</span>
                                        </div>
                                    )}
                                </div>
                                )
                            )) : (
                                <div className="p-8 text-center text-gray-500 text-xs font-bold uppercase">
                                    No safe bets available today.
                                </div>
                            )}
                        </div>

                        {/* Dynamic Footer / Edit Mode */}
                        {selectedAcca.length > 0 && (
                            <div className="bg-[#0A0A0A] border-t border-[#2C2C2C] p-4 animate-in slide-in-from-bottom-2 relative z-10">
                                {/* Selected Legs Pills */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {accaStats.legs.map(m => (
                                        m && (
                                        <div key={m.id} className="flex items-center gap-1 bg-[#1E1E1E] border border-[#333] rounded px-2 py-1 shadow-sm">
                                            <span className="text-[10px] font-bold text-white uppercase">{m.homeTeam.name.substring(0,3)}/{m.awayTeam.name.substring(0,3)}</span>
                                            <button onClick={() => removeAccaLeg(m.id)} className="text-gray-500 hover:text-red-500">
                                                <X size={12} />
                                            </button>
                                        </div>
                                        )
                                    ))}
                                </div>

                                <div className="flex justify-between items-end mb-4 bg-[#121212] p-3 rounded-lg border border-[#222]">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Total Odds</span>
                                        <span className="font-mono font-black text-2xl text-white">{accaStats.totalOdds.toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                         <span className="text-[10px] font-bold text-gray-500 uppercase">Potential Return</span>
                                         <span className="font-mono font-black text-2xl text-[#00FFB2]">${accaStats.potentialReturn}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-[#1E1E1E] rounded-lg px-3 py-2 border border-[#333] w-1/3">
                                        <DollarSign size={14} className="text-gray-400" />
                                        <input 
                                            type="number"
                                            value={wager}
                                            onChange={(e) => setWager(Number(e.target.value))}
                                            className="bg-transparent text-white font-bold text-sm w-full outline-none"
                                        />
                                    </div>
                                    <button 
                                        onClick={buildAccumulator}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                                    >
                                        <Plus size={16} /> Add to Slip
                                    </button>
                                     <button 
                                        onClick={() => setSelectedAcca([])}
                                        className="p-2 bg-[#1E1E1E] hover:bg-red-900/20 text-gray-500 hover:text-red-500 rounded-lg border border-[#333]"
                                        title="Clear All"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 3. TRENDING NOW */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 mt-8">
                            <TrendingUp size={20} className="text-[#00FFB2]" />
                            <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Trending Now</h2>
                        </div>
                        <div className="grid gap-2">
                            {generateTrendingTopics(matches).map((topic, idx) => (
                                <div key={topic.id} onClick={() => setSearchTerm(topic.name)} className="flex items-center justify-between p-4 bg-[#1E1E1E] rounded-lg border border-[#2C2C2C] cursor-pointer hover:bg-[#252525] group transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold text-gray-600 text-lg group-hover:text-white transition-colors">0{idx + 1}</span>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{topic.name}</h3>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{topic.category} • {topic.posts} Posts</span>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-600 group-hover:text-[#00FFB2] transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. WHO TO FOLLOW (FUNCTIONAL) */}
                    <section className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <UserPlus size={20} className="text-blue-500" />
                                <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Who to Follow</h2>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
                            {SUGGESTED_SOURCES.map(account => {
                                const followed = isFollowing(account.name);
                                return (
                                    <div onClick={() => navigate(`/source/${account.name}`)} key={account.id} className="min-w-[160px] bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex flex-col items-center text-center snap-center hover:border-gray-500 transition-colors cursor-pointer group">
                                        <div className="w-14 h-14 rounded-full border-2 border-[#333] mb-3 overflow-hidden">
                                            <img src={account.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        </div>
                                        <span className="font-bold text-sm text-white truncate w-full">{account.name}</span>
                                        <span className="text-[10px] text-gray-500 mb-2">{account.handle}</span>
                                        <span className="text-[9px] font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded uppercase mb-3">{account.type}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleFollow(account.name); }}
                                            className={`w-full py-1.5 text-[10px] font-black uppercase rounded transition-colors flex items-center justify-center gap-1 ${followed ? 'bg-transparent border border-gray-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                                        >
                                            {followed ? <><Check size={12} /> Following</> : 'Follow'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 5. VIRAL COMMUNITIES (FUNCTIONAL) */}
                    <section className="mt-6 mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Flame size={20} className="text-orange-500" />
                            <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Viral Communities</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {COMMUNITIES.map(comm => (
                                <div 
                                    key={comm.id} 
                                    onClick={() => navigate(`/community/${comm.id}`)}
                                    className="flex items-center gap-3 p-3 bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg hover:bg-[#252525] cursor-pointer active:scale-[0.98] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-xl border border-[#333]">
                                        {comm.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{comm.name}</h4>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
                                            <Users size={10} /> {comm.members} Members
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </>
            )}
        </div>
    </div>
  );
};
