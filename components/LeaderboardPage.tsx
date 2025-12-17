import React, { useState, useEffect } from 'react';
import { useSports } from '../context/SportsContext';
import { Trophy, TrendingUp, Medal, Crown, ArrowUp, ArrowDown, Eye, History, Target, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { BetSlipItem } from '../types';

export const LeaderboardPage: React.FC = () => {
  const { leaderboard, user } = useSports();
  const [filter, setFilter] = useState<'WEEKLY' | 'ALL_TIME'>('WEEKLY');
  const [activeTab, setActiveTab] = useState<'RANKINGS' | 'MY_BETSLIPS'>('RANKINGS');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBetslips, setUserBetslips] = useState<any[]>([]);
  const [myBetslips, setMyBetslips] = useState<BetSlipItem[]>([]);

  // Sort: Pro users get highlight, but sort by Profit
  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.netProfit - a.netProfit);

  // Mock betslips data for demonstration
  const mockBetslips = [
    {
      id: 'slip_1',
      userId: 'user_1',
      userName: 'Pro Bettor',
      items: [
        { id: '1', matchUp: 'Man City vs Arsenal', selection: 'Man City', odds: 1.85, market: 'Match Winner', status: 'WON' as const },
        { id: '2', matchUp: 'Liverpool vs Chelsea', selection: 'BTTS Yes', odds: 1.90, market: 'BTTS', status: 'WON' as const },
        { id: '3', matchUp: 'Tottenham vs Newcastle', selection: 'Over 2.5', odds: 1.75, market: 'Over/Under', status: 'LOST' as const }
      ],
      totalOdds: 5.94,
      stake: 10,
      potentialReturn: 59.40,
      status: 'SETTLED' as const,
      createdAt: Date.now() - 86400000, // 1 day ago
      settledAt: Date.now() - 3600000 // 1 hour ago
    },
    {
      id: 'slip_2',
      userId: 'user_1',
      userName: 'Pro Bettor',
      items: [
        { id: '4', matchUp: 'Barcelona vs Real Madrid', selection: 'Draw', odds: 3.20, market: 'Match Winner', status: 'PENDING' as const },
        { id: '5', matchUp: 'PSG vs Monaco', selection: 'PSG -1.5', odds: 1.45, market: 'Handicap', status: 'PENDING' as const }
      ],
      totalOdds: 4.64,
      stake: 25,
      potentialReturn: 116.00,
      status: 'ACTIVE' as const,
      createdAt: Date.now() - 3600000 // 1 hour ago
    }
  ];

  useEffect(() => {
    if (activeTab === 'MY_BETSLIPS' && user) {
      // In real app, fetch user's betslips from API
      setMyBetslips(mockBetslips.filter(slip => slip.userId === user.id));
    }
  }, [activeTab, user]);

  const handleViewUserBetslips = (userEntry: any) => {
    setSelectedUser(userEntry);
    // In real app, fetch user's public betslips
    setUserBetslips(mockBetslips.filter(slip => slip.userId === userEntry.userId));
  };

  const getBetslipStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'text-green-500';
      case 'LOST': return 'text-red-500';
      case 'PENDING': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getBetslipStatusIcon = (status: string) => {
    switch (status) {
      case 'WON': return <CheckCircle size={16} className="text-green-500" />;
      case 'LOST': return <XCircle size={16} className="text-red-500" />;
      default: return <Target size={16} className="text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
      
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C]">
          <div className="px-4 h-[60px] flex items-center justify-between">
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

          {/* TABS */}
          <div className="flex items-center px-4 pb-2">
              <button
                  onClick={() => { setActiveTab('RANKINGS'); setSelectedUser(null); }}
                  className={`px-4 py-2 text-sm font-bold uppercase rounded-lg transition-colors mr-2 ${
                      activeTab === 'RANKINGS' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
              >
                  Rankings
              </button>
              <button
                  onClick={() => { setActiveTab('MY_BETSLIPS'); setSelectedUser(null); }}
                  className={`px-4 py-2 text-sm font-bold uppercase rounded-lg transition-colors ${
                      activeTab === 'MY_BETSLIPS' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
              >
                  My Betslips
              </button>
          </div>
      </div>

      <div className="max-w-[700px] mx-auto p-4 animate-in fade-in slide-in-from-bottom-4">

          {activeTab === 'RANKINGS' && !selectedUser && (
              <>
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
                            onClick={() => handleViewUserBetslips(entry)}
                            className={`flex items-center justify-between p-3 rounded-xl border ${entry.userId === user?.id ? 'bg-indigo-900/20 border-indigo-500' : 'bg-[#1E1E1E] border-[#2C2C2C]'} transition-transform active:scale-[0.98] cursor-pointer hover:border-indigo-500/50`}
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
                                   <Eye size={16} className="text-gray-400 ml-2" />
                              </div>
                          </div>
                      ))}
                  </div>
              </>
          )}

          {activeTab === 'RANKINGS' && selectedUser && (
              <div className="animate-in fade-in">
                  <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">← Back</button>
                      <div className="flex items-center gap-3">
                          <img src={selectedUser.userAvatar} className="w-12 h-12 rounded-full" />
                          <div>
                              <h3 className="font-bold text-white">{selectedUser.userName}'s Betslips</h3>
                              <span className="text-sm text-gray-400">Public bet history</span>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      {userBetslips.map((betslip: any) => (
                          <div key={betslip.id} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4">
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className="font-bold text-white">{betslip.items.length} Leg Parlay</span>
                                          {getBetslipStatusIcon(betslip.status)}
                                      </div>
                                      <span className="text-xs text-gray-400">
                                          {new Date(betslip.createdAt).toLocaleDateString()} • {betslip.status}
                                      </span>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-mono font-bold text-[#00FFB2]">{betslip.totalOdds.toFixed(2)} odds</div>
                                      <div className="text-xs text-gray-400">${betslip.stake} stake</div>
                                  </div>
                              </div>

                              <div className="space-y-2 mb-3">
                                  {betslip.items.map((item: any) => (
                                      <div key={item.id} className="flex justify-between items-center py-1">
                                          <span className="text-sm text-gray-300">{item.matchUp}</span>
                                          <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-400">{item.market}</span>
                                              <span className="font-bold text-white">{item.selection}</span>
                                              <span className={`text-xs font-mono ${item.status === 'WON' ? 'text-green-500' : item.status === 'LOST' ? 'text-red-500' : 'text-yellow-500'}`}>
                                                  {item.odds}
                                              </span>
                                          </div>
                                      </div>
                                  ))}
                              </div>

                              <div className="flex justify-between items-center pt-3 border-t border-[#2C2C2C]">
                                  <span className="text-sm text-gray-400">Potential Return</span>
                                  <span className="font-mono font-bold text-lg text-[#00FFB2]">${betslip.potentialReturn}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'MY_BETSLIPS' && (
              <div className="animate-in fade-in">
                  <div className="flex items-center gap-2 mb-6">
                      <History size={20} className="text-indigo-400" />
                      <h3 className="font-condensed font-bold text-xl uppercase text-white">My Betslip History</h3>
                  </div>

                  {myBetslips.length > 0 ? (
                      <div className="space-y-4">
                          {myBetslips.map((betslip: any) => (
                              <div key={betslip.id} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4">
                                  <div className="flex justify-between items-start mb-3">
                                      <div>
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="font-bold text-white">{betslip.items.length} Leg Parlay</span>
                                              {getBetslipStatusIcon(betslip.status)}
                                          </div>
                                          <span className="text-xs text-gray-400">
                                              {new Date(betslip.createdAt).toLocaleDateString()} • {betslip.status}
                                          </span>
                                      </div>
                                      <div className="text-right">
                                          <div className="font-mono font-bold text-[#00FFB2]">{betslip.totalOdds.toFixed(2)} odds</div>
                                          <div className="text-xs text-gray-400">${betslip.stake} stake</div>
                                      </div>
                                  </div>

                                  <div className="space-y-2 mb-3">
                                      {betslip.items.map((item: any) => (
                                          <div key={item.id} className="flex justify-between items-center py-1">
                                              <span className="text-sm text-gray-300">{item.matchUp}</span>
                                              <div className="flex items-center gap-2">
                                                  <span className="text-xs text-gray-400">{item.market}</span>
                                                  <span className="font-bold text-white">{item.selection}</span>
                                                  <span className={`text-xs font-mono ${item.status === 'WON' ? 'text-green-500' : item.status === 'LOST' ? 'text-red-500' : 'text-yellow-500'}`}>
                                                      {item.odds}
                                                  </span>
                                              </div>
                                          </div>
                                      ))}
                                  </div>

                                  <div className="flex justify-between items-center pt-3 border-t border-[#2C2C2C]">
                                      <span className="text-sm text-gray-400">Potential Return</span>
                                      <span className="font-mono font-bold text-lg text-[#00FFB2]">${betslip.potentialReturn}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-20">
                          <History size={48} className="mx-auto mb-4 text-gray-600" />
                          <h3 className="font-condensed font-bold text-xl uppercase text-gray-400 mb-2">No Betslips Yet</h3>
                          <p className="text-gray-500 text-sm mb-6">Your betslip history will appear here once you start placing bets.</p>
                          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-sm px-6 py-3 rounded-lg transition-colors">
                              Create Your First Parlay
                          </button>
                      </div>
                  )}
              </div>
          )}

      </div>
    </div>
  );
};