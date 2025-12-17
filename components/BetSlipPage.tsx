
import React, { useState } from 'react';
import { BetSlipItem, Match, MkekaType } from '../types';
import { Trash2, Share2, TrendingUp, Sparkles, Camera, Plus, Check, AlertTriangle, ArrowRight, DollarSign, ExternalLink, Trophy, X, Shield, Rocket, Goal, Heart } from 'lucide-react';
import { useSports } from '../context/SportsContext';
import { ScanBetSlipModal } from './ScanBetSlipModal';
import { ManualBetBuilderModal } from './ManualBetBuilderModal';

interface BetSlipPageProps {
  slipItems: BetSlipItem[];
  onRemoveItem: (id: string) => void;
  onClearSlip: () => void;
  matches: Match[]; // Passed to generate random picks
  onAddRandomPick: () => void;
  onOpenPweza: () => void;
  onAddItem: (item: BetSlipItem) => void;
}

export const BetSlipPage: React.FC<BetSlipPageProps> = ({ slipItems, onRemoveItem, onClearSlip, matches, onAddRandomPick, onOpenPweza, onAddItem }) => {
   const { generateMkeka, followedBetslips, followBetslip, unfollowBetslip, user, logout } = useSports();
  const [wager, setWager] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [shared, setShared] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showManualBuilder, setShowManualBuilder] = useState(false);
  const [pwezaTargetOdds, setPwezaTargetOdds] = useState<number>(5.0);
  const [pwezaRiskLevel, setPwezaRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  // Generate a unique betslip ID based on current items
  const betslipId = slipItems.length > 0 ? slipItems.map(item => item.id).sort().join('_') : null;
  const isBetslipFollowed = betslipId ? followedBetslips.some(f => f.betslipId === betslipId) : false;

  const handleToggleFollowBetslip = async () => {
      if (!user) {
          if (confirm("Sign up to follow betslips and get live notifications!")) {
              logout();
          }
          return;
      }

      if (!betslipId) return;

      if (isBetslipFollowed) {
          await unfollowBetslip(betslipId);
      } else {
          await followBetslip(betslipId);
      }
  };

  // Calculate Parlay Odds (Simple Multiplication)
  const totalOdds = slipItems.reduce((acc, item) => acc * item.odds, 1);
  const potentialReturn = (wager * totalOdds).toFixed(2);
  const totalOddsDisplay = totalOdds.toFixed(2);

  const handleGenerateMkeka = (type: MkekaType) => {
      setIsGenerating(type);
      setTimeout(() => {
          generateMkeka(type);
          setIsGenerating(null);
      }, 1500);
  };

  const handleScanSlip = () => {
      setShowScanModal(true);
  };

  const handleShare = () => {
      setShared(true);
      if (navigator.share) {
          navigator.share({
              title: "My Sheena Parlay",
              text: `Check out this ${slipItems.length}-leg parlay! Odds: ${totalOddsDisplay}`,
              url: window.location.href
          }).catch(() => {});
      }
      setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
        
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 h-[60px] flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="font-condensed font-black text-2xl uppercase italic tracking-tighter">My Slip</span>
                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{slipItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
                {slipItems.length > 0 && (
                    <button onClick={handleToggleFollowBetslip} className={`w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors ${isBetslipFollowed ? 'text-indigo-400' : ''}`}>
                        <Heart size={16} className={isBetslipFollowed ? 'fill-current' : ''} />
                    </button>
                )}
                {slipItems.length > 0 && (
                    <button onClick={onClearSlip} className="text-xs font-bold text-gray-500 uppercase hover:text-red-500 transition-colors">
                        Clear All
                    </button>
                )}
            </div>
        </div>

        <div className="max-w-[600px] mx-auto">
            
            {/* MKEKA WIZARD SECTION */}
            <div className="p-4 border-b border-[#2C2C2C] bg-[#0A0A0A]">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-[#00FFB2]" />
                    <h3 className="font-condensed font-black text-sm uppercase text-gray-400 tracking-wide">Auto-Mkeka Wizard</h3>
                </div>
                
                {/* PWEZA CUSTOM CONTROLS */}
                <div className="mb-4 p-3 bg-[#0A0A0A] rounded-lg border border-[#2C2C2C]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🐙</span>
                        <span className="font-condensed font-bold text-sm text-white uppercase">Pweza Parlay Builder</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Odds</label>
                            <select
                                value={pwezaTargetOdds}
                                onChange={(e) => setPwezaTargetOdds(Number(e.target.value))}
                                className="w-full bg-[#1E1E1E] border border-[#333] rounded px-2 py-1 text-sm text-white"
                            >
                                <option value={3}>3.0 Odds</option>
                                <option value={5}>5.0 Odds</option>
                                <option value={10}>10.0 Odds</option>
                                <option value={20}>20.0 Odds</option>
                                <option value={30}>30.0 Odds</option>
                                <option value={50}>50.0+ Odds</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Risk Level</label>
                            <select
                                value={pwezaRiskLevel}
                                onChange={(e) => setPwezaRiskLevel(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                                className="w-full bg-[#1E1E1E] border border-[#333] rounded px-2 py-1 text-sm text-white"
                            >
                                <option value="LOW">Conservative</option>
                                <option value="MEDIUM">Balanced</option>
                                <option value="HIGH">Aggressive</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => onOpenPweza(`Create a ${pwezaRiskLevel.toLowerCase()} risk parlay targeting ${pwezaTargetOdds}x odds. Include mix of match winners, BTTS, and over/under markets. Show me the markets selected and why.`)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-sm rounded-lg transition-colors"
                    >
                        Ask Pweza to Build Parlay
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {/* OPTION 1: SAFE */}
                    <button 
                        onClick={() => handleGenerateMkeka('SAFE')}
                        disabled={!!isGenerating}
                        className="bg-[#1E1E1E] border border-[#2C2C2C] hover:border-green-500/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isGenerating === 'SAFE' ? <div className="animate-spin text-lg">🛡️</div> : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-green-900/20 flex items-center justify-center text-green-500">
                                    <Shield size={16} />
                                </div>
                                <div className="text-center">
                                    <span className="block font-condensed font-bold text-xs text-white uppercase leading-none mb-0.5">Banker</span>
                                    <span className="text-[9px] text-gray-500">Low Risk</span>
                                </div>
                            </>
                        )}
                    </button>

                    {/* OPTION 2: LONGSHOT */}
                    <button 
                         onClick={() => handleGenerateMkeka('LONGSHOT')}
                         disabled={!!isGenerating}
                        className="bg-[#1E1E1E] border border-[#2C2C2C] hover:border-purple-500/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isGenerating === 'LONGSHOT' ? <div className="animate-spin text-lg">🚀</div> : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-purple-900/20 flex items-center justify-center text-purple-500">
                                    <Rocket size={16} />
                                </div>
                                <div className="text-center">
                                    <span className="block font-condensed font-bold text-xs text-white uppercase leading-none mb-0.5">Longshot</span>
                                    <span className="text-[9px] text-gray-500">High Odds</span>
                                </div>
                            </>
                        )}
                    </button>

                    {/* OPTION 3: GOALS */}
                    <button 
                         onClick={() => handleGenerateMkeka('GOALS')}
                         disabled={!!isGenerating}
                        className="bg-[#1E1E1E] border border-[#2C2C2C] hover:border-yellow-500/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isGenerating === 'GOALS' ? <div className="animate-spin text-lg">⚽</div> : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-yellow-900/20 flex items-center justify-center text-yellow-500">
                                    <Goal size={16} />
                                </div>
                                <div className="text-center">
                                    <span className="block font-condensed font-bold text-xs text-white uppercase leading-none mb-0.5">Goal Fest</span>
                                    <span className="text-[9px] text-gray-500">Over 2.5</span>
                                </div>
                            </>
                        )}
                    </button>
                </div>

                {/* MANUAL BUILDER BUTTON */}
                <button
                    onClick={() => setShowManualBuilder(true)}
                    className="w-full mt-3 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg flex items-center justify-center gap-2 text-sm font-bold text-white uppercase transition-all shadow-lg"
                >
                    <Plus size={16} /> Build Your Own Parlay
                </button>

                <button
                    onClick={handleScanSlip}
                    className="w-full mt-2 py-2 bg-[#1E1E1E] border border-[#2C2C2C] hover:bg-[#252525] rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase transition-colors"
                >
                    <Camera size={14} /> Scan Physical Ticket
                </button>
            </div>

            {/* EMPTY STATE */}
            {slipItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="w-20 h-20 bg-[#1E1E1E] rounded-full flex items-center justify-center mb-6">
                        <TrendingUp size={32} className="text-gray-600" />
                    </div>
                    <h2 className="font-condensed font-black text-2xl uppercase text-white mb-2">Slip is Empty</h2>
                    <p className="text-gray-500 text-sm mb-8 max-w-[250px]">
                        Select a mode above to auto-generate a slip, or add picks from the feed.
                    </p>
                </div>
            )}

            {/* BET LIST */}
            {slipItems.length > 0 && (
                <div className="p-4 space-y-3 pb-40">
                    {slipItems.map((item) => (
                        item && (
                        <div key={item.id} className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C2C] relative group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide bg-black/30 px-1.5 py-0.5 rounded">
                                    {item.market || 'Match Winner'}
                                </span>
                                <button onClick={() => onRemoveItem(item.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <h3 className="font-condensed font-black text-xl text-white uppercase leading-none mb-1 text-indigo-400">
                                        {item.selection}
                                    </h3>
                                    <span className="text-xs font-medium text-gray-400">{item.matchUp}</span>
                                </div>
                                <div className="bg-[#2C2C2C] px-3 py-1.5 rounded text-lg font-mono font-bold text-white">
                                    {item.odds.toFixed(2)}
                                </div>
                            </div>

                            {/* Pweza Insight Badge */}
                            {item.confidence && item.confidence > 75 && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-[10px] font-bold text-green-400 uppercase">
                                    <Sparkles size={10} />
                                    <span>High Confidence</span>
                                </div>
                            )}
                        </div>
                        )
                    ))}
                    
                    {/* ADD MORE BUTTON */}
                    <button onClick={onAddRandomPick} className="w-full py-4 border border-dashed border-[#2C2C2C] rounded-lg text-gray-500 font-condensed font-bold uppercase hover:bg-[#1E1E1E] hover:text-white transition-colors flex items-center justify-center gap-2">
                        <Plus size={16} /> Add Another Pick
                    </button>
                </div>
            )}
        </div>

        {/* STICKY FOOTER SUMMARY */}
        {slipItems.length > 0 && (
            <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 md:ml-[280px] bg-[#121212] border-t border-[#2C2C2C] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30">
                <div className="max-w-[600px] mx-auto">
                    
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#1E1E1E] rounded px-3 py-2 flex items-center gap-2 border border-[#333]">
                                <DollarSign size={14} className="text-gray-400" />
                                <input 
                                    type="number" 
                                    value={wager} 
                                    onChange={(e) => setWager(Number(e.target.value))}
                                    className="bg-transparent w-16 text-white font-bold text-sm focus:outline-none"
                                />
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase">Wager</span>
                        </div>
                        <div className="text-right">
                             <span className="block text-[10px] font-bold text-gray-500 uppercase">Potential Return</span>
                             <span className="font-mono font-black text-2xl text-[#00FFB2]">${potentialReturn}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleShare} className="w-12 h-12 bg-[#1E1E1E] hover:bg-[#2C2C2C] rounded-lg flex items-center justify-center text-white border border-[#333] transition-colors">
                            {shared ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                        </button>
                        <button
                            onClick={() => setShowExecution(true)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-condensed font-black text-xl uppercase rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-transform active:scale-95"
                        >
                            Compare Odds <TrendingUp size={20} />
                        </button>
                    </div>

                </div>
            </div>
        )}

        {/* EXECUTION HUB MODAL */}
        {showExecution && (
            <ExecutionModal
                wager={wager}
                totalOdds={totalOdds}
                onClose={() => setShowExecution(false)}
            />
        )}

        {/* SCAN BET SLIP MODAL */}
        <ScanBetSlipModal
            isOpen={showScanModal}
            onClose={() => setShowScanModal(false)}
            onAddItem={onAddItem}
        />

        {/* MANUAL BET BUILDER MODAL */}
        <ManualBetBuilderModal
            isOpen={showManualBuilder}
            onClose={() => setShowManualBuilder(false)}
            matches={matches}
            onAddItem={onAddItem}
            existingItems={slipItems}
        />
    </div>
  );
};

// --- ODDS COMPARISON HUB (AFFILIATE REVENUE) ---

const ExecutionModal = ({ wager, totalOdds, onClose }: { wager: number, totalOdds: number, onClose: () => void }) => {
    // Simulate realistic odds variations across bookmakers
    const bookmakers = [
        { name: 'FanDuel', code: 'FD', color: 'blue', odds: totalOdds * 1.05, affiliateUrl: 'https://fanDuel.com', bonus: '$1000 Bonus' },
        { name: 'DraftKings', code: 'DK', color: 'green', odds: totalOdds * 1.02, affiliateUrl: 'https://draftkings.com', bonus: '$500 Free Bet' },
        { name: 'BetMGM', code: 'MGM', color: 'yellow', odds: totalOdds * 0.98, affiliateUrl: 'https://betmgm.com', bonus: '100% Match' },
        { name: 'Caesars', code: 'CZR', color: 'purple', odds: totalOdds * 1.03, affiliateUrl: 'https://caesars.com', bonus: '$1500 Welcome' },
        { name: 'BetRivers', code: 'BR', color: 'red', odds: totalOdds * 1.01, affiliateUrl: 'https://betrivers.com', bonus: '$250 Risk Free' }
    ];

    const bestOdds = Math.max(...bookmakers.map(b => b.odds));
    const bestBookmaker = bookmakers.find(b => b.odds === bestOdds);

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1E1E1E] w-full max-w-[400px] rounded-2xl border border-[#2C2C2C] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
                
                {/* Header */}
                <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between bg-[#121212]">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-[#00FFB2]" />
                        <h3 className="font-condensed font-black text-xl uppercase text-white">Odds Comparison</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Best Value Message */}
                <div className="bg-green-600/10 p-4 flex gap-3">
                    <div className="mt-0.5"><Trophy size={16} className="text-green-500" /></div>
                    <div>
                        <h4 className="font-bold text-sm text-green-400 uppercase mb-1">Best Odds Found!</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            {bestBookmaker?.name} offers the best payout of <span className="text-[#00FFB2] font-bold">${(wager * bestBookmaker.odds).toFixed(2)}</span> vs ${(wager * totalOdds).toFixed(2)} average.
                        </p>
                    </div>
                </div>

                {/* Sportsbook List */}
                <div className="p-4 space-y-3">
                    {bookmakers.map((bookmaker, index) => {
                        const payout = (wager * bookmaker.odds).toFixed(2);
                        const isBest = bookmaker.odds === bestOdds;

                        return (
                            <div
                                key={bookmaker.code}
                                onClick={() => window.open(bookmaker.affiliateUrl, '_blank')}
                                className={`bg-[#121212] border rounded-lg p-3 flex items-center justify-between relative overflow-hidden group cursor-pointer hover:bg-[#1A1A1A] transition-colors ${
                                    isBest ? 'border-[#00FFB2]' : 'border-[#2C2C2C]'
                                }`}
                            >
                                {isBest && (
                                    <div className="absolute top-0 right-0 bg-[#00FFB2] text-black text-[9px] font-black px-1.5 py-0.5 uppercase">
                                        Best Odds
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded bg-${bookmaker.color}-500 flex items-center justify-center font-black text-white text-xs`}>
                                        {bookmaker.code}
                                    </div>
                                    <div>
                                        <span className="block font-bold text-white text-sm">{bookmaker.name}</span>
                                        <span className="text-[10px] text-[#00FFB2] uppercase font-bold">{bookmaker.bonus}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <span className={`block font-mono font-black text-lg ${isBest ? 'text-[#00FFB2]' : 'text-white'}`}>
                                         ${payout}
                                     </span>
                                     <div className="flex items-center gap-1 justify-end text-[10px] text-gray-400 font-bold uppercase">
                                         Place Bet <ExternalLink size={10} />
                                     </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Affiliate Disclaimer */}
                <div className="p-4 border-t border-[#2C2C2C] bg-[#121212]">
                    <div className="text-center mb-3">
                        <p className="text-[10px] text-gray-500 mb-2">Affiliate links help support Sheena Sports</p>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-[#2C2C2C] hover:bg-[#333] text-white font-condensed font-bold uppercase rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Check size={18} className="text-gray-400" />
                            Continue Building Slip
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
