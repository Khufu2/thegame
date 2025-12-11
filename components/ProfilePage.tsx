
import React, { useState } from 'react';
import { UserProfile, BetSlipItem, Match } from '../types';
import { Settings, Award, TrendingUp, Shield, Crown, ChevronRight, LogOut, Bell, Heart, CreditCard, Plus, Check, Lock, Trophy, X, Coins, Copy, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';
import { initiateStripeCheckout, verifyCryptoTransaction } from '../services/paymentService';

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
   const navigate = useNavigate();
   const { updatePreferences, logout } = useSports(); // Use this to upgrade user locally after success
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SQUAD' | 'HISTORY'>('OVERVIEW');
  const [favorites, setFavorites] = useState<string[]>(user.preferences.favoriteLeagues);
  const [followedTeams, setFollowedTeams] = useState<string[]>(user.preferences.favoriteTeams);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  // Callback when payment succeeds
  const handleUpgradeSuccess = () => {
      // In a real app, the backend would update the user via webhook
      // Here we update local state to show "Pro" badge immediately
      // Note: This requires 'updatePreferences' or a dedicated 'upgradeUser' function in context
      // For now we just close the modal and alert
      setShowPaymentModal(false);
      alert("Welcome to Sheena+ Pro! Your account has been upgraded.");
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans relative">
        
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 h-[60px] flex items-center justify-between">
            <span className="font-condensed font-black text-2xl uppercase italic tracking-tighter">My Profile</span>
            <button onClick={() => navigate('/settings')} className="text-gray-400 hover:text-white transition-colors">
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
                    
                    {/* ADMIN BUTTON */}
                    {user.isAdmin && (
                        <button 
                            onClick={() => navigate('/admin')}
                            className="w-full py-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center justify-center gap-2 text-red-500 font-condensed font-black uppercase hover:bg-red-900/30 transition-colors"
                        >
                            <Lock size={18} /> Access Command Center
                        </button>
                    )}

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
                                <button 
                                    onClick={() => setShowPaymentModal(true)}
                                    className="w-full py-3 bg-white text-indigo-900 font-condensed font-black uppercase rounded shadow-lg hover:bg-gray-100 transition-colors"
                                >
                                    Upgrade • $9.99/mo
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Leaderboard Link */}
                    <button onClick={() => navigate('/leaderboard')} className="w-full flex items-center justify-between p-4 border border-[#2C2C2C] bg-[#1E1E1E] rounded-xl hover:bg-[#252525] transition-colors group">
                        <div className="flex items-center gap-3">
                            <Trophy size={18} className="text-yellow-400" />
                            <span className="font-condensed font-bold text-sm uppercase text-white">View Leaderboard</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-600" />
                    </button>

                    {/* Quick Settings */}
                    <div className="space-y-1">
                        <MenuItem onClick={() => navigate('/settings')} icon={<Bell size={18} />} label="Notifications" value="On" />
                        <MenuItem onClick={() => navigate('/settings')} icon={<CreditCard size={18} />} label="Manage Subscription" />
                        <MenuItem onClick={() => navigate('/settings')} icon={<Shield size={18} />} label="Privacy & Security" />
                        <MenuItem onClick={() => { logout(); navigate('/auth'); }} icon={<LogOut size={18} />} label="Sign Out" danger />
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

        {/* PAYMENT MODAL */}
        {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} onSuccess={handleUpgradeSuccess} />}
    </div>
  );
};

// --- SUB COMPONENTS ---

const PaymentModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [method, setMethod] = useState<'CARD' | 'CRYPTO'>('CARD');
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    const handlePay = async () => {
        setStatus('PROCESSING');
        setErrorMsg('');
        
        try {
            let result;
            if (method === 'CARD') {
                result = await initiateStripeCheckout('price_pro_monthly');
            } else {
                result = await verifyCryptoTransaction('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
            }

            if (result.success) {
                setStatus('SUCCESS');
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setStatus('ERROR');
                setErrorMsg(result.message || 'Payment Failed');
            }
        } catch (e) {
            setStatus('ERROR');
            setErrorMsg("Connection Error");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#1E1E1E] border border-[#2C2C2C] w-full max-w-[400px] rounded-xl overflow-hidden shadow-2xl">
                
                <div className="flex justify-between items-center p-4 border-b border-[#2C2C2C] bg-[#121212]">
                    <div className="flex items-center gap-2">
                        <Crown size={20} className="text-yellow-400" />
                        <h3 className="font-condensed font-black text-xl uppercase italic">Upgrade to Pro</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>

                {status === 'SUCCESS' ? (
                     <div className="p-8 text-center animate-in zoom-in">
                         <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-4 border border-green-500/50">
                             <Check size={32} />
                         </div>
                         <h3 className="font-condensed font-black text-2xl uppercase text-white mb-2">Upgrade Complete!</h3>
                         <p className="text-gray-400 text-sm">Welcome to the elite circle.</p>
                     </div>
                ) : (
                    <>
                        <div className="flex p-2 gap-2 bg-[#121212]">
                            <button onClick={() => setMethod('CARD')} disabled={status === 'PROCESSING'} className={`flex-1 py-2 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors ${method === 'CARD' ? 'bg-[#2C2C2C] text-white' : 'text-gray-500 hover:bg-[#1E1E1E]'}`}>
                                <CreditCard size={14} /> Card
                            </button>
                            <button onClick={() => setMethod('CRYPTO')} disabled={status === 'PROCESSING'} className={`flex-1 py-2 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors ${method === 'CRYPTO' ? 'bg-[#2C2C2C] text-white' : 'text-gray-500 hover:bg-[#1E1E1E]'}`}>
                                <Coins size={14} /> Crypto
                            </button>
                        </div>

                        <div className="p-6">
                            {method === 'CARD' ? (
                                <div className="space-y-4">
                                    <div className="bg-black/50 p-4 rounded border border-white/10 text-center">
                                        <p className="text-sm font-bold text-gray-400">Secure Stripe Checkout</p>
                                        <p className="text-xs text-gray-500 mt-1">Accepts Visa, Mastercard, Amex</p>
                                    </div>
                                    <button 
                                        onClick={handlePay}
                                        disabled={status === 'PROCESSING'}
                                        className="w-full py-3 bg-indigo-600 text-white font-condensed font-black uppercase rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {status === 'PROCESSING' ? <Loader2 className="animate-spin" /> : 'Pay $9.99'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-400 text-center">
                                        Use Crypto for instant, borderless upgrades.
                                        <br />Recommended: <span className="text-[#00FFB2] font-bold">USDT (TRC20)</span>
                                    </p>
                                    
                                    <div className="bg-white p-4 rounded-xl flex justify-center">
                                        {/* Mock QR */}
                                        <div className="w-32 h-32 bg-black opacity-10"></div>
                                    </div>

                                    <div className="bg-black border border-[#333] rounded p-3 flex items-center justify-between">
                                        <span className="font-mono text-xs text-gray-300 truncate mr-2">TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</span>
                                        <button className="text-indigo-400 hover:text-indigo-300"><Copy size={16} /></button>
                                    </div>
                                    
                                    <div className="text-center text-[10px] text-gray-500 uppercase font-bold">
                                        Send exactly $9.99 USDT.
                                    </div>
                                    
                                    <button 
                                        onClick={handlePay}
                                        disabled={status === 'PROCESSING'}
                                        className="w-full py-3 bg-[#00FFB2] text-black font-condensed font-black uppercase rounded hover:bg-[#00E09E] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {status === 'PROCESSING' ? <Loader2 className="animate-spin" /> : 'I Have Sent Payment'}
                                    </button>
                                </div>
                            )}

                            {status === 'ERROR' && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-500 text-xs font-bold text-center">
                                    {errorMsg}
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>
        </div>
    )
}

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

const MenuItem = ({ icon, label, value, danger, onClick }: any) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 border-b border-[#1E1E1E] hover:bg-[#1E1E1E] transition-colors group">
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
