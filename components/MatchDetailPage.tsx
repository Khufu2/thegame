
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Share2, Check, PlusCircle, MapPin, Users, Calendar, Play, Heart, MessageCircle, Repeat, Trophy, Flame, BarChart2, ChevronRight, Shield, TrendingUp, Activity, Ticket, Table, AlertTriangle, Zap, Brain, Timer, History, Goal, User, Twitter, Monitor, Shirt, ArrowRightLeft } from 'lucide-react';
import { Match, MatchStatus, Player, TimelineEvent, Standing, PredictionFactor, TeamLineup, LineupPlayer, BoxScore } from '../types';
import { useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';

interface MatchDetailPageProps {
  match: Match;
  onOpenPweza: (prompt?: string) => void;
  onAddToSlip?: () => void;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({ match, onOpenPweza, onAddToSlip }) => {
  const navigate = useNavigate();
  const { betSlip } = useSports();
  const [activeTab, setActiveTab] = useState('STREAM');
  const [betSlipStatus, setBetSlipStatus] = useState<'IDLE' | 'CONFIRM' | 'ADDED'>('IDLE');
  const [isShared, setIsShared] = useState(false);
  const [userVote, setUserVote] = useState<'HOME' | 'AWAY' | null>(null);
  const [pitchSide, setPitchSide] = useState<'HOME' | 'AWAY'>('HOME');

  // Check if match is already in slip
  const existingBet = betSlip.find(b => b.matchId === match.id);
  const isInSlip = !!existingBet;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [match.id]);

  const handleAddToSlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInSlip) {
        navigate('/slip'); // Go to slip if already added
        return;
    }

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

  const handleOpenPwezaContext = () => {
      const prompt = `Give me a quick 50-word sharp betting insight for ${match.homeTeam.name} vs ${match.awayTeam.name}. Focus on value and key stats.`;
      onOpenPweza(prompt);
  }

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
    <div className="min-h-screen bg-black text-white pb-[120px] font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1. IMMERSIVE HEADER */}
      <header className="relative w-full bg-[#121212] border-b border-[#2C2C2C]">
          {/* Top Nav */}
          <div className="flex items-center justify-between px-4 h-[56px]">
             <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={24} />
             </button>
             <span className="font-condensed font-bold text-sm tracking-widest uppercase text-gray-500">{match.league}</span>
             <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center -mr-2 text-gray-400 hover:text-white transition-colors">
                {isShared ? <Check size={24} className="text-green-500" /> : <Share2 size={24} />}
             </button>
          </div>

          {/* Scoreboard */}
          <div className="pb-6 pt-2 px-6">
              <div className="flex items-center justify-between">
                  {/* Home */}
                  <div className="flex flex-col items-center w-1/3">
                      <div className="w-16 h-16 bg-white/5 rounded-full p-3 mb-3 border border-white/10 shadow-lg">
                          <img src={match.homeTeam.logo} className="w-full h-full object-contain" />
                      </div>
                      <h2 className="font-condensed font-black text-xl uppercase leading-none text-center mb-1">{match.homeTeam.name}</h2>
                      {match.homeTeam.form && (
                          <div className="flex gap-0.5">
                              {match.homeTeam.form.map((res, i) => (
                                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${res === 'W' ? 'bg-green-500' : res === 'L' ? 'bg-red-500' : 'bg-gray-500'}`} />
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Score/Time */}
                  <div className="flex flex-col items-center w-1/3">
                       <span className="font-condensed font-black text-5xl tracking-tighter tabular-nums leading-none mb-1">
                           {match.status === MatchStatus.SCHEDULED ? 'VS' : `${match.score?.home}-${match.score?.away}`}
                       </span>
                       <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${match.status === MatchStatus.LIVE ? 'bg-red-600 text-white animate-pulse' : 'bg-[#2C2C2C] text-gray-400'}`}>
                           {match.time}
                       </div>
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center w-1/3">
                      <div className="w-16 h-16 bg-white/5 rounded-full p-3 mb-3 border border-white/10 shadow-lg">
                          <img src={match.awayTeam.logo} className="w-full h-full object-contain" />
                      </div>
                      <h2 className="font-condensed font-black text-xl uppercase leading-none text-center mb-1">{match.awayTeam.name}</h2>
                       {match.awayTeam.form && (
                          <div className="flex gap-0.5">
                              {match.awayTeam.form.map((res, i) => (
                                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${res === 'W' ? 'bg-green-500' : res === 'L' ? 'bg-red-500' : 'bg-gray-500'}`} />
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Fan Pulse (Engagement) */}
          <div className="px-6 pb-6">
              {!userVote ? (
                  <div className="flex rounded-full overflow-hidden h-10 border border-[#333] relative bg-[#0A0A0A]">
                      <button onClick={() => setUserVote('HOME')} className="flex-1 hover:bg-white/5 transition-colors text-xs font-bold uppercase text-gray-400 flex items-center justify-center gap-2">
                          {match.homeTeam.name} to win
                      </button>
                      <div className="w-[1px] bg-[#333]"></div>
                      <button onClick={() => setUserVote('AWAY')} className="flex-1 hover:bg-white/5 transition-colors text-xs font-bold uppercase text-gray-400 flex items-center justify-center gap-2">
                          {match.awayTeam.name} to win
                      </button>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-6 h-6 rounded-full bg-[#121212] border border-[#333] flex items-center justify-center text-[8px] font-black text-gray-500">VS</div>
                      </div>
                  </div>
              ) : (
                  <div className="h-10 flex items-center justify-center gap-2 animate-in fade-in zoom-in">
                      <span className="text-sm font-bold text-[#00FFB2]">Vote Recorded</span>
                      <div className="h-1.5 w-32 bg-gray-800 rounded-full overflow-hidden flex">
                          <div className="w-[65%] bg-indigo-500"></div>
                      </div>
                      <span className="text-xs font-mono text-gray-400">65%</span>
                  </div>
              )}
          </div>

          {/* TABS SCROLL */}
          <div className="flex items-center gap-6 px-6 overflow-x-auto no-scrollbar border-t border-[#2C2C2C]">
              {['STREAM', 'TIMELINE', 'BOX SCORE', 'STATS', 'LINEUPS', 'ODDS', 'TABLE'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 font-condensed font-bold text-sm uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                  >
                      {tab}
                  </button>
              ))}
          </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-[700px] mx-auto">
          
          {/* TAB: STREAM (Overview) */}
          {activeTab === 'STREAM' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* PREDICTION CARD (Editorial Style) */}
                  {match.prediction && (
                      <div className="m-4 rounded-xl overflow-hidden border border-[#2C2C2C] bg-[#121212]">
                          <div className="bg-indigo-900/20 p-3 border-b border-indigo-500/20 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                  <Brain size={16} className="text-indigo-400" />
                                  <span className="font-condensed font-black text-sm uppercase text-indigo-100 tracking-wide">Sheena's Edge</span>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                                  {match.prediction.confidence}% Confidence
                              </span>
                          </div>
                          
                          <div className="p-5">
                               <h3 className="font-condensed font-black text-2xl uppercase italic text-white mb-2 leading-none">
                                   {match.prediction.keyInsight}
                               </h3>
                               <p className="text-sm text-gray-400 leading-relaxed mb-4 border-l-2 border-indigo-500 pl-3">
                                   {match.prediction.aiReasoning}
                               </p>

                               {/* FACTORS BREAKDOWN */}
                               {match.prediction.factors && (
                                   <div className="grid gap-2 mb-4">
                                       {match.prediction.factors.map((factor, idx) => (
                                           <div key={idx} className="flex items-center justify-between text-xs bg-black/40 p-2 rounded">
                                               <span className="text-gray-300 font-medium">{factor.label}</span>
                                               <span className={`font-black ${factor.type === 'POSITIVE' ? 'text-green-400' : factor.type === 'NEGATIVE' ? 'text-red-500' : 'text-gray-500'}`}>
                                                   {factor.type === 'POSITIVE' ? '+' : ''}{factor.weight}
                                               </span>
                                           </div>
                                       ))}
                                   </div>
                               )}
                               
                               <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2C2C2C]">
                                   <div>
                                       <span className="block text-[10px] font-bold text-gray-500 uppercase">The Pick</span>
                                       <span className="font-condensed font-black text-xl text-white uppercase">
                                           {match.prediction.outcome === 'HOME' ? match.homeTeam.name : match.prediction.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'}
                                       </span>
                                   </div>
                                   {match.prediction.odds && (
                                       <div className="text-right">
                                           <span className="block text-[10px] font-bold text-gray-500 uppercase">Implied Odds</span>
                                           <div className="flex gap-4 font-mono font-bold text-lg text-indigo-400">
                                               <span className={match.prediction.outcome === 'HOME' ? 'text-[#00FFB2]' : 'opacity-40'}>H: {match.prediction.odds.home}</span>
                                               <span className={match.prediction.outcome === 'DRAW' ? 'text-[#00FFB2]' : 'opacity-40'}>D: {match.prediction.odds.draw}</span>
                                               <span className={match.prediction.outcome === 'AWAY' ? 'text-[#00FFB2]' : 'opacity-40'}>A: {match.prediction.odds.away}</span>
                                           </div>
                                       </div>
                                   )}
                               </div>
                          </div>
                      </div>
                  )}

                  {/* INJURY REPORT */}
                  {match.context?.injuryReport && (
                      <div className="mx-4 mb-4 bg-red-900/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                          <Activity size={18} className="text-red-500 mt-0.5 shrink-0" />
                          <div>
                              <h4 className="font-bold text-red-500 text-xs uppercase mb-1">Injury Report</h4>
                              <p className="text-sm text-gray-300">{match.context.injuryReport}</p>
                          </div>
                      </div>
                  )}

                  {/* VENUE INTEL */}
                  {match.venueDetails && (
                      <div className="mx-4 mb-6">
                           <div className="flex items-center gap-2 mb-2 px-1">
                                <MapPin size={16} className="text-gray-400" />
                                <h3 className="font-condensed font-bold text-sm uppercase text-gray-400 tracking-wide">Venue Intel</h3>
                           </div>
                           <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl overflow-hidden">
                               <div className="h-32 w-full relative">
                                   <img src={match.venueDetails.imageUrl} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                   <div className="absolute bottom-3 left-4">
                                       <span className="block font-black text-white text-lg leading-none">{match.venue}</span>
                                       <span className="text-xs text-gray-300">{match.venueDetails.city}, {match.venueDetails.country}</span>
                                   </div>
                               </div>
                               <div className="p-4 grid grid-cols-2 gap-4 text-xs border-b border-[#2C2C2C]">
                                   <div>
                                       <span className="block text-gray-500 font-bold uppercase">Capacity</span>
                                       <span className="text-white font-mono">{match.venueDetails.capacity}</span>
                                   </div>
                                   <div>
                                       <span className="block text-gray-500 font-bold uppercase">Opened</span>
                                       <span className="text-white font-mono">{match.venueDetails.opened || 'N/A'}</span>
                                   </div>
                               </div>
                               <div className="p-4 text-sm text-gray-400 leading-relaxed">
                                   {match.venueDetails.description}
                               </div>
                           </div>
                      </div>
                  )}

                  {/* TIMELINE FEED */}
                  <div className="mt-6 px-4 pb-4">
                       <h3 className="font-condensed font-bold text-sm uppercase text-gray-400 tracking-wide mb-3 pl-1">Match Feed</h3>
                       <div className="space-y-6 border-l-2 border-[#2C2C2C] ml-3 pl-6 relative">
                           {match.timeline?.map((event) => (
                               <StreamItem key={event.id} event={event} />
                           ))}
                           <div className="absolute bottom-0 -left-[5px] w-2 h-2 rounded-full bg-[#2C2C2C]"></div>
                       </div>
                  </div>
              </div>
          )}

          {/* TAB: TIMELINE (Detailed Play-by-Play) */}
          {activeTab === 'TIMELINE' && (
              <div className="py-4 px-4 animate-in fade-in">
                  {match.timeline ? (
                      <div className="space-y-0">
                          {match.timeline.map((event, index) => (
                             <TimelineItem 
                                key={event.id} 
                                event={event} 
                                isLast={index === (match.timeline?.length || 0) - 1} 
                             />
                          ))}
                      </div>
                  ) : (
                      <div className="py-10 text-center text-gray-500">
                          <History size={40} className="mx-auto mb-3 opacity-20" />
                          <p className="font-condensed font-bold uppercase">No events recorded yet</p>
                      </div>
                  )}
              </div>
          )}

          {/* TAB: BOX SCORE (Stats Table) */}
          {activeTab === 'BOX SCORE' && (
              <div className="animate-in fade-in">
                  {match.boxScore ? (
                       <div className="p-4">
                           {/* HOME */}
                           <div className="mb-6">
                               <div className="flex items-center gap-2 mb-3 px-2">
                                   <img src={match.homeTeam.logo} className="w-5 h-5 object-contain" />
                                   <h3 className="font-condensed font-black text-lg uppercase">{match.homeTeam.name}</h3>
                               </div>
                               <BoxScoreTable players={match.boxScore.home} headers={match.boxScore.headers} />
                           </div>
                           
                           {/* AWAY */}
                           <div>
                               <div className="flex items-center gap-2 mb-3 px-2">
                                   <img src={match.awayTeam.logo} className="w-5 h-5 object-contain" />
                                   <h3 className="font-condensed font-black text-lg uppercase">{match.awayTeam.name}</h3>
                               </div>
                               <BoxScoreTable players={match.boxScore.away} headers={match.boxScore.headers} />
                           </div>
                       </div>
                  ) : (
                       <div className="py-20 text-center text-gray-500">
                           <Table size={40} className="mx-auto mb-3 opacity-20" />
                           <p className="font-condensed font-bold uppercase">Box Score Unavailable</p>
                       </div>
                  )}
              </div>
          )}

          {/* TAB: STATS (Granular) */}
          {activeTab === 'STATS' && (
               <div className="p-4 animate-in fade-in">
                   {match.stats ? (
                       <div className="space-y-6">
                           
                           {/* ACTUAL PLAY TIME (365Scores Style) */}
                           <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-4">
                               <div className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-2">
                                   <span>Actual Play Time</span>
                                   <span>57:23</span>
                               </div>
                               <div className="h-2 w-full bg-[#2C2C2C] rounded-full overflow-hidden flex">
                                   <div className="w-[58%] bg-indigo-500"></div>
                               </div>
                           </div>

                           <StatGroup title="General" stats={[
                               { label: 'Possession', home: match.stats.possession?.home, away: match.stats.possession?.away, unit: '%' },
                               { label: 'Expected Goals (xG)', home: match.stats.expectedGoals?.home, away: match.stats.expectedGoals?.away },
                           ]} />

                           <StatGroup title="Attack" stats={[
                               { label: 'Total Shots', home: match.stats.shots?.home, away: match.stats.shots?.away },
                               { label: 'On Target', home: match.stats.shotsOnTarget?.home, away: match.stats.shotsOnTarget?.away },
                               { label: 'Big Chances', home: match.stats.bigChances?.home, away: match.stats.bigChances?.away },
                               { label: 'Hit Woodwork', home: match.stats.hitWoodwork?.home, away: match.stats.hitWoodwork?.away },
                           ]} />

                            <StatGroup title="Distribution" stats={[
                               { label: 'Passes', home: match.stats.passes?.home, away: match.stats.passes?.away },
                               { label: 'Accuracy', home: match.stats.passAccuracy?.home, away: match.stats.passAccuracy?.away, unit: '%' },
                               { label: 'Long Balls', home: match.stats.longBalls?.home, away: match.stats.longBalls?.away },
                           ]} />

                            <StatGroup title="Defense" stats={[
                               { label: 'Tackles', home: match.stats.tackles?.home, away: match.stats.tackles?.away },
                               { label: 'Interceptions', home: match.stats.interceptions?.home, away: match.stats.interceptions?.away },
                               { label: 'Clearances', home: match.stats.clearances?.home, away: match.stats.clearances?.away },
                           ]} />

                       </div>
                   ) : (
                       <div className="py-20 text-center text-gray-500">Stats coming soon</div>
                   )}
               </div>
          )}

          {/* TAB: LINEUPS (Pitch View) */}
          {activeTab === 'LINEUPS' && (
              <div className="p-4 animate-in fade-in">
                  {match.lineups ? (
                      <div>
                          <div className="flex justify-center mb-6">
                              <div className="bg-[#121212] p-1 rounded-full border border-[#2C2C2C] flex">
                                  <button onClick={() => setPitchSide('HOME')} className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-colors ${pitchSide === 'HOME' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
                                      {match.homeTeam.name}
                                  </button>
                                  <button onClick={() => setPitchSide('AWAY')} className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-colors ${pitchSide === 'AWAY' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
                                      {match.awayTeam.name}
                                  </button>
                              </div>
                          </div>
                          
                          <SoccerPitch 
                             lineup={pitchSide === 'HOME' ? match.lineups.home : match.lineups.away} 
                             teamName={pitchSide === 'HOME' ? match.homeTeam.name : match.awayTeam.name}
                          />

                          <div className="mt-6">
                              <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-3 pl-2">Bench</h3>
                              <div className="grid grid-cols-1 gap-2">
                                  {(pitchSide === 'HOME' ? match.lineups.home.subs : match.lineups.away.subs).map(player => (
                                      <div key={player.id} className="flex items-center justify-between bg-[#121212] p-3 rounded-lg border border-[#2C2C2C]">
                                          <div className="flex items-center gap-3">
                                              <span className="font-mono text-gray-500 w-6">{player.number}</span>
                                              <span className="font-bold text-sm">{player.name}</span>
                                          </div>
                                          <span className="text-[10px] font-bold text-gray-600 uppercase">{player.position}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  ) : (
                       <div className="py-20 text-center text-gray-500">Lineups not available</div>
                  )}
              </div>
          )}

          {/* TAB: ODDS & MARKET */}
          {activeTab === 'ODDS' && (
               <div className="p-4 animate-in fade-in">
                   <MarketPulse trend={match.bettingTrends} />
               </div>
          )}
          
          {/* TAB: TABLE (Standings) */}
          {activeTab === 'TABLE' && (
              <div className="p-4 animate-in fade-in">
                  {match.standings ? (
                      <StandingsWidget standings={match.standings} homeId={match.homeTeam.id} awayId={match.awayTeam.id} />
                  ) : (
                      <div className="py-20 text-center text-gray-500">Standings not available</div>
                  )}
              </div>
          )}

      </div>

      {/* 3. STICKY FOOTER ACTION */}
      <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 md:ml-[280px] bg-[#121212] border-t border-[#2C2C2C] p-4 flex items-center gap-3 z-30">
           <button 
             onClick={() => handleOpenPwezaContext()}
             className="w-12 h-12 rounded-xl bg-[#1E1E1E] flex items-center justify-center border border-[#333] text-2xl"
           >
               🐙
           </button>
           <button 
             onClick={handleAddToSlip}
             className={`
                flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-condensed font-black text-xl uppercase transition-all
                ${isInSlip 
                    ? 'bg-green-900/30 text-green-500 border border-green-500/50'
                    : betSlipStatus === 'CONFIRM' 
                        ? 'bg-yellow-500 text-black' 
                        : betSlipStatus === 'ADDED'
                            ? 'bg-green-500 text-black'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                }
             `}
           >
               {isInSlip ? (
                   <>In Slip <Ticket size={20} /></>
               ) : betSlipStatus === 'CONFIRM' ? (
                   'Confirm Add?'
               ) : betSlipStatus === 'ADDED' ? (
                   <>Added <Check size={20} /></>
               ) : (
                   <>Add to Slip <PlusCircle size={20} /></>
               )}
           </button>
      </div>

    </div>
  );
};

// --- SUB-COMPONENTS ---

const StreamItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
    const isGoal = event.type === 'GOAL';
    const isSocial = event.type === 'SOCIAL';

    return (
        <div className="relative mb-6 last:mb-0 group">
            <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 ${isGoal ? 'bg-[#00FFB2] border-[#00FFB2]' : isSocial ? 'bg-blue-500 border-blue-500' : 'bg-[#121212] border-[#444]'} z-10`}></div>
            
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-gray-500">{event.minute}</span>
                {isGoal && <span className="bg-[#00FFB2] text-black text-[9px] font-black px-1.5 rounded uppercase">Goal</span>}
                {event.type === 'CARD' && <span className="bg-yellow-500 text-black text-[9px] font-black px-1.5 rounded uppercase">Card</span>}
            </div>

            <div className={`bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg p-3 ${isGoal ? 'border-l-4 border-l-[#00FFB2]' : ''}`}>
                
                {isSocial && event.avatar && (
                    <div className="flex items-center gap-2 mb-2">
                        <img src={event.avatar} className="w-6 h-6 rounded-full" />
                        <span className="text-xs font-bold text-gray-300">{event.source}</span>
                        <Twitter size={12} className="text-[#1DA1F2]" />
                    </div>
                )}

                <h4 className="font-bold text-sm text-white mb-1">
                    {event.player && <span className="text-gray-300 mr-1">{event.player}</span>}
                    {event.description}
                </h4>

                {event.mediaUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden relative">
                        <img src={event.mediaUrl} className="w-full object-cover" />
                        {isGoal && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                 <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                                     <Play size={20} className="fill-white text-white ml-1" />
                                 </div>
                             </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const TimelineItem: React.FC<{ event: TimelineEvent, isLast: boolean }> = ({ event, isLast }) => {
    // Defines icon based on type
    let Icon = Activity;
    let colorClass = 'text-gray-400 bg-gray-800';
    
    if (event.type === 'GOAL') { Icon = Goal; colorClass = 'text-black bg-[#00FFB2]'; }
    if (event.type === 'CARD') { Icon =  Ticket; colorClass = 'text-black bg-yellow-500'; } // Using Ticket as mock for Card
    if (event.type === 'SUB') { Icon = ArrowRightLeft; colorClass = 'text-white bg-blue-600'; }
    if (event.type === 'PERIOD') { Icon = Timer; colorClass = 'text-white bg-gray-600'; }

    return (
        <div className="flex gap-4 relative">
             {/* Connector Line */}
             {!isLast && <div className="absolute left-[19px] top-8 bottom-[-16px] w-[2px] bg-[#2C2C2C]"></div>}
             
             {/* Icon */}
             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-black z-10 ${colorClass}`}>
                 <Icon size={16} strokeWidth={3} />
             </div>

             {/* Content */}
             <div className="pb-6 flex-1">
                 <div className="flex items-center gap-3 mb-1">
                     <span className="font-mono font-bold text-white text-sm">{event.minute}</span>
                     {event.type === 'GOAL' && <span className="text-[#00FFB2] font-black text-xs uppercase">GOAL</span>}
                 </div>
                 
                 <div className="bg-[#121212] p-3 rounded-lg border border-[#2C2C2C]">
                     <p className="text-sm text-gray-200 font-medium">
                         {event.player && <span className="font-bold text-white">{event.player} </span>}
                         <span className="text-gray-400">{event.description.replace(event.player || '', '')}</span>
                     </p>
                     {event.subPlayer && (
                         <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
                             <ArrowRightLeft size={12} /> <span>IN: {event.subPlayer}</span>
                         </div>
                     )}
                     {event.mediaUrl && (
                         <div className="mt-2 w-20 h-12 rounded overflow-hidden relative border border-[#333]">
                             <img src={event.mediaUrl} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                 <Play size={12} className="fill-white text-white" />
                             </div>
                         </div>
                     )}
                 </div>
             </div>
        </div>
    )
}

const StatGroup = ({ title, stats }: { title: string, stats: any[] }) => (
    <div>
        <h4 className="font-condensed font-bold text-sm text-gray-500 uppercase mb-3 pl-1">{title}</h4>
        <div className="space-y-3">
            {stats.map((stat, i) => (
                <div key={i} className="flex items-center text-xs font-bold">
                     <div className="w-8 text-right text-white">{stat.home ?? 0}{stat.unit}</div>
                     <div className="flex-1 mx-3 flex gap-1 h-2 bg-[#2C2C2C] rounded-full overflow-hidden">
                         <div className="bg-white h-full" style={{ width: `${(stat.home / ((stat.home + stat.away) || 1)) * 100}%` }}></div>
                         <div className="bg-indigo-600 h-full" style={{ width: `${(stat.away / ((stat.home + stat.away) || 1)) * 100}%` }}></div>
                     </div>
                     <div className="w-8 text-left text-indigo-400">{stat.away ?? 0}{stat.unit}</div>
                </div>
            ))}
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase mt-1 px-1">
             <span>{stats[0]?.label}</span>
        </div>
    </div>
);

const MarketPulse = ({ trend }: { trend?: any }) => {
    if (!trend) return <div className="text-center text-gray-500 py-10">Market data unavailable</div>;
    return (
        <div className="space-y-4">
            <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Zap size={18} className="text-yellow-400" />
                    <h3 className="font-condensed font-black text-lg uppercase">Where is the money?</h3>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-xs font-bold uppercase mb-2">
                            <span className="text-green-400">Cash Volume (Sharp)</span>
                            <span className="text-white">{trend.homeMoneyPercent}% Home</span>
                        </div>
                        <div className="h-4 bg-[#2C2C2C] rounded-full overflow-hidden flex relative">
                            <div className="h-full bg-green-500" style={{ width: `${trend.homeMoneyPercent}%` }}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-black mix-blend-screen">
                                VS
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs font-bold uppercase mb-2">
                            <span className="text-blue-400">Ticket Count (Public)</span>
                            <span className="text-white">{trend.homeTicketPercent}% Home</span>
                        </div>
                         <div className="h-4 bg-[#2C2C2C] rounded-full overflow-hidden flex relative">
                            <div className="h-full bg-blue-500" style={{ width: `${trend.homeTicketPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-black/40 rounded border border-white/5 text-xs text-gray-300">
                    <span className="font-bold text-white uppercase">Consensus:</span> {trend.publicConsensus}
                </div>
            </div>
        </div>
    )
}

const StandingsWidget = ({ standings, homeId, awayId }: { standings: Standing[], homeId: string, awayId: string }) => (
    <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
            <thead className="bg-[#1E1E1E] text-gray-400 font-condensed font-bold uppercase">
                <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Team</th>
                    <th className="p-3 w-10 text-center">PL</th>
                    <th className="p-3 w-10 text-center">PTS</th>
                    <th className="p-3 w-20 text-center">Form</th>
                </tr>
            </thead>
            <tbody>
                {standings.map((team) => {
                    const isFocus = team.teamId === homeId || team.teamId === awayId;
                    return (
                        <tr key={team.teamId} className={`border-b border-[#2C2C2C] ${isFocus ? 'bg-indigo-900/20' : ''}`}>
                            <td className="p-3 text-center font-bold text-gray-500">{team.rank}</td>
                            <td className="p-3 font-bold text-white flex items-center gap-2">
                                <img src={team.logo} className="w-5 h-5 object-contain" />
                                {team.teamName}
                            </td>
                            <td className="p-3 text-center text-gray-400">{team.played}</td>
                            <td className="p-3 text-center text-white font-black">{team.points}</td>
                            <td className="p-3 text-center">
                                <div className="flex justify-center gap-0.5">
                                    {team.form.map((res, i) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${res === 'W' ? 'bg-green-500' : res === 'L' ? 'bg-red-500' : 'bg-gray-500'}`} />
                                    ))}
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
)

const SoccerPitch: React.FC<{ lineup: TeamLineup, teamName: string }> = ({ lineup, teamName }) => {
    return (
        <div className="w-full aspect-[3/4] bg-[#1a4a25] rounded-xl border-2 border-[#2a6636] relative overflow-hidden shadow-inner">
             {/* Pitch Markings */}
             <div className="absolute inset-0 flex flex-col justify-between">
                 <div className="h-[10%] border-b border-white/20 mx-[20%] border-x"></div>
                 <div className="h-[1px] bg-white/20 w-full relative flex justify-center items-center">
                     <div className="w-20 h-20 rounded-full border border-white/20"></div>
                 </div>
                 <div className="h-[10%] border-t border-white/20 mx-[20%] border-x"></div>
             </div>

             {/* Formation Layout */}
             <div className="absolute inset-0 p-4 flex flex-col justify-around py-8">
                 {/* GK */}
                 <div className="flex justify-center">
                     <PlayerPill player={lineup.starting[0]} />
                 </div>
                 
                 {/* DEF */}
                 <div className="flex justify-around px-4">
                     {lineup.starting.filter(p => p.position === 'DF').map(p => <PlayerPill key={p.id} player={p} />)}
                 </div>

                 {/* MF */}
                 <div className="flex justify-around px-8">
                      {lineup.starting.filter(p => p.position === 'MF').map(p => <PlayerPill key={p.id} player={p} />)}
                 </div>

                 {/* FW */}
                 <div className="flex justify-around px-10">
                      {lineup.starting.filter(p => p.position === 'FW').map(p => <PlayerPill key={p.id} player={p} />)}
                 </div>
             </div>
             
             <div className="absolute bottom-2 right-2 text-[10px] font-black uppercase text-white/50">
                 {lineup.formation}
             </div>
        </div>
    )
}

const PlayerPill: React.FC<{ player: LineupPlayer }> = ({ player }) => (
    <div className="flex flex-col items-center gap-1 relative group cursor-pointer z-20">
        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center relative shadow-lg transition-transform group-hover:scale-110">
             <span className="font-bold text-xs text-black">{player.number}</span>
             
             {/* Rating Badge */}
             {player.rating && (
                 <div className={`absolute -top-1 -right-2 text-[8px] font-black px-1 rounded ${player.rating >= 7.5 ? 'bg-green-500 text-black' : 'bg-gray-700 text-white'}`}>
                     {player.rating}
                 </div>
             )}
             
             {/* Captain Badge */}
             {player.isCaptain && (
                 <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center text-[7px] font-black text-black">C</div>
             )}

             {/* EVENT INDICATORS (Goals, Cards) */}
             <div className="absolute -top-1 -left-2 flex flex-col gap-0.5">
                 {/* Goals */}
                 {player.events?.filter(e => e.type === 'GOAL').map((e, i) => (
                    <div key={`g-${i}`} className="w-3 h-3 bg-white rounded-full flex items-center justify-center border border-gray-400 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                    </div>
                 ))}
                 {/* Cards */}
                 {player.events?.filter(e => e.type === 'CARD').map((e, i) => (
                    <div key={`c-${i}`} className="w-2.5 h-3 bg-yellow-500 border border-white rounded-[1px] shadow-sm"></div>
                 ))}
                 {/* Sub Out */}
                 {player.events?.filter(e => e.type === 'SUB_OUT').map((e, i) => (
                    <div key={`s-${i}`} className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-[6px] text-white font-bold border border-white">
                        ↓
                    </div>
                 ))}
             </div>
        </div>
        <span className="text-[9px] font-bold text-white bg-black/50 px-1.5 rounded backdrop-blur-sm truncate max-w-[60px]">
            {player.name}
        </span>
    </div>
)

const BoxScoreTable = ({ players, headers }: { players: any[], headers: string[] }) => (
    <div className="bg-[#121212] border border-[#2C2C2C] rounded-lg overflow-hidden">
        <table className="w-full text-right text-xs">
            <thead className="bg-[#1E1E1E] text-gray-500 font-condensed font-bold uppercase">
                <tr>
                    <th className="p-2 text-left w-[40%] text-white">Player</th>
                    {headers.map(h => <th key={h} className="p-2 w-[15%]">{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {players.map((p, i) => (
                    <tr key={i} className="border-b border-[#2C2C2C] last:border-0 hover:bg-[#1A1A1A]">
                        <td className="p-2 text-left font-bold text-white">
                            {p.name}
                        </td>
                        {headers.map(h => (
                            <td key={h} className={`p-2 font-mono ${h === 'PTS' || h === 'G' ? 'text-white font-black' : 'text-gray-400'}`}>
                                {p.stats[h] !== undefined ? p.stats[h] : (h === 'MIN' ? p.minutes : '-')}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)
