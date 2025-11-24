

import React, { useState } from 'react';
import { Search, TrendingUp, Hash, Users, ArrowRight, Shield, CheckCircle2, Plus } from 'lucide-react';
import { useSports } from '../context/SportsContext';
import { useNavigate } from 'react-router-dom';

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

export const ExplorePage: React.FC = () => {
  const { matches, addToSlip } = useSports();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // LOGIC FOR THE ACCUMULATOR
  // Find matches with >80% confidence and odds between 1.1 and 1.5
  const sureBets = matches.filter(m => {
      if (!m.prediction) return false;
      const confidence = m.prediction.confidence || 0;
      const odds = m.prediction.outcome === 'HOME' ? m.prediction.odds?.home 
                  : m.prediction.outcome === 'AWAY' ? m.prediction.odds?.away 
                  : m.prediction.odds?.draw;
      
      return confidence > 80 && odds && odds < 1.50;
  });

  const [selectedAcca, setSelectedAcca] = useState<string[]>([]);

  const toggleAccaSelection = (id: string) => {
      if (selectedAcca.includes(id)) setSelectedAcca(prev => prev.filter(x => x !== id));
      else setSelectedAcca(prev => [...prev, id]);
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
                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-600 transition-colors"
                />
            </div>
        </div>

        <div className="px-4 py-6 max-w-[700px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* THE ACCUMULATOR BUILDER */}
            <section className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-[#2C2C2C] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield size={20} className="text-green-500" />
                        <div>
                            <h2 className="font-condensed font-black text-lg uppercase italic tracking-wide text-white">The Accumulator</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Build a safe multibet • 80%+ Confidence</p>
                        </div>
                    </div>
                    {selectedAcca.length > 0 && (
                        <button 
                            onClick={buildAccumulator}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1 shadow-lg shadow-green-900/20"
                        >
                            <Plus size={14} /> Add {selectedAcca.length} Picks
                        </button>
                    )}
                </div>
                
                <div className="p-2 space-y-1">
                    {sureBets.length > 0 ? sureBets.map(match => (
                        <div 
                            key={match.id} 
                            onClick={() => toggleAccaSelection(match.id)}
                            className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-colors ${selectedAcca.includes(match.id) ? 'bg-green-900/10 border-green-500/50' : 'bg-transparent border-transparent hover:bg-[#252525]'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedAcca.includes(match.id) ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                    {selectedAcca.includes(match.id) && <CheckCircle2 size={14} className="text-black" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-white">{match.prediction?.outcome === 'HOME' ? match.homeTeam.name : match.awayTeam.name}</span>
                                        <span className="bg-[#2C2C2C] text-gray-400 text-[10px] px-1.5 rounded">
                                            {match.prediction?.outcome === 'HOME' ? match.prediction.odds?.home : match.prediction.odds?.away}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold block">
                                        vs {match.prediction?.outcome === 'HOME' ? match.awayTeam.name : match.homeTeam.name} • {match.prediction?.confidence}% Conf.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-gray-500 text-xs font-bold uppercase">
                            No safe bets found today.
                        </div>
                    )}
                </div>
            </section>

            {/* TRENDING NOW */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={20} className="text-[#00FFB2]" />
                    <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Trending Now</h2>
                </div>
                <div className="grid gap-2">
                    {TRENDING_TOPICS.map((topic, idx) => (
                        <div key={topic.id} className="flex items-center justify-between p-4 bg-[#1E1E1E] rounded-lg border border-[#2C2C2C] cursor-pointer hover:bg-[#252525]">
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

            {/* BROWSE BY SPORT (Hash Tags) */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Hash size={20} className="text-indigo-500" />
                    <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Browse by Sport</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['NFL', 'NBA', 'Soccer', 'UFC', 'F1', 'Tennis', 'Golf', 'Esports'].map(tag => (
                        <button key={tag} className="px-4 py-2 bg-[#121212] border border-[#2C2C2C] rounded-full text-xs font-bold text-gray-300 hover:text-white hover:border-gray-500 uppercase transition-colors">
                            #{tag}
                        </button>
                    ))}
                </div>
            </section>

            {/* WHO TO FOLLOW */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Users size={20} className="text-blue-500" />
                    <h2 className="font-condensed font-black text-xl uppercase italic tracking-wide">Sources to Follow</h2>
                </div>
                <div className="space-y-3">
                    {SUGGESTED_ACCOUNTS.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={acc.avatar} className="w-10 h-10 rounded-full bg-gray-700" />
                                <div>
                                    <h4 className="font-bold text-sm text-white">{acc.name}</h4>
                                    <span className="text-xs text-gray-500">{acc.handle}</span>
                                </div>
                            </div>
                            <button className="px-4 py-1.5 bg-white text-black text-xs font-black uppercase rounded-full hover:bg-gray-200">
                                Follow
                            </button>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    </div>
  );
};