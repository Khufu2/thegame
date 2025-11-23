
import React, { useState } from 'react';
import { UserProfile, BetSlipItem, Match } from '../types';
import { Settings, Award, TrendingUp, Shield, Crown, ChevronRight, LogOut, Bell, Heart, CreditCard, Plus, Check } from 'lucide-react';

interface ProfilePageProps {
  user: UserProfile;
  betHistory: BetSlipItem[];
}

const AVAILABLE_LEAGUES = ["NFL", "NBA", "EPL", "LaLiga", "UFC", "F1", "MLB", "NHL"];
const SUGGESTED_TEAMS = [
    { id: 't5', name: 'Arsenal', league: 'EPL', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
    { id: 'nba1', name: 'Lakers', league: 'NBA', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg' },
    { id: 't7', name: 'Real Madrid', league: 'LaLiga', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
    { id: 'nfl4', name: 'Chiefs', league: 'NFL', logo: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Kansas_City_Chiefs_logo.svg' },
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, betHistory }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SQUAD' | 'HISTORY'>('OVERVIEW');
  const [favorites, setFavorites] = useState<string[]>(user.preferences.favoriteLeagues);
  const [followedTeams, setFollowedTeams] = useState<string[]>(user.preferences.favoriteTeams);

  const toggleLeague = (league: string) => {
      if (favorites.includes(league)) {
          setFavorites(prev => prev.filter(l => l !== league));
      } else {
          setFavorites(prev => [...prev, league]);
      }
  };

  const toggleTeam = (teamId: string) => {
       if (followedTeams.includes(teamId)) {
          setFollowedTeams(prev => prev.filter(t => t !== teamId));
      } else {
          setFollowedTeams(prev => [...prev, teamId]);
      }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
        
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 h-[60px] flex items-center justify-between">
            <span className="font-condensed font-black text-2xl uppercase italic tracking-tighter">My Profile</span>
            <button className="text-gray-400 hover:text-white transition-colors">
                <Settings size={20} />
            </button>
        </div>

        {/* USER INFO & STATS */}
        <div className="p-4 bg-gradient-to-b from-[#121212] to-black">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full border-2 border-indigo-600 p-1">
                    <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                    <h2 className="font-condensed font-black text-3xl uppercase leading-none">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        {user.isPro ? (
                            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                <Crown size={10} className="fill-black" /> Sheena+ Pro
                            </span>
                        ) : (
                            <span className="bg-[#2C2C2C] text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                Free Account
                            </span>
                        )}
                        <span className="text-xs text-gray-500 font-bold">Member since '23</span>
                    </div>
                </div>
            </div>

            {/* STATS DASHBOARD (Gamification) */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#2C2C2C] flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Win Rate</span>
                    <span className={`font-condensed font-black text-2xl ${user.stats.winRate > 50 ? 'text-[#00FFB2]' : 'text-gray-200'}`}>
                        {user.stats.winRate}%
                    </span>
                </div>
                <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#2C2C2C] flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Profit (Virtual)</span>
                    <span className={`font-condensed font-black text-2xl ${user.stats.netProfit >= 0 ? 'text-[#00FFB2]' : 'text-red-500'}`}>
                        {user.stats.netProfit > 0 ? '+' : ''}{user.stats.netProfit}u
                    </span>
                </div>
                <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#2C2C2C] flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Bets</span>
                    <span className="font-condensed font-black text-2xl text-white">
                        {user.stats.betsPlaced}
                    </span>
                </div>
            </div>

            {/* TABS */}
            <div className="flex p-1 bg-[#1E1E1E] rounded-lg mb-4">
                <TabButton label="Overview" active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} />
                <TabButton label="My Squad" active={activeTab === 'SQUAD'} onClick={() => setActiveTab('SQUAD')} />
                <TabButton label="History" active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} />
            </div>
        </div>

        {/* TAB CONTENT */}
        <div className="px-4 animate-in fade-in duration-300">
            
            {/* 1. OVERVIEW: SUBSCRIPTION & SETTINGS */}
            {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                    
                    {/* SHEENA+ UPSELL CARD */}
                    {!user.isPro && (
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-900 to-black border border-indigo-500/50 p-6 shadow-lg shadow-indigo-900/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Crown size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown size={20} className="text-yellow-400 fill-yellow-400" />
                                    <h3 className="font-condensed font-black text-2xl text-white uppercase italic">Sheena+</h3>
                                </div>
                                <p className="text-sm text-indigo-200 mb-4 font-medium leading-relaxed">
                                    Unlock the War Room, get unlimited Pweza insights, and see sharp money alerts before the line moves.
                                </p>
                                <ul className="space-y-2 mb-6">
                                    <ProFeature text="Real-time Sharp Money Alerts" />
                                    <ProFeature text="Unlimited Pweza AI Chat" />
                                    <ProFeature text="Ad-Free Experience" />
                                </ul>
                                <button className="w-full py-3 bg-white text-indigo-900 font-condensed font-black uppercase rounded shadow-lg hover:bg-gray-100 transition-colors">
                                    Upgrade • $9.99/mo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Settings */}
                    <div className="space-y-1">
                        <MenuItem icon={<Bell size={18} />} label="Notifications" value="On" />
                        <MenuItem icon={<CreditCard size={18} />} label="Manage Subscription" />
                        <MenuItem icon={<Shield size={18} />} label="Privacy & Security" />
                        <MenuItem icon={<LogOut size={18} />} label="Sign Out" danger />
                    </div>
                </div>
            )}

            {/* 2. MY SQUAD: PREFERENCES */}
            {activeTab === 'SQUAD' && (
                <div className="space-y-6">
                    <p className="text-gray-500 text-sm">Customize your feed. Content related to your selections will appear first.</p>

                    {/* Leagues */}
                    <div>
                        <h3 className="font-condensed font-bold text-lg text-white uppercase mb-3 flex items-center gap-2">
                            <Award size={16} className="text-indigo-500" /> Leagues
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_LEAGUES.map(league => (
                                <button
                                    key={league}
                                    onClick={() => toggleLeague(league)}
                                    className={`
                                        px-4 py-2 rounded-full text-xs font-bold uppercase transition-all border
                                        ${favorites.includes(league) 
                                            ? 'bg-white text-black border-white' 
                                            : 'bg-[#1E1E1E] text-gray-500 border-[#2C2C2C] hover:border-gray-500'
                                        }
                                    `}
                                >
                                    {favorites.includes(league) && <span className="mr-1">✓</span>}
                                    {league}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Teams */}
                    <div>
                        <h3 className="font-condensed font-bold text-lg text-white uppercase mb-3 flex items-center gap-2">
                            <Heart size={16} className="text-pink-500" /> Teams
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {SUGGESTED_TEAMS.map(team => (
                                <div key={team.id} className="flex items-center justify-between bg-[#1E1E1E] border border-[#2C2C2C] p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <img src={team.logo} className="w-8 h-8 object-contain" />
                                        <div>
                                            <span className="block font-bold text-sm text-white">{team.name}</span>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{team.league}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => toggleTeam(team.id)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${followedTeams.includes(team.id) ? 'bg-indigo-600 text-white' : 'bg-[#2C2C2C] text-gray-500'}`}
                                    >
                                        {followedTeams.includes(team.id) ? <Check size={16} /> : <Plus size={16} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. HISTORY: BET TRACKING */}
            {activeTab === 'HISTORY' && (
                <div className="space-y-4">
                    {betHistory.filter(b => b.status === 'WON' || b.status === 'LOST').length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <TrendingUp size={40} className="mx-auto mb-2" />
                            <p className="font-condensed font-bold uppercase">No settled bets yet</p>
                        </div>
                    )}
                    
                    {/* Mock History Items */}
                    <HistoryItem 
                        match="Lakers vs Warriors" 
                        selection="Lakers -4.5" 
                        odds={1.91} 
                        result="WON" 
                        profit={9.10} 
                    />
                    <HistoryItem 
                        match="Arsenal vs Chelsea" 
                        selection="Arsenal ML" 
                        odds={1.65} 
                        result="WON" 
                        profit={6.50} 
                    />
                     <HistoryItem 
                        match="Jon Jones vs Miocic" 
                        selection="Miocic KO" 
                        odds={4.50} 
                        result="LOST" 
                        profit={-10.00} 
                    />
                </div>
            )}

        </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const TabButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${active ? 'bg-[#2C2C2C] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
    >
        {label}
    </button>
);

const ProFeature = ({ text }: { text: string }) => (
    <li className="flex items-center gap-2 text-xs font-bold text-indigo-100/80">
        <Check size={14} className="text-[#00FFB2]" />
        {text}
    </li>
);

const MenuItem = ({ icon, label, value, danger }: any) => (
    <button className="w-full flex items-center justify-between p-4 border-b border-[#1E1E1E] hover:bg-[#1E1E1E] transition-colors group">
        <div className="flex items-center gap-3">
            <span className={danger ? 'text-red-500' : 'text-gray-400 group-hover:text-white'}>{icon}</span>
            <span className={`font-condensed font-bold text-sm uppercase ${danger ? 'text-red-500' : 'text-white'}`}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {value && <span className="text-xs font-bold text-gray-500">{value}</span>}
            <ChevronRight size={16} className="text-gray-600" />
        </div>
    </button>
);

const HistoryItem = ({ match, selection, odds, result, profit }: any) => (
    <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#2C2C2C] flex items-center justify-between">
        <div>
            <h4 className="font-bold text-white text-sm">{selection}</h4>
            <span className="text-[10px] text-gray-500 uppercase block">{match} @ {odds.toFixed(2)}</span>
        </div>
        <div className="text-right">
             <span className={`block font-black text-sm uppercase ${result === 'WON' ? 'text-green-500' : 'text-red-500'}`}>{result}</span>
             <span className={`text-xs font-mono font-bold ${profit > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                 {profit > 0 ? '+' : ''}{profit.toFixed(2)}u
             </span>
        </div>
    </div>
);
