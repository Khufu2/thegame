import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { Trophy, TrendingUp, Medal, Crown, ArrowUp, ArrowDown } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { leaderboard, user } = useSports();
  const [filter, setFilter] = useState<'WEEKLY' | 'ALL_TIME'>('WEEKLY');

  // Sort: Pro users get highlight, but sort by Profit
  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.netProfit - a.netProfit);

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
      
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2">
              <Trophy className="text-yellow-500" size={24} />
              <span className="font-condensed font-black text-2xl uppercase italic tracking-tighter">Leaderboard</span>
          </div>
          <div className="flex bg-[#1E1E1E] rounded-lg p-1">
              <button 
                  onClick={() => setFilter('WEEKLY')}
                  className={`px-3 py-1 text-xs font-bold uppercase rounded transition-colors ${filter === 'WEEKLY' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
              >
                  Weekly
              </button>
              <button 
                  onClick={() => setFilter('ALL_TIME')}
                  className={`px-3 py-1 text-xs font-bold uppercase rounded transition-colors ${filter === 'ALL_TIME' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
              >
                  All Time
              </button>
          </div>
      </div>

      <div className="max-w-[700px] mx-auto p-4 animate-in fade-in slide-in-from-bottom-4">
          
          {/* PODIUM */}
          <div className="flex justify-center items-end gap-4 mb-8 pt-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-gray-400 p-1 relative">
                       <img src={sortedLeaderboard[1]?.userAvatar} className="w-full h-full rounded-full object-cover" />
                       <div className="absolute -bottom-2 -right-1 bg-gray-400 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border border-black">2</div>
                  </div>
                  <span className="font-bold text-sm mt-2">{sortedLeaderboard[1]?.userName}</span>
                  <span className="text-xs text-[#00FFB2] font-mono">+{sortedLeaderboard[1]?.netProfit}u</span>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center pb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-yellow-400 p-1 relative shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400"><Crown size={24} fill="currentColor" /></div>
                       <img src={sortedLeaderboard[0]?.userAvatar} className="w-full h-full rounded-full object-cover" />
                       <div className="absolute -bottom-3 -right-1 bg-yellow-400 text-black text-sm font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-black">1</div>
                  </div>
                  <span className="font-black text-lg mt-2 uppercase text-yellow-400">{sortedLeaderboard[0]?.userName}</span>
                  <span className="text-sm text-[#00FFB2] font-mono font-bold">+{sortedLeaderboard[0]?.netProfit}u Profit</span>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-orange-700 p-1 relative">
                       <img src={sortedLeaderboard[2]?.userAvatar} className="w-full h-full rounded-full object-cover" />
                       <div className="absolute -bottom-2 -right-1 bg-orange-700 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border border-black">3</div>
                  </div>
                  <span className="font-bold text-sm mt-2">{sortedLeaderboard[2]?.userName}</span>
                  <span className="text-xs text-[#00FFB2] font-mono">+{sortedLeaderboard[2]?.netProfit}u</span>
              </div>
          </div>

          {/* LIST */}
          <div className="space-y-2">
              <div className="flex justify-between px-4 text-[10px] font-bold text-gray-500 uppercase">
                  <span>Rank & User</span>
                  <div className="flex gap-6">
                      <span className="w-12 text-right">Win Rate</span>
                      <span className="w-16 text-right">Profit</span>
                  </div>
              </div>
              
              {sortedLeaderboard.map((entry, idx) => (
                  <div 
                    key={entry.userId} 
                    className={`flex items-center justify-between p-3 rounded-xl border ${entry.userId === user?.id ? 'bg-indigo-900/20 border-indigo-500' : 'bg-[#1E1E1E] border-[#2C2C2C]'} transition-transform active:scale-[0.98]`}
                  >
                      <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-gray-500 w-6 text-center">{idx + 1}</span>
                          <img src={entry.userAvatar} className="w-10 h-10 rounded-full bg-gray-700" />
                          <div>
                              <div className="flex items-center gap-1">
                                  <span className={`font-bold text-sm ${entry.userId === user?.id ? 'text-indigo-400' : 'text-white'}`}>{entry.userName}</span>
                                  {entry.isPro && <Crown size={12} className="text-yellow-400 fill-yellow-400" />}
                              </div>
                              {entry.streak && entry.streak > 2 && (
                                  <span className="text-[10px] text-orange-500 flex items-center gap-0.5 font-bold">
                                      <TrendingUp size={10} /> {entry.streak} Game Streak
                                  </span>
                              )}
                          </div>
                      </div>

                      <div className="flex gap-6 items-center">
                           <span className="w-12 text-right font-bold text-gray-400 text-sm">{entry.winRate}%</span>
                           <span className={`w-16 text-right font-mono font-black text-sm ${entry.netProfit > 0 ? 'text-[#00FFB2]' : 'text-red-500'}`}>
                               {entry.netProfit > 0 ? '+' : ''}{entry.netProfit}
                           </span>
                      </div>
                  </div>
              ))}
          </div>

      </div>
    </div>
  );
};