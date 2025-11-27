
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Award, Shield, Check, X as XIcon, Lock, Users, Star } from 'lucide-react';

// Mock Data Generator
const getUserData = (id: string) => {
    // Deterministic mock data based on ID length/char
    const isPro = id.length % 2 === 0;
    return {
        id,
        name: id,
        avatar: `https://ui-avatars.com/api/?name=${id}&background=${isPro ? '6366F1' : '333'}&color=fff`,
        banner: isPro ? 'https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000' : 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000',
        winRate: 55 + (id.length * 2),
        profit: 120 + (id.length * 50),
        followers: 1200 + (id.length * 100),
        following: 45,
        bio: isPro ? 'Professional sports bettor. Focusing on value plays in EPL & NBA. Trust the process.' : 'Just here for the vibes and the occasional parlay.',
        isPro,
        badges: isPro ? ['Sharpshooter', 'Verified', 'OG'] : ['Rookie'],
        recentBets: [
            { id: 1, match: 'Lakers vs Suns', pick: 'Lakers -4.5', result: 'WON', odds: 1.91 },
            { id: 2, match: 'Arsenal vs Chelsea', pick: 'Arsenal ML', result: 'WON', odds: 1.65 },
            { id: 3, match: 'Chiefs vs Bills', pick: 'Over 48.5', result: 'LOST', odds: 1.91 },
        ]
    };
};

export const PublicUserPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getUserData(id || 'Unknown');

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            
            {/* HERO BANNER */}
            <div className="relative h-40 md:h-60 w-full overflow-hidden">
                <img src={user.banner} className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur rounded-full hover:bg-black/60 transition-colors z-10"
                >
                    <ArrowLeft size={20} className="text-white" />
                </button>
            </div>

            {/* PROFILE INFO */}
            <div className="px-4 relative -mt-16 mb-6">
                <div className="flex justify-between items-end mb-4">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full border-4 border-black overflow-hidden bg-[#1E1E1E]">
                            <img src={user.avatar} className="w-full h-full object-cover" />
                        </div>
                        {user.isPro && (
                            <div className="absolute bottom-1 right-1 bg-yellow-400 text-black p-1 rounded-full border-2 border-black" title="Pro User">
                                <Award size={16} />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mb-2">
                        <button className="px-6 py-2 bg-white text-black font-condensed font-black uppercase rounded-full hover:bg-gray-200 transition-colors">
                            Follow
                        </button>
                        <button className="p-2 bg-[#1E1E1E] border border-[#333] rounded-full text-gray-400 hover:text-white transition-colors">
                            <Users size={20} />
                        </button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="font-condensed font-black text-3xl uppercase text-white leading-none">{user.name}</h1>
                        {user.isPro && <Shield size={16} className="text-indigo-500 fill-indigo-500" />}
                    </div>
                    <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-4">
                        {user.bio}
                    </p>
                    
                    <div className="flex gap-6 text-sm">
                        <div><span className="font-bold text-white">{user.followers.toLocaleString()}</span> <span className="text-gray-500">Followers</span></div>
                        <div><span className="font-bold text-white">{user.following}</span> <span className="text-gray-500">Following</span></div>
                    </div>
                </div>
            </div>

            {/* STATS DASHBOARD */}
            <div className="px-4 mb-8">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Win Rate</span>
                        <span className={`font-condensed font-black text-2xl ${user.winRate > 60 ? 'text-[#00FFB2]' : 'text-white'}`}>{user.winRate}%</span>
                    </div>
                    <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Profit</span>
                        <span className="font-condensed font-black text-2xl text-[#00FFB2]">+{user.profit}u</span>
                    </div>
                    <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Streak</span>
                        <span className="font-condensed font-black text-2xl text-orange-500 flex items-center gap-1">
                            <TrendingUp size={18} /> 5
                        </span>
                    </div>
                </div>
            </div>

            {/* BADGES */}
            <div className="px-4 mb-8">
                <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-3 flex items-center gap-2">
                    <Star size={16} /> Achievements
                </h3>
                <div className="flex gap-2">
                    {user.badges.map(badge => (
                        <span key={badge} className="px-3 py-1 bg-[#1E1E1E] border border-[#333] rounded-full text-xs font-bold text-gray-300 uppercase">
                            {badge}
                        </span>
                    ))}
                </div>
            </div>

            {/* RECENT BETS */}
            <div className="px-4">
                <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-3 flex items-center gap-2">
                    <Trophy size={16} /> Recent Picks
                </h3>
                <div className="space-y-3">
                    {user.recentBets.map(bet => (
                        <div key={bet.id} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-white text-sm">{bet.pick}</h4>
                                <span className="text-xs text-gray-500">{bet.match}</span>
                            </div>
                            <div className="text-right">
                                <span className={`block font-black text-xs uppercase ${bet.result === 'WON' ? 'text-green-500' : 'text-red-500'}`}>
                                    {bet.result}
                                </span>
                                <span className="text-xs font-mono font-bold text-gray-400">{bet.odds.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                {!user.isPro && (
                    <div className="mt-4 p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl flex items-center gap-3">
                        <Lock size={20} className="text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-300 uppercase">Full History Hidden</span>
                    </div>
                )}
            </div>

        </div>
    );
};
