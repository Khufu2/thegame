
import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, Hash, Users, ArrowRight, Shield, CheckCircle2, Plus, X, Newspaper, Trophy, Calculator, DollarSign, Trash2, Calendar, LayoutGrid } from 'lucide-react';
import { useSports } from '../context/SportsContext';
import { useNavigate } from 'react-router-dom';
import { Match, NewsStory } from '../types';

const TRENDING_TOPICS = [
    { id: '1', name: 'LeBron Trade Rumors', category: 'NBA' },
    { id: '2', name: 'UFC 300 Fight Card', category: 'MMA' },
    { id: '3', name: 'Mbappe Real Madrid', category: 'Soccer' },
    { id: '4', name: 'NFL Draft 2024', category: 'NFL' },
];

const SUGGESTED_ACCOUNTS = [
    { id: 'a1', name: 'Fabrizio Romano', handle: '@FabrizioRomano', avatar: 'https://ui-avatars.com/api/?name=FR' },
    { id: 'a2', name: 'Wojnarowski', handle: '@wojespn', avatar: 'https://ui-avatars.com/api/?name=WOJ' },
    { id: 'a3', name: 'Sheena AI', handle: '@sheena_sports', avatar: 'https://ui-avatars.com/api/?name=AI&background=6366F1&color=fff' },
];

const LEAGUES = [
    { name: 'EPL', icon: '⚽', color: 'from-purple-600 to-indigo-600' },
    { name: 'NBA', icon: '🏀', color: 'from-orange-600 to-red-600' },
    { name: 'NFL', icon: '🏈', color: 'from-blue-700 to-blue-900' },
    { name: 'LaLiga', icon: '🇪🇸', color: 'from-red-600 to-orange-500' },
    { name: 'UFC', icon: '🥊', color: 'from-red-700 to-black' },
    { name: 'F1', icon: '🏎️', color: 'from-red-600 to-black' },
];

export const ExplorePage: React.FC = () => {
  const { matches, news, addToSlip } = useSports();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAcca, setSelectedAcca] = useState<string[]>([]);
  const [wager, setWager] = useState<number>(10);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null); // For League Browser Modal

  // --- SEARCH LOGIC ---
  const searchResults = useMemo(() => {
      if (!searchTerm) return null;
      const term = searchTerm.toLowerCase();

      const matchedMatches = matches.filter(m => 
        m.homeTeam.name.toLowerCase().includes(term) || 
        m.awayTeam.name.toLowerCase().includes(term) ||
        m.league.toLowerCase().includes(term)
      ).slice(0, 5);

      const matchedNews = news.filter(n => 
        n.title.toLowerCase().includes(term) ||
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

  const buildAccumulator = () => {
      sureBets.filter(m => selectedAcca.includes(m.id)).forEach(m => addToSlip(m));
      navigate('/slip');
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

        <div className="px-4 py-6 max-w-[700px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
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
                    {/* ... (News results similar to previous) ... */}
                </div>
            ) : (
                <>
                    {/* BROWSE LEAGUES (NEW) */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <LayoutGrid size={20} className="text-indigo-500" />
                            <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Browse Leagues</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {LEAGUES.map(league => (
                                <button 
                                    key={league.name} 
                                    onClick={() => setSelectedLeague(league.name)}
                                    className={`
                                        relative overflow-hidden h-24 rounded-xl flex flex-col items-center justify-center gap-1 border border-[#333]
                                        bg-gradient-to-br ${league.color} hover:scale-[1.02] transition-transform
                                    `}
                                >
                                    <span className="text-2xl">{league.icon}</span>
                                    <span className="font-condensed font-black text-lg uppercase text-white drop-shadow-md">{league.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* THE ACCUMULATOR BUILDER */}
                    <section className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-[#2C2C2C] rounded-xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-2">
                                <Shield size={20} className="text-green-500" />
                                <div>
                                    <h2 className="font-condensed font-black text-lg uppercase italic tracking-wide text-white">Dynamic Acca</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Build your multibet</p>
                                </div>
                            </div>
                            <div className="bg-[#2C2C2C] px-2 py-1 rounded text-[10px] font-bold text-gray-400 uppercase">
                                {accaStats.count} Selected
                            </div>
                        </div>
                        
                        {/* Match List Selector */}
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {sureBets.length > 0 ? sureBets.map(match => (
                                <div 
                                    key={match.id} 
                                    onClick={() => toggleAccaSelection(match.id)}
                                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-colors ${selectedAcca.includes(match.id) ? 'bg-green-900/10 border-green-500/50' : 'bg-transparent border-transparent hover:bg-[#252525]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedAcca.includes(match.id) ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                            {selectedAcca.includes(match.id) && <CheckCircle2 size={14} className="text-black" />}
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
                            )) : (
                                <div className="p-8 text-center text-gray-500 text-xs font-bold uppercase">
                                    No safe bets available for Acca.
                                </div>
                            )}
                        </div>

                        {/* Dynamic Footer / Edit Mode */}
                        {selectedAcca.length > 0 && (
                            <div className="bg-[#0A0A0A] border-t border-[#2C2C2C] p-4 animate-in slide-in-from-bottom-2">
                                {/* EDIT LIST - Selected Legs Pills */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {accaStats.legs.map(m => (
                                        <div key={m.id} className="flex items-center gap-1 bg-[#1E1E1E] border border-[#333] rounded px-2 py-1">
                                            <span className="text-[10px] font-bold text-white uppercase">{m.homeTeam.name.substring(0,3)}/{m.awayTeam.name.substring(0,3)}</span>
                                            <button onClick={() => removeAccaLeg(m.id)} className="text-gray-500 hover:text-red-500">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-end mb-4">
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

                    {/* TRENDING NOW */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={20} className="text-[#00FFB2]" />
                            <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Trending Now</h2>
                        </div>
                        <div className="grid gap-2">
                            {TRENDING_TOPICS.map((topic, idx) => (
                                <div key={topic.id} onClick={() => setSearchTerm(topic.name)} className="flex items-center justify-between p-4 bg-[#1E1E1E] rounded-lg border border-[#2C2C2C] cursor-pointer hover:bg-[#252525]">
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold text-gray-600 text-lg">0{idx + 1}</span>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{topic.name}</h3>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{topic.category}</span>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-600" />
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>

        {/* LEAGUE MODAL */}
        {selectedLeague && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <div className="w-full max-w-[500px] bg-[#121212] border border-[#2C2C2C] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                    {/* Header */}
                    <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between bg-black/50">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xl shadow-lg">
                                 {LEAGUES.find(l => l.name === selectedLeague)?.icon}
                             </div>
                             <div>
                                 <h2 className="font-condensed font-black text-2xl uppercase text-white leading-none">{selectedLeague}</h2>
                                 <span className="text-[10px] font-bold text-gray-500 uppercase">Season 2024/25</span>
                             </div>
                        </div>
                        <button onClick={() => setSelectedLeague(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Scroll */}
                    <div className="overflow-y-auto p-4 space-y-6">
                        
                        {/* Standings Table (Mock) */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-500" /> Standings
                            </h3>
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-black text-gray-500 font-bold uppercase border-b border-[#2C2C2C]">
                                        <tr>
                                            <th className="p-3 text-center">#</th>
                                            <th className="p-3">Team</th>
                                            <th className="p-3 text-center">P</th>
                                            <th className="p-3 text-center">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2C2C2C]">
                                        {[1,2,3,4,5].map((pos) => (
                                            <tr key={pos} className="hover:bg-white/5">
                                                <td className="p-3 text-center font-mono text-gray-400">{pos}</td>
                                                <td className="p-3 font-bold text-white">
                                                    {selectedLeague === 'EPL' ? ['Liverpool', 'Man City', 'Arsenal', 'Villa', 'Chelsea'][pos-1] : `Team ${pos}`}
                                                </td>
                                                <td className="p-3 text-center text-gray-400">12</td>
                                                <td className="p-3 text-center font-bold text-white">{30 - (pos * 2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Upcoming Matches */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" /> Upcoming
                            </h3>
                            <div className="space-y-2">
                                {matches.filter(m => m.league === selectedLeague).slice(0, 3).map(m => (
                                    <div key={m.id} onClick={() => { setSelectedLeague(null); navigate(`/match/${m.id}`); }} className="flex items-center justify-between p-3 bg-[#1E1E1E] rounded-lg border border-[#2C2C2C] cursor-pointer hover:bg-[#252525]">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[10px] text-gray-500 font-bold bg-black px-1.5 py-0.5 rounded">{m.time}</span>
                                            <span className="text-xs font-bold text-white">{m.homeTeam.name} vs {m.awayTeam.name}</span>
                                        </div>
                                        <ArrowRight size={14} className="text-gray-600" />
                                    </div>
                                ))}
                                {matches.filter(m => m.league === selectedLeague).length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No matches scheduled.</p>
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
