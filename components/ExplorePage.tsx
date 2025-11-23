
import React, { useState } from 'react';
import { Search, TrendingUp, Hash, Users, ArrowRight } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

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
