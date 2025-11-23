

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Share2, Check, PlusCircle, MapPin, Users, Calendar, Play, Heart, MessageCircle, Repeat, Trophy, Flame, BarChart2, ChevronRight, Shield, TrendingUp, Activity, Ticket, Table, AlertTriangle, Zap, Brain } from 'lucide-react';
import { Match, MatchStatus, Player, TimelineEvent, Standing, PredictionFactor } from '../types';
import { useNavigate } from 'react-router-dom';

interface MatchDetailPageProps {
  match: Match;
  onOpenPweza: () => void;
  onAddToSlip?: () => void;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({ match, onOpenPweza, onAddToSlip }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('STREAM');
  const [betSlipStatus, setBetSlipStatus] = useState<'IDLE' | 'CONFIRM' | 'ADDED'>('IDLE');
  const [isShared, setIsShared] = useState(false);
  const [userVote, setUserVote] = useState<'HOME' | 'AWAY' | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [match.id]);

  const handleAddToSlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (betSlipStatus === 'IDLE') {
        setBetSlipStatus('CONFIRM');
    } else if (betSlipStatus === 'CONFIRM') {
        setBetSlipStatus('ADDED');
        if (onAddToSlip) onAddToSlip();
        setTimeout(() => {
            setBetSlipStatus('IDLE');
        }, 3000);
    }
  };

  const handleShare = async () => {
    const shareData = {
        title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        text: `Sheena's Pick: ${match.prediction?.outcome === 'HOME' ? match.homeTeam.name : match.awayTeam.name}`,
        url: window.location.href
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) {}
    } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1. IMMERSIVE HEADER */}
      <header className="relative w-full bg-[#121212] border-b border-[#2C2C2C]">
          {/* Top Nav */}
          <div className="flex items-center justify-between px-4 h-[56px]">
             <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={24} />
             </button>
             <span className="font-condensed font-bold text-sm tracking-widest uppercase text-gray-500">{match.league}</span>
             <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center -mr-2 text-gray-400 hover:text-white transition-colors">
                {isShared ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
             </button>
          </div>

          {/* Matchup Banner */}
          <div className="px-6 pb-8 pt-2">
              <div className="flex items-center justify-between max-w-[400px] mx-auto">
                  {/* Home */}
                  <div className="flex flex-col items-center gap-3 w-[100px]">
                      <div className="w-16 h-16 object-contain relative">
                          <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-full h-full drop-shadow-lg" />
                          {match.prediction?.outcome === 'HOME' && (
                              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-lg transform rotate-6 border border-white/10">
                                  Pick
                              </div>
                          )}
                      </div>
                      <div className="text-center">
                          <h2 className="font-condensed font-black text-2xl uppercase leading-none mb-1">{match.homeTeam.name}</h2>
                          <span className="text-[11px] font-bold text-gray-500 block mb-1.5">{match.homeTeam.record}</span>
                          {/* FORM INDICATORS */}
                          {match.homeTeam.form && (
                              <div className="flex items-center justify-center gap-1">
                                  {match.homeTeam.form.map((r, i) => (
                                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${r === 'W' ? 'bg-[#00FFB2] shadow-[0_0_5px_rgba(0,255,178,0.4)]' : r === 'D' ? 'bg-gray-500' : 'bg-red-500'}`}></div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Score/VS */}
                  <div className="flex flex-col items-center justify-center w-[100px]">
                       {match.status === MatchStatus.LIVE ? (
                           <>
                               <span className="font-condensed font-black text-5xl tracking-tighter tabular-nums leading-none">{match.score?.home}-{match.score?.away}</span>
                               <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest mt-2 animate-pulse flex items-center gap-1">
                                   <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                   {match.time}
                               </span>
                           </>
                       ) : match.status === MatchStatus.FINISHED ? (
                           <>
                                <span className="font-condensed font-black text-5xl tracking-tighter tabular-nums leading-none text-white">{match.score?.home}-{match.score?.away}</span>
                                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Final</span>
                           </>
                       ) : (
                           <>
                               <span className="font-condensed font-black text-4xl text-[#333] tracking-tighter select-none">VS</span>
                               <span className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-2">{match.time}</span>
                           </>
                       )}
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center gap-3 w-[100px]">
                      <div className="w-16 h-16 object-contain relative">
                          <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-full h-full drop-shadow-lg" />
                          {match.prediction?.outcome === 'AWAY' && (
                              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-lg transform rotate-6 border border-white/10">
                                  Pick
                              </div>
                          )}
                      </div>
                      <div className="text-center">
                          <h2 className="font-condensed font-black text-2xl uppercase leading-none mb-1">{match.awayTeam.name}</h2>
                          <span className="text-[11px] font-bold text-gray-500 block mb-1.5">{match.awayTeam.record}</span>
                          {/* FORM INDICATORS */}
                          {match.awayTeam.form && (
                              <div className="flex items-center justify-center gap-1">
                                  {match.awayTeam.form.map((r, i) => (
                                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${r === 'W' ? 'bg-[#00FFB2] shadow-[0_0_5px_rgba(0,255,178,0.4)]' : r === 'D' ? 'bg-gray-500' : 'bg-red-500'}`}></div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex px-2 border-t border-[#2C2C2C] overflow-x-auto no-scrollbar">
              <TabButton label="Stream" active={activeTab === 'STREAM'} onClick={() => setActiveTab('STREAM')} />
              <TabButton label="Stats" active={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} />
              {match.status === MatchStatus.FINISHED && match.boxScore && (
                 <TabButton label="Box Score" active={activeTab === 'BOXSCORE'} onClick={() => setActiveTab('BOXSCORE')} />
              )}
              <TabButton label="Lineups" active={activeTab === 'PLAYERS'} onClick={() => setActiveTab('PLAYERS')} />
              <TabButton label="Table" active={activeTab === 'TABLE'} onClick={() => setActiveTab('TABLE')} />
              <TabButton label="Odds" active={activeTab === 'ODDS'} onClick={() => setActiveTab('ODDS')} />
          </div>
      </header>

      {/* 2. MAIN CONTENT STREAM */}
      <div className="max-w-[600px] mx-auto animate-in fade-in duration-500">
          
          {/* TAB: STREAM */}
          {activeTab === 'STREAM' && (
              <div className="flex flex-col">
                  
                  {/* A. FAN PULSE (Community Vote) */}
                  <div className="p-4 border-b border-[#2C2C2C] bg-[#121212]">
                      <div className="flex items-center gap-2 mb-3">
                          <Flame size={16} className="text-orange-500 fill-orange-500" />
                          <span className="font-condensed font-black text-lg uppercase italic tracking-tight">Fan Pulse</span>
                          <span className="text-xs text-gray-500 font-medium ml-auto">12.5k Votes</span>
                      </div>
                      
                      {!userVote ? (
                          <div className="flex gap-2">
                              <button onClick={() => setUserVote('HOME')} className="flex-1 py-3 bg-[#1E1E1E] hover:bg-[#2C2C2C] rounded font-condensed font-bold uppercase text-sm text-gray-300 transition-colors border border-white/5">
                                  {match.homeTeam.name}
                              </button>
                              <button onClick={() => setUserVote('AWAY')} className="flex-1 py-3 bg-[#1E1E1E] hover:bg-[#2C2C2C] rounded font-condensed font-bold uppercase text-sm text-gray-300 transition-colors border border-white/5">
                                  {match.awayTeam.name}
                              </button>
                          </div>
                      ) : (
                          <div className="w-full h-10 bg-[#1E1E1E] rounded relative overflow-hidden flex items-center">
                              <div className="h-full bg-indigo-600 flex items-center pl-3" style={{ width: '64%' }}>
                                  <span className="font-bold text-xs uppercase">{match.homeTeam.name} 64%</span>
                              </div>
                              <div className="h-full bg-gray-700 flex items-center justify-end pr-3 flex-1">
                                  <span className="font-bold text-xs uppercase">36%</span>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* B. SHEENA'S EDGE (Editorial Prediction) */}
                  {match.prediction && (
                    <div className="p-4 border-b border-[#2C2C2C] bg-gradient-to-b from-[#1E1E1E] to-[#121212]">
                        <div className="flex items-center gap-2 mb-4">
                             <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
                                 <Brain size={14} className="text-white" />
                             </div>
                             <span className="font-condensed font-black text-xl uppercase italic tracking-tight text-white">Neural Breakdown</span>
                             {match.prediction.modelEdge && (
                                 <div className="ml-auto flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                                     <TrendingUp size={12} className="text-green-500" />
                                     <span className="text-xs font-bold text-green-500">+{match.prediction.modelEdge}% Edge</span>
                                 </div>
                             )}
                        </div>

                        <div className="mb-6">
                            <h3 className="font-condensed font-black text-3xl uppercase leading-[0.9] mb-2 text-white">
                                {match.prediction.outcome === 'HOME' ? match.homeTeam.name : match.prediction.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'} 
                                <span className="text-indigo-500 ml-2">to Win</span>
                            </h3>
                            <p className="text-gray-400 text-[15px] leading-relaxed font-medium">
                                {match.prediction.aiReasoning}
                            </p>
                        </div>

                        {/* FACTOR GRID (NEW) */}
                        {match.prediction.factors && (
                            <div className="bg-[#121212] rounded-lg border border-[#2C2C2C] p-3 mb-5">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-[#2C2C2C] pb-2">Why the AI thinks this</div>
                                <div className="space-y-3">
                                    {match.prediction.factors.map((factor, idx) => (
                                        <FactorRow key={idx} factor={factor} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* System Record */}
                        {match.prediction.systemRecord && (
                            <div className="flex items-center gap-2 mb-5 text-xs text-gray-500">
                                <Trophy size={12} />
                                <span className="font-mono">System Record: {match.prediction.systemRecord}</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={onOpenPweza} 
                                className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-condensed font-bold uppercase text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-base">🐙</span> Ask Pweza
                            </button>
                            {match.prediction.potentialReturn && (
                                <button 
                                    onClick={handleAddToSlip}
                                    className={`
                                        py-3 rounded font-condensed font-bold uppercase text-sm transition-all flex items-center justify-center gap-2 shadow-lg
                                        ${betSlipStatus === 'ADDED' ? 'bg-green-600 text-white' : betSlipStatus === 'CONFIRM' ? 'bg-yellow-500 text-black' : 'bg-indigo-600 text-white hover:bg-indigo-500'}
                                    `}
                                >
                                    {betSlipStatus === 'IDLE' && <>Add to Slip</>}
                                    {betSlipStatus === 'CONFIRM' && <>Confirm?</>}
                                    {betSlipStatus === 'ADDED' && <Check size={16} />}
                                </button>
                            )}
                        </div>
                    </div>
                  )}

                  {/* C. THE STREAM (Feed Items) */}
                  <div className="bg-black pb-10">
                      {match.timeline ? (
                            match.timeline.map((event, index) => (
                                <StreamItem key={event.id} event={event} isLast={index === match.timeline!.length - 1} />
                            ))
                      ) : (
                          <div className="p-10 text-center">
                              <span className="text-gray-600 font-condensed font-bold uppercase text-xl">Feed Loading...</span>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* TAB: BOX SCORE (NEW) */}
          {activeTab === 'BOXSCORE' && match.boxScore && (
              <div className="p-4 space-y-6">
                   {/* Home Team */}
                   <div className="bg-[#121212] border border-[#2C2C2C] rounded-lg overflow-hidden">
                       <div className="px-4 py-3 bg-[#1E1E1E] border-b border-[#2C2C2C] flex items-center gap-2">
                           <img src={match.homeTeam.logo} className="w-5 h-5 object-contain" />
                           <h3 className="font-condensed font-bold text-sm uppercase text-white">{match.homeTeam.name}</h3>
                       </div>
                       <table className="w-full text-right text-sm">
                           <thead>
                               <tr className="text-[10px] text-gray-500 uppercase border-b border-[#2C2C2C]">
                                   <th className="text-left px-3 py-2 font-bold w-1/3">Player</th>
                                   {match.boxScore.headers.map(h => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}
                               </tr>
                           </thead>
                           <tbody>
                               {match.boxScore.home.map((p, i) => (
                                   <tr key={p.id} className={`border-b border-[#2C2C2C] hover:bg-white/5 ${i % 2 === 0 ? 'bg-black/20' : ''}`}>
                                       <td className="text-left px-3 py-2">
                                           <span className="block font-bold text-white text-xs">{p.name}</span>
                                       </td>
                                       {match.boxScore!.headers.map(h => (
                                           <td key={h} className="px-2 py-2 text-gray-300 font-mono">
                                               {h === 'MIN' ? p.minutes : p.stats[h] || 0}
                                           </td>
                                       ))}
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>

                   {/* Away Team */}
                   <div className="bg-[#121212] border border-[#2C2C2C] rounded-lg overflow-hidden">
                       <div className="px-4 py-3 bg-[#1E1E1E] border-b border-[#2C2C2C] flex items-center gap-2">
                           <img src={match.awayTeam.logo} className="w-5 h-5 object-contain" />
                           <h3 className="font-condensed font-bold text-sm uppercase text-white">{match.awayTeam.name}</h3>
                       </div>
                       <table className="w-full text-right text-sm">
                           <thead>
                               <tr className="text-[10px] text-gray-500 uppercase border-b border-[#2C2C2C]">
                                   <th className="text-left px-3 py-2 font-bold w-1/3">Player</th>
                                   {match.boxScore.headers.map(h => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}
                               </tr>
                           </thead>
                           <tbody>
                               {match.boxScore.away.map((p, i) => (
                                   <tr key={p.id} className={`border-b border-[#2C2C2C] hover:bg-white/5 ${i % 2 === 0 ? 'bg-black/20' : ''}`}>
                                       <td className="text-left px-3 py-2">
                                           <span className="block font-bold text-white text-xs">{p.name}</span>
                                       </td>
                                       {match.boxScore!.headers.map(h => (
                                           <td key={h} className="px-2 py-2 text-gray-300 font-mono">
                                               {h === 'MIN' ? p.minutes : p.stats[h] || 0}
                                           </td>
                                       ))}
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
              </div>
          )}

          {/* TAB: STATS */}
          {activeTab === 'STATS' && (
              <div className="p-4 space-y-6">
                  {match.stats ? (
                      <>
                        <StatSection title="Team Comparison">
                             <StatBar label="Possession" home={match.stats.possession?.home} away={match.stats.possession?.away} unit="%" />
                             <StatBar label="Total Shots" home={match.stats.shots?.home} away={match.stats.shots?.away} />
                             <StatBar label="On Target" home={match.stats.shotsOnTarget?.home} away={match.stats.shotsOnTarget?.away} />
                             <StatBar label="Corners" home={match.stats.corners?.home} away={match.stats.corners?.away} />
                             <StatBar label="Fouls" home={match.stats.fouls?.home} away={match.stats.fouls?.away} inverse />
                        </StatSection>
                        
                        {match.venueDetails && (
                            <div className="bg-[#121212] rounded border border-[#2C2C2C] overflow-hidden">
                                <div className="h-32 relative">
                                    <img src={match.venueDetails.imageUrl} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute bottom-2 left-3">
                                        <h4 className="font-condensed font-black text-white text-xl uppercase shadow-black drop-shadow-md">{match.venue}</h4>
                                    </div>
                                </div>
                                <div className="p-3 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500 text-[10px] font-bold uppercase">City</span>
                                        <span className="text-white font-bold">{match.venueDetails.city}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-[10px] font-bold uppercase">Capacity</span>
                                        <span className="text-white font-bold">{match.venueDetails.capacity}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                      </>
                  ) : (
                      <EmptyState icon={<Activity />} text="Stats unavailable" />
                  )}
              </div>
          )}

          {/* TAB: PLAYERS */}
          {activeTab === 'PLAYERS' && (
              <div className="p-4 space-y-4">
                  {match.keyPlayers ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                             <Users size={16} className="text-indigo-500" />
                             <span className="font-condensed font-black text-lg uppercase text-white italic">Key Matchups</span>
                        </div>
                        {match.keyPlayers.home.map(p => <PlayerRow key={p.id} player={p} />)}
                        {match.keyPlayers.away.map(p => <PlayerRow key={p.id} player={p} />)}
                      </>
                  ) : (
                      <EmptyState icon={<Users />} text="Lineups unavailable" />
                  )}
              </div>
          )}

          {/* TAB: TABLE (STANDINGS) */}
          {activeTab === 'TABLE' && (
              <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                        <Table size={16} className="text-indigo-500" />
                        <span className="font-condensed font-black text-lg uppercase text-white italic">League Table</span>
                  </div>
                  {match.standings ? (
                      <div className="bg-[#121212] rounded border border-[#2C2C2C] overflow-hidden">
                          <div className="flex items-center px-4 py-2 bg-[#1E1E1E] border-b border-[#2C2C2C] text-[10px] font-bold text-gray-500 uppercase">
                              <span className="w-8">Pos</span>
                              <span className="flex-1">Team</span>
                              <span className="w-8 text-center">P</span>
                              <span className="w-8 text-center">Pts</span>
                              <span className="w-16 text-center">Form</span>
                          </div>
                          {match.standings.map(s => (
                              <div key={s.teamId} className={`flex items-center px-4 py-3 border-b border-[#2C2C2C] ${s.teamId === match.homeTeam.id || s.teamId === match.awayTeam.id ? 'bg-indigo-500/10' : ''}`}>
                                  <span className={`w-8 font-condensed font-bold ${s.rank <= 4 ? 'text-indigo-400' : 'text-gray-400'}`}>{s.rank}</span>
                                  <div className="flex-1 flex items-center gap-2">
                                      <img src={s.logo} className="w-5 h-5 object-contain" />
                                      <span className={`font-bold text-sm ${s.teamId === match.homeTeam.id || s.teamId === match.awayTeam.id ? 'text-white' : 'text-gray-400'}`}>{s.teamName}</span>
                                  </div>
                                  <span className="w-8 text-center text-sm font-medium text-gray-500">{s.played}</span>
                                  <span className="w-8 text-center text-sm font-bold text-white">{s.points}</span>
                                  <div className="w-16 flex justify-center gap-0.5">
                                      {s.form.slice(0,3).map((f, i) => (
                                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${f === 'W' ? 'bg-green-500' : f === 'D' ? 'bg-gray-500' : 'bg-red-500'}`} />
                                      ))}
                                  </div>
                              </div>
                          ))}
                          <div className="p-3 text-center">
                               <button className="text-xs font-bold text-indigo-500 uppercase hover:text-indigo-400">View Full Table</button>
                          </div>
                      </div>
                  ) : (
                      <EmptyState icon={<Table />} text="Table unavailable" />
                  )}
              </div>
          )}
          
          {/* TAB: ODDS & MARKET */}
          {activeTab === 'ODDS' && (
              <div className="p-4 space-y-6">
                   {/* Market Pulse Widget */}
                   {match.bettingTrends && (
                       <div className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={16} className="text-green-500" />
                                <span className="font-condensed font-black text-lg uppercase text-white italic">Market Pulse</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase mb-2">
                                <span>{match.homeTeam.name}</span>
                                <span>{match.awayTeam.name}</span>
                            </div>
                            <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden mb-1">
                                <div className="absolute top-0 left-0 bottom-0 bg-indigo-500" style={{ width: `${match.bettingTrends.homeMoneyPercent}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-white mb-4">
                                <span>{match.bettingTrends.homeMoneyPercent}% Money</span>
                                <span>{100 - match.bettingTrends.homeMoneyPercent}% Money</span>
                            </div>

                            <div className="bg-[#1E1E1E] rounded p-3 flex items-start gap-3">
                                <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-xs font-bold text-white uppercase mb-1">Sharp Signal</span>
                                    <p className="text-xs text-gray-400 leading-normal">{match.bettingTrends.publicConsensus}</p>
                                </div>
                            </div>
                       </div>
                   )}

                   <div className="bg-[#121212] border border-[#2C2C2C] rounded p-6 text-center">
                       <span className="block mb-2 text-2xl">🔒</span>
                       <h3 className="font-condensed font-black text-xl uppercase text-white mb-2">Full Prop Market</h3>
                       <p className="text-gray-500 text-sm mb-4">Detailed player props, alt lines, and handicap markets.</p>
                       <button className="px-6 py-2 bg-indigo-600 text-white rounded font-bold text-sm uppercase">Notify Me</button>
                   </div>
              </div>
          )}

      </div>
    </div>
  );
};

// --- NEW FACTOR ROW COMPONENT ---
const FactorRow: React.FC<{ factor: PredictionFactor }> = ({ factor }) => (
    <div className="flex items-start gap-3 p-2 hover:bg-[#1E1E1E] rounded transition-colors">
        <div className={`mt-1 font-mono font-bold text-xs w-8 text-right ${factor.type === 'POSITIVE' ? 'text-green-400' : factor.type === 'NEGATIVE' ? 'text-red-400' : 'text-gray-400'}`}>
            {factor.weight > 0 ? '+' : ''}{factor.weight}%
        </div>
        <div className="flex-1">
            <span className={`block text-xs font-bold uppercase mb-0.5 ${factor.type === 'POSITIVE' ? 'text-green-400' : factor.type === 'NEGATIVE' ? 'text-red-400' : 'text-white'}`}>
                {factor.label}
            </span>
            <span className="text-[11px] text-gray-400 leading-tight block">
                {factor.description}
            </span>
        </div>
    </div>
);

// --- SUB COMPONENTS FOR THE "STREAM" ---

const TabButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex-1 min-w-[80px] h-[48px] flex items-center justify-center text-sm font-bold uppercase tracking-wider relative transition-colors ${
            active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
        }`}
    >
        {label}
        {active && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600"></div>}
    </button>
);

const StreamItem: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => {
    // Determine Type Styles
    const isSocial = event.type === 'SOCIAL';
    const isGoal = event.type === 'GOAL';
    const isHighlight = event.type === 'GOAL' || event.description.includes('Highlight');

    return (
        <div className={`py-6 border-b border-[#1E1E1E] ${isLast ? 'border-none' : ''}`}>
            {/* Header */}
            <div className="px-4 flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img 
                        src={event.avatar || (isGoal ? "https://ui-avatars.com/api/?name=Goal&background=000" : "https://ui-avatars.com/api/?name=Feed")} 
                        className="w-9 h-9 rounded-full object-cover border border-[#333]" 
                    />
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="font-bold text-sm text-white leading-none">{event.source || "Live Update"}</span>
                             {isGoal && <span className="bg-[#00FFB2] text-black text-[9px] font-black px-1 rounded uppercase">Goal</span>}
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{event.minute} • {isSocial ? 'Social' : 'Live Event'}</span>
                    </div>
                </div>
                <button className="text-gray-500 hover:text-white">
                    <Share2 size={16} />
                </button>
            </div>

            {/* Content Text */}
            <div className="px-4 mb-3">
                <p className={`text-[15px] leading-normal text-gray-200 ${isGoal ? 'font-bold text-lg' : ''}`}>
                    {event.description}
                </p>
            </div>

            {/* Media (Full Width) */}
            {event.mediaUrl && (
                <div className="w-full aspect-video bg-[#1E1E1E] relative group cursor-pointer mb-3">
                    <img src={event.mediaUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play size={20} className="fill-white text-white ml-1" />
                        </div>
                    </div>
                    {/* Tag overlay */}
                    {isGoal && (
                        <div className="absolute bottom-3 left-3 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wide">
                            Goal Highlight
                        </div>
                    )}
                </div>
            )}

            {/* Engagement Bar */}
            <div className="px-4 flex items-center gap-6">
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group">
                    <Heart size={20} className="group-hover:fill-red-500 transition-colors" />
                    <span className="text-xs font-bold">{event.likes ? (event.likes > 1000 ? (event.likes/1000).toFixed(1)+'k' : event.likes) : ''}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
                    <MessageCircle size={20} />
                </button>
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition-colors ml-auto">
                    <Repeat size={20} />
                </button>
            </div>
        </div>
    );
}

const StatSection = ({ title, children }: any) => (
    <section className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-5">
        <h3 className="font-condensed font-black text-lg uppercase text-white mb-5 border-b border-[#2C2C2C] pb-2">{title}</h3>
        <div className="space-y-5">
            {children}
        </div>
    </section>
);

const StatBar = ({ label, home, away, unit = '', inverse }: any) => {
    const total = (home || 0) + (away || 0);
    if (total === 0) return null;
    const homePct = (home / total) * 100;
    const isHomeWinning = inverse ? home < away : home > away;

    return (
        <div>
            <div className="flex justify-between mb-1.5 font-mono text-sm font-bold">
                <span className={isHomeWinning ? 'text-white' : 'text-gray-500'}>{home}{unit}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-sans pt-0.5">{label}</span>
                <span className={!isHomeWinning ? 'text-white' : 'text-gray-500'}>{away}{unit}</span>
            </div>
            <div className="flex w-full h-1.5 bg-[#2C2C2C] rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${homePct}%` }}></div>
            </div>
        </div>
    );
};

const PlayerRow: React.FC<{ player: Player }> = ({ player }) => (
    <div className="flex items-center gap-4 bg-[#121212] p-3 rounded border border-[#2C2C2C]">
        <img src={player.avatar} className="w-10 h-10 rounded-full bg-gray-800 object-cover" />
        <div className="flex-1">
            <h4 className="font-bold text-white leading-none">{player.name}</h4>
            <span className="text-xs text-gray-500">{player.position}</span>
        </div>
        <div className="text-right">
             <span className="block font-black text-lg text-white leading-none">{player.stats?.[0]?.value}</span>
             <span className="text-[9px] font-bold text-gray-500 uppercase">{player.stats?.[0]?.label}</span>
        </div>
    </div>
);

const EmptyState = ({ icon, text }: any) => (
    <div className="h-40 flex flex-col items-center justify-center text-gray-600 border border-dashed border-[#2C2C2C] rounded-lg">
        {React.cloneElement(icon, { size: 32, className: 'mb-2 opacity-50' })}
        <span className="font-condensed font-bold text-sm uppercase">{text}</span>
    </div>
);
