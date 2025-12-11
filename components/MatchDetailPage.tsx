
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Share2, Check, PlusCircle, MapPin, Users, Calendar, Play, Heart, MessageCircle, Repeat, Trophy, Flame, BarChart2, ChevronRight, Shield, TrendingUp, Activity, Ticket, Table, AlertTriangle, Zap, Brain, Timer, History, Goal, User, Twitter, Monitor, Shirt, ArrowRightLeft, Camera, Send, Crown, ThumbsUp, Lock, WifiOff, ArrowRight, PlayCircle, RefreshCw } from 'lucide-react';
import { Match, MatchStatus, Player, TimelineEvent, Standing, PredictionFactor, TeamLineup, LineupPlayer, BoxScore, Comment, MatchStats } from '../types';
import { useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';
import { ScoreShotModal } from './ScoreShotModal';
import { useLivePolling } from './hooks/useLivePolling';

interface MatchDetailPageProps {
  match: Match;
  onOpenPweza: (prompt?: string) => void;
  onAddToSlip?: () => void;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({ match, onOpenPweza, onAddToSlip }) => {
   const navigate = useNavigate();
   const { betSlip, addComment, user, logout } = useSports();
   const [activeTab, setActiveTab] = useState('STREAM');
   const [betSlipStatus, setBetSlipStatus] = useState<'IDLE' | 'CONFIRM' | 'ADDED'>('IDLE');
   const [isShared, setIsShared] = useState(false);
   const [userVote, setUserVote] = useState<'HOME' | 'AWAY' | null>(null);
   const [pitchSide, setPitchSide] = useState<'HOME' | 'AWAY'>('HOME');
   const [showScoreShot, setShowScoreShot] = useState(false);
   const [commentInput, setCommentInput] = useState('');
   const [matchDetails, setMatchDetails] = useState<any>(null);
   const [loadingDetails, setLoadingDetails] = useState(true);
   const [standings, setStandings] = useState<any[]>([]);
   const [loadingStandings, setLoadingStandings] = useState(false);
   const [liveScore, setLiveScore] = useState<{ home: number | null; away: number | null }>({ 
     home: match.score?.home ?? null, 
     away: match.score?.away ?? null 
   });

   const dataSaver = user?.preferences.dataSaver || false;
   const isLive = match.status === MatchStatus.LIVE;

   // Live polling for live matches
   const handleLiveUpdate = useCallback((data: any) => {
     if (data.homeScore !== null && data.awayScore !== null) {
       setLiveScore({ home: data.homeScore, away: data.awayScore });
     }
     // Merge live data into matchDetails
     if (data.timeline && data.timeline.length > 0) {
       setMatchDetails((prev: any) => ({
         ...prev,
         timeline: data.timeline,
         stats: data.stats || prev?.stats,
         lineups: data.lineups || prev?.lineups,
       }));
     }
   }, []);

   const { data: liveData, isLoading: isPolling, lastUpdate, refresh: refreshLive } = useLivePolling({
     matchId: match.id,
     enabled: isLive,
     intervalMs: 30000, // Poll every 30 seconds for live matches
     onUpdate: handleLiveUpdate
   });

   // Fetch additional match details - first from DB, then enrich with API-Football
   useEffect(() => {
        const fetchMatchDetails = async () => {
            try {
                // First get basic details from DB
                const response = await fetch(
                    `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/fetch-match-details?matchId=${match.id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
               if (response.ok) {
                   const details = await response.json();
                   setMatchDetails(details);
                   
                   // If match has a fixture_id, enrich with API-Football data
                   const fixtureId = details?.fixture_id || match.metadata?.fixture_id;
                   if (fixtureId) {
                     try {
                       const enrichResponse = await fetch(
                         `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/enrich-match-details?fixtureId=${fixtureId}`,
                         {
                           method: 'GET',
                           headers: {
                             'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA`,
                             'Content-Type': 'application/json',
                           },
                         }
                       );
                       if (enrichResponse.ok) {
                         const enrichedData = await enrichResponse.json();
                         setMatchDetails(prev => ({ ...prev, ...enrichedData }));
                       }
                     } catch (e) {
                       console.log('Enrichment not available:', e);
                     }
                   }
               }
           } catch (error) {
               console.error('Error fetching match details:', error);
           } finally {
               setLoadingDetails(false);
           }
       };

       fetchMatchDetails();
   }, [match.id, match.metadata?.fixture_id]);

   // Fetch standings when TABLE tab is activated
   useEffect(() => {
       if (activeTab === 'TABLE' && standings.length === 0 && !loadingStandings) {
           const fetchStandings = async () => {
               setLoadingStandings(true);
               try {
                   // Map league name to code
                   const leagueMap: Record<string, string> = {
                       'Premier League': 'PL',
                       'Bundesliga': 'BL1',
                       'Serie A': 'SA',
                       'La Liga': 'PD',
                       'Ligue 1': 'FL1',
                       'Champions League': 'CL',
                   };
                   const leagueCode = leagueMap[match.league] || 'PL';
                   
                   const response = await fetch(
                       `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/get-standings?league=${leagueCode}`,
                       {
                           headers: {
                               'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA`,
                               'Content-Type': 'application/json',
                           },
                       }
                   );
                   if (response.ok) {
                       const data = await response.json();
                       setStandings(Array.isArray(data) ? data : []);
                   }
               } catch (error) {
                   console.error('Error fetching standings:', error);
               } finally {
                   setLoadingStandings(false);
               }
           };
           fetchStandings();
       }
   }, [activeTab, match.league, standings.length, loadingStandings]);

  // Check if match is already in slip
  const existingBet = betSlip.find(b => b.matchId === match.id);
  const isInSlip = !!existingBet;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [match.id]);

  const handleAddToSlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
        if(confirm("Create an account to build your slip!")) {
            logout();
        }
        return;
    }

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
      setShowScoreShot(true);
  };

  const handlePostComment = () => {
      if (!user) {
          if(confirm("Sign in to join the conversation.")) logout();
          return;
      }
      if (!commentInput.trim()) return;
      addComment(match.id, commentInput, userVote || undefined);
      setCommentInput('');
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
             <div className="flex items-center gap-2">
                 <span className="font-condensed font-bold text-sm tracking-widest uppercase text-gray-500">{match.league}</span>
                 {dataSaver && <div title="Data Saver Mode On"><WifiOff size={12} className="text-yellow-500" /></div>}
             </div>
             <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center -mr-2 text-gray-400 hover:text-white transition-colors">
                <Share2 size={24} />
             </button>
          </div>

          {/* LIVE MOMENTUM BAR (For Live Games) */}
          {match.status === MatchStatus.LIVE && match.momentum && (
              <div className="px-6 mb-2">
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black uppercase text-red-500 animate-pulse">Live Momentum</span>
                      <div className="flex items-center gap-2">
                          {lastUpdate && (
                            <span className="text-[9px] text-gray-500">
                              Updated {new Date(lastUpdate).toLocaleTimeString()}
                            </span>
                          )}
                          <button 
                            onClick={refreshLive} 
                            disabled={isPolling}
                            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Refresh live data"
                          >
                            <RefreshCw size={12} className={isPolling ? 'animate-spin' : ''} />
                          </button>
                      </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full flex overflow-hidden">
                      <div className="bg-white transition-all duration-1000" style={{ width: `${match.momentum.home}%` }}></div>
                      <div className="bg-indigo-600 transition-all duration-1000" style={{ width: `${match.momentum.away}%` }}></div>
                  </div>
              </div>
          )}

          {/* Live Update Indicator for non-momentum live matches */}
          {isLive && !match.momentum && (
              <div className="px-6 mb-2 flex justify-end">
                  <div className="flex items-center gap-2">
                      {lastUpdate && (
                        <span className="text-[9px] text-gray-500">
                          Updated {new Date(lastUpdate).toLocaleTimeString()}
                        </span>
                      )}
                      <button 
                        onClick={refreshLive} 
                        disabled={isPolling}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Refresh live data"
                      >
                        <RefreshCw size={12} className={isPolling ? 'animate-spin' : ''} />
                      </button>
                  </div>
              </div>
          )}

          {/* Scoreboard */}
          <div className="pb-6 pt-2 px-6">
              <div className="flex items-center justify-between">
                  {/* Home */}
                  <div className="flex flex-col items-center w-1/3">
                      {!dataSaver && (
                          <div className="w-16 h-16 bg-white/5 rounded-full p-3 mb-3 border border-white/10 shadow-lg">
                              <img src={match.homeTeam.logo} className="w-full h-full object-contain" />
                          </div>
                      )}
                      <h2 className="font-condensed font-black text-xl uppercase leading-none text-center mb-1">{match.homeTeam.name}</h2>
                      {match.homeTeam.form && (
                          <div className="flex gap-0.5">
                              {match.homeTeam.form.map((res, i) => (
                                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${res === 'W' ? 'bg-green-500' : res === 'L' ? 'bg-red-500' : 'bg-gray-500'}`} />
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Score/Time - Use live score if available */}
                  <div className="flex flex-col items-center w-1/3">
                       <span className="font-condensed font-black text-5xl tracking-tighter tabular-nums leading-none mb-1">
                           {match.status === MatchStatus.SCHEDULED ? 'VS' : `${liveScore.home ?? match.score?.home ?? 0}-${liveScore.away ?? match.score?.away ?? 0}`}
                       </span>
                       <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${match.status === MatchStatus.LIVE ? 'bg-red-600 text-white animate-pulse' : 'bg-[#2C2C2C] text-gray-400'}`}>
                           {match.time}
                       </div>
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center w-1/3">
                      {!dataSaver && (
                          <div className="w-16 h-16 bg-white/5 rounded-full p-3 mb-3 border border-white/10 shadow-lg">
                              <img src={match.awayTeam.logo} className="w-full h-full object-contain" />
                          </div>
                      )}
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
              {['STREAM', 'TIMELINE', 'BOX SCORE', 'STATS', 'LINEUPS', 'ODDS', 'TABLE', 'COMMUNITY'].map(tab => (
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
                      <div className="m-4 rounded-xl overflow-hidden border border-[#2C2C2C] bg-[#121212] relative">
                          
                          {/* GUEST LOCK OVERLAY */}
                          {!user && (
                              <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                                  <div className="w-12 h-12 bg-[#2C2C2C] rounded-full flex items-center justify-center mb-3">
                                      <Lock size={24} className="text-white" />
                                  </div>
                                  <h3 className="font-condensed font-black text-xl uppercase text-white mb-1">Unlock Sheena's Edge</h3>
                                  <p className="text-sm text-gray-400 mb-4">Sign up to see the AI analysis, value rating, and odds.</p>
                                  <button onClick={logout} className="px-6 py-2 bg-indigo-600 text-white font-bold uppercase text-xs rounded-lg">Sign In / Join</button>
                              </div>
                          )}

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

                  {/* VENUE INTEL (Lite Mode Compatible) */}
                  {matchDetails?.venueDetails && (
                      <div className="mx-4 mb-6">
                           <div className="flex items-center gap-2 mb-2 px-1">
                                <MapPin size={16} className="text-gray-400" />
                                <h3 className="font-condensed font-bold text-sm uppercase text-gray-400 tracking-wide">Venue Intel</h3>
                           </div>
                           <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl overflow-hidden">
                               {!dataSaver && (
                                   <div className="h-32 w-full relative">
                                       <img src={matchDetails.venueDetails.imageUrl} className="w-full h-full object-cover" />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                       <div className="absolute bottom-3 left-4">
                                           <span className="block font-black text-white text-lg leading-none">{match.venue}</span>
                                           <span className="text-xs text-gray-300">{matchDetails.venueDetails.city}, {matchDetails.venueDetails.country}</span>
                                       </div>
                                   </div>
                               )}
                               {dataSaver && (
                                   <div className="p-4 bg-[#1a1a1a] border-b border-[#2C2C2C]">
                                       <span className="block font-black text-white text-lg leading-none">{match.venue}</span>
                                       <span className="text-xs text-gray-300">{matchDetails.venueDetails.city}, {matchDetails.venueDetails.country}</span>
                                   </div>
                               )}
                               <div className="p-4 grid grid-cols-2 gap-4 text-xs border-b border-[#2C2C2C]">
                                   <div>
                                       <span className="block text-gray-500 font-bold uppercase">Capacity</span>
                                       <span className="text-white font-mono">{matchDetails.venueDetails.capacity}</span>
                                   </div>
                                   <div>
                                       <span className="block text-gray-500 font-bold uppercase">Opened</span>
                                       <span className="text-white font-mono">{matchDetails.venueDetails.opened || 'N/A'}</span>
                                   </div>
                               </div>
                               <div className="p-4 text-sm text-gray-400 leading-relaxed">
                                   {matchDetails.venueDetails.description}
                               </div>
                           </div>
                      </div>
                  )}

                  {/* BLEACHER REPORT STYLE CONTENT */}
                  <div className="mt-6 px-4 pb-4">
                       <h3 className="font-condensed font-bold text-sm uppercase text-gray-400 tracking-wide mb-3 pl-1 flex items-center gap-2">
                           <Flame size={14} className="text-orange-500" />
                           Match Preview
                       </h3>
                       
                       {/* Editorial Match Preview Card */}
                       <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl border border-[#2C2C2C] overflow-hidden mb-4">
                           <div className="p-5">
                               <h2 className="font-condensed font-black text-2xl uppercase italic text-white leading-tight mb-3">
                                   {match.homeTeam.name} Host {match.awayTeam.name} in {match.league} Showdown
                               </h2>
                               <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                   {match.prediction?.aiReasoning || `An exciting ${match.league} clash awaits as ${match.homeTeam.name} welcome ${match.awayTeam.name}. Both sides will be looking to make a statement in what promises to be an entertaining encounter.`}
                               </p>
                               
                               {/* Key Stat Callout */}
                               <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-4 mb-4">
                                   <div className="flex items-start gap-3">
                                       <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center shrink-0">
                                           <BarChart2 size={16} className="text-indigo-400" />
                                       </div>
                                       <div>
                                           <span className="text-indigo-400 font-bold text-xs uppercase tracking-wide">Key Insight</span>
                                           <p className="text-white font-condensed font-bold text-lg mt-1">
                                               {match.prediction?.keyInsight || `${match.homeTeam.name} have a strong home record this season`}
                                           </p>
                                       </div>
                                   </div>
                               </div>
                               
                               {/* Betting Angle */}
                               {match.prediction?.bettingAngle && (
                                   <div className="bg-[#00FFB2]/5 border border-[#00FFB2]/20 rounded-lg p-4">
                                       <div className="flex items-center gap-2 mb-2">
                                           <TrendingUp size={14} className="text-[#00FFB2]" />
                                           <span className="text-[#00FFB2] font-bold text-xs uppercase">Sharp Play</span>
                                       </div>
                                       <p className="text-white font-medium">{match.prediction.bettingAngle}</p>
                                   </div>
                               )}
                           </div>
                       </div>

                       {/* Form Guide Section */}
                       <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-4 mb-4">
                           <h4 className="font-condensed font-bold text-sm uppercase text-gray-400 mb-4">Recent Form</h4>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <span className="text-xs text-gray-500 font-bold uppercase mb-2 block">{match.homeTeam.name}</span>
                                   <div className="flex gap-1">
                                       {(match.homeTeam.form || ['W', 'D', 'W', 'L', 'W']).map((res, i) => (
                                           <div key={i} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-black ${
                                               res === 'W' ? 'bg-green-600/20 text-green-400' : 
                                               res === 'L' ? 'bg-red-600/20 text-red-400' : 
                                               'bg-gray-600/20 text-gray-400'
                                           }`}>
                                               {res}
                                           </div>
                                       ))}
                                   </div>
                               </div>
                               <div>
                                   <span className="text-xs text-gray-500 font-bold uppercase mb-2 block">{match.awayTeam.name}</span>
                                   <div className="flex gap-1">
                                       {(match.awayTeam.form || ['L', 'W', 'W', 'D', 'W']).map((res, i) => (
                                           <div key={i} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-black ${
                                               res === 'W' ? 'bg-green-600/20 text-green-400' : 
                                               res === 'L' ? 'bg-red-600/20 text-red-400' : 
                                               'bg-gray-600/20 text-gray-400'
                                           }`}>
                                               {res}
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Head to Head */}
                       {matchDetails?.headToHead && matchDetails.headToHead.length > 0 && (
                           <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-4 mb-4">
                               <h4 className="font-condensed font-bold text-sm uppercase text-gray-400 mb-4">Head to Head</h4>
                               <div className="space-y-2">
                                   {matchDetails.headToHead.slice(0, 5).map((h2h: any, idx: number) => (
                                       <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-[#2C2C2C] last:border-0">
                                           <span className="text-gray-500 text-xs">{new Date(h2h.date).toLocaleDateString()}</span>
                                           <div className="flex items-center gap-3">
                                               <span className="text-white font-medium text-right w-24 truncate">{h2h.homeTeam}</span>
                                               <span className="font-mono font-bold text-white bg-[#2C2C2C] px-2 py-1 rounded">
                                                   {h2h.homeScore} - {h2h.awayScore}
                                               </span>
                                               <span className="text-white font-medium w-24 truncate">{h2h.awayTeam}</span>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}

                       {/* Quick Action */}
                       <button 
                           onClick={handleOpenPwezaContext}
                           className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold uppercase text-sm py-4 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                       >
                           <span className="text-lg">🐙</span>
                           Ask Pweza for Live Analysis
                       </button>
                  </div>
              </div>
          )}

          {/* TAB: TIMELINE (Detailed Play-by-Play) */}
          {activeTab === 'TIMELINE' && (
              <div className="py-4 px-4 animate-in fade-in">
                  {matchDetails?.timeline ? (
                      <div className="space-y-0">
                          {matchDetails.timeline.map((event: any, index: number) => (
                             <TimelineItem
                                key={event.id}
                                event={event}
                                isLast={index === matchDetails.timeline.length - 1}
                                dataSaver={dataSaver}
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
                  {matchDetails?.boxScore ? (
                       <div className="p-4">
                           {/* HOME */}
                           <div className="mb-6">
                               <div className="flex items-center gap-2 mb-3 px-2">
                                   {!dataSaver && <img src={match.homeTeam.logo} className="w-5 h-5 object-contain" />}
                                   <h3 className="font-condensed font-black text-lg uppercase">{match.homeTeam.name}</h3>
                               </div>
                               <BoxScoreTable players={matchDetails.boxScore.home} headers={matchDetails.boxScore.headers} />
                           </div>

                           {/* AWAY */}
                           <div>
                               <div className="flex items-center gap-2 mb-3 px-2">
                                   {!dataSaver && <img src={match.awayTeam.logo} className="w-5 h-5 object-contain" />}
                                   <h3 className="font-condensed font-black text-lg uppercase">{match.awayTeam.name}</h3>
                               </div>
                               <BoxScoreTable players={matchDetails.boxScore.away} headers={matchDetails.boxScore.headers} />
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
                   {matchDetails?.stats ? (
                       <div className="space-y-6">

                           {/* ACTUAL PLAY TIME (365Scores Style) */}
                           <div className="bg-[#121212] border border-[#2C2C2C] rounded-lg p-4">
                               <div className="flex justify-between items-center mb-2">
                                   <span className="text-[10px] font-bold text-gray-500 uppercase">Actual Play Time</span>
                                   <span className="text-[10px] font-bold text-indigo-400 uppercase">57m 23s</span>
                               </div>
                               <div className="h-2 w-full bg-gray-800 rounded-full flex overflow-hidden">
                                   <div className="w-[60%] bg-indigo-600"></div>
                                   <div className="w-[40%] bg-gray-700"></div>
                               </div>
                               <div className="flex justify-between mt-1 text-[9px] text-gray-500">
                                   <span>In Play</span>
                                   <span>Out of Play</span>
                               </div>
                           </div>

                           <StatGroup title="Attack" stats={[
                               { label: 'Shots', home: matchDetails.stats.shots?.home || 0, away: matchDetails.stats.shots?.away || 0 },
                               { label: 'On Target', home: matchDetails.stats.shotsOnTarget?.home || 0, away: matchDetails.stats.shotsOnTarget?.away || 0 },
                               { label: 'Big Chances', home: matchDetails.stats.bigChances?.home || 0, away: matchDetails.stats.bigChances?.away || 0 },
                               { label: 'Inside Box', home: matchDetails.stats.shotsInsideBox?.home || 0, away: matchDetails.stats.shotsInsideBox?.away || 0 },
                           ]} />

                           <StatGroup title="Possession & Passing" stats={[
                               { label: 'Possession %', home: matchDetails.stats.possession?.home || 50, away: matchDetails.stats.possession?.away || 50, isPercent: true },
                               { label: 'Passes', home: matchDetails.stats.passes?.home || 0, away: matchDetails.stats.passes?.away || 0 },
                               { label: 'Accurate Passes', home: matchDetails.stats.passesCompleted?.home || 0, away: matchDetails.stats.passesCompleted?.away || 0 },
                           ]} />

                           <StatGroup title="Defense" stats={[
                               { label: 'Tackles', home: matchDetails.stats.tackles?.home || 0, away: matchDetails.stats.tackles?.away || 0 },
                               { label: 'Clearances', home: matchDetails.stats.clearances?.home || 0, away: matchDetails.stats.clearances?.away || 0 },
                               { label: 'Saves', home: matchDetails.stats.saves?.home || 0, away: matchDetails.stats.saves?.away || 0 },
                           ]} />

                       </div>
                   ) : (
                       <div className="py-20 text-center text-gray-500">
                           <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
                           <p className="font-condensed font-bold uppercase">Stats Unavailable</p>
                       </div>
                   )}
               </div>
          )}

          {/* TAB: LINEUPS (Pitch View or Lite List) */}
          {activeTab === 'LINEUPS' && (
              <div className="p-4 animate-in fade-in">
                  {matchDetails?.lineups ? (
                      <>
                          <div className="flex justify-center mb-4 bg-[#121212] rounded-full p-1 border border-[#2C2C2C] inline-flex mx-auto w-full">
                              <button onClick={() => setPitchSide('HOME')} className={`flex-1 py-2 rounded-full text-xs font-bold uppercase transition-colors ${pitchSide === 'HOME' ? 'bg-white text-black' : 'text-gray-500'}`}>{match.homeTeam.name}</button>
                              <button onClick={() => setPitchSide('AWAY')} className={`flex-1 py-2 rounded-full text-xs font-bold uppercase transition-colors ${pitchSide === 'AWAY' ? 'bg-white text-black' : 'text-gray-500'}`}>{match.awayTeam.name}</button>
                          </div>

                          {/* LITE MODE CHECK */}
                          {dataSaver ? (
                              <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Starting XI</h4>
                                  {matchDetails.lineups[pitchSide === 'HOME' ? 'home' : 'away'].starting.map((player: any) => (
                                      <div key={player.id} className="flex items-center justify-between p-3 bg-[#1E1E1E] rounded border border-[#333]">
                                          <div className="flex items-center gap-3">
                                              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400 border border-[#333]">
                                                  {player.number}
                                              </div>
                                              <span className="font-bold text-sm text-white">{player.name}</span>
                                          </div>
                                          <span className="text-xs text-gray-500 font-bold">{player.position}</span>
                                      </div>
                                  ))}
                              </div>
                          ) : matchDetails.lineups[pitchSide === 'HOME' ? 'home' : 'away']?.starting ? (
                              <SoccerPitch
                                lineup={matchDetails.lineups[pitchSide === 'HOME' ? 'home' : 'away']}
                                teamName={pitchSide === 'HOME' ? match.homeTeam.name : match.awayTeam.name}
                              />
                          ) : (
                              <div className="py-20 text-center text-gray-500">
                                  <Shirt size={40} className="mx-auto mb-3 opacity-20" />
                                  <p className="font-condensed font-bold uppercase">Lineup Data Unavailable</p>
                              </div>
                          )}
                      </>
                  ) : (
                      <div className="py-20 text-center text-gray-500">
                          <Shirt size={40} className="mx-auto mb-3 opacity-20" />
                          <p className="font-condensed font-bold uppercase">Lineups Unavailable</p>
                      </div>
                  )}
              </div>
          )}

          {/* TAB: ODDS */}
          {activeTab === 'ODDS' && (
              <div className="p-4 animate-in fade-in">
                  <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2C2C2C] mb-4">
                      <div className="flex items-center justify-between mb-4">
                          <h3 className="font-condensed font-bold uppercase text-white">Market Pulse</h3>
                          <span className="text-[10px] font-bold bg-green-900/20 text-green-500 px-2 py-0.5 rounded">Live Updates</span>
                      </div>
                      
                      <div className="space-y-3">
                          {/* Home */}
                          <div className="flex justify-between items-center p-3 bg-black rounded border border-[#333]">
                              <span className="font-bold text-sm">{match.homeTeam.name}</span>
                              <div className="flex gap-2">
                                  <div className="px-3 py-1 bg-[#2C2C2C] rounded text-xs font-mono text-gray-400 line-through">2.05</div>
                                  <div className="px-3 py-1 bg-[#00FFB2] text-black rounded text-xs font-mono font-bold flex items-center gap-1">
                                      {match.prediction?.odds?.home || 2.10} <ArrowRightLeft size={10}/>
                                  </div>
                              </div>
                          </div>
                          {/* Draw */}
                          <div className="flex justify-between items-center p-3 bg-black rounded border border-[#333]">
                              <span className="font-bold text-sm">Draw</span>
                              <div className="px-3 py-1 bg-[#2C2C2C] text-white rounded text-xs font-mono font-bold">
                                  {match.prediction?.odds?.draw || 3.20}
                              </div>
                          </div>
                          {/* Away */}
                          <div className="flex justify-between items-center p-3 bg-black rounded border border-[#333]">
                              <span className="font-bold text-sm">{match.awayTeam.name}</span>
                              <div className="px-3 py-1 bg-[#2C2C2C] text-white rounded text-xs font-mono font-bold">
                                  {match.prediction?.odds?.away || 3.50}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: TABLE (Standings) */}
          {activeTab === 'TABLE' && (
              <div className="p-4 animate-in fade-in">
                  {loadingStandings ? (
                      <div className="py-20 text-center">
                          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                          <p className="text-gray-500 text-sm">Loading standings...</p>
                      </div>
                  ) : standings.length > 0 ? (
                      <div className="bg-[#121212] rounded-lg border border-[#2C2C2C] overflow-hidden">
                          {/* Table Header */}
                          <div className="grid grid-cols-[40px_1fr_32px_32px_32px_40px] gap-2 px-3 py-2 bg-[#0A0A0A] border-b border-[#2C2C2C] text-[10px] font-bold text-gray-500 uppercase">
                              <span>#</span>
                              <span>Team</span>
                              <span className="text-center">W</span>
                              <span className="text-center">D</span>
                              <span className="text-center">L</span>
                              <span className="text-center">Pts</span>
                          </div>
                          {/* Table Rows */}
                          <div className="divide-y divide-[#2C2C2C]">
                              {standings.slice(0, 10).map((team: any) => {
                                  const isHomeTeam = team.teamName?.includes(match.homeTeam.name) || match.homeTeam.name?.includes(team.teamName);
                                  const isAwayTeam = team.teamName?.includes(match.awayTeam.name) || match.awayTeam.name?.includes(team.teamName);
                                  return (
                                      <div 
                                          key={team.teamId} 
                                          className={`grid grid-cols-[40px_1fr_32px_32px_32px_40px] gap-2 px-3 py-2.5 items-center ${isHomeTeam || isAwayTeam ? 'bg-indigo-900/20' : ''}`}
                                      >
                                          <span className={`text-xs font-bold ${team.rank <= 4 ? 'text-green-400' : team.rank >= 18 ? 'text-red-400' : 'text-gray-400'}`}>
                                              {team.rank}
                                          </span>
                                          <div className="flex items-center gap-2 min-w-0">
                                              {team.logo && <img src={team.logo} className="w-5 h-5 object-contain flex-shrink-0" />}
                                              <span className={`text-sm font-medium truncate ${isHomeTeam || isAwayTeam ? 'text-white font-bold' : 'text-gray-300'}`}>
                                                  {team.teamName}
                                              </span>
                                          </div>
                                          <span className="text-center text-xs text-gray-400">{team.won}</span>
                                          <span className="text-center text-xs text-gray-400">{team.drawn}</span>
                                          <span className="text-center text-xs text-gray-400">{team.lost}</span>
                                          <span className="text-center text-sm font-bold text-white">{team.points}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  ) : (
                      <div className="py-20 text-center text-gray-500">
                          <Table size={40} className="mx-auto mb-3 opacity-20" />
                          <p className="font-condensed font-bold uppercase">Standings Unavailable</p>
                      </div>
                  )}
              </div>
          )}

          {/* TAB: COMMUNITY */}
          {activeTab === 'COMMUNITY' && (
              <div className="p-4 animate-in fade-in">
                  <div className="mb-6">
                      <h3 className="font-condensed font-black text-xl uppercase italic text-white mb-4">Banther Board</h3>
                      
                      {/* Comment Input */}
                      <div className="flex gap-2 mb-6">
                          <input 
                              className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                              placeholder="Trash talk or insight..."
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                          />
                          <button onClick={handlePostComment} className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-500 transition-colors">
                              <Send size={18} />
                          </button>
                      </div>

                      {/* Comments Feed */}
                      <div className="space-y-4">
                          {matchDetails?.comments?.map((comment: any) => (
                              <div key={comment.id} className="flex gap-3 animate-in slide-in-from-bottom-2">
                                  <div className="relative">
                                      <img src={comment.userAvatar} className="w-8 h-8 rounded-full bg-gray-700" />
                                      {comment.teamSupport && (
                                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px] font-black text-white ${comment.teamSupport === 'HOME' ? 'bg-blue-600' : 'bg-red-600'}`}>
                                              {comment.teamSupport === 'HOME' ? 'H' : 'A'}
                                          </div>
                                      )}
                                  </div>
                                  <div className="flex-1 bg-[#1E1E1E] rounded-lg p-3 border border-[#2C2C2C]">
                                      <div className="flex justify-between items-center mb-1">
                                          <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-xs text-white">{comment.userName}</span>
                                              {comment.isPro && <Crown size={10} className="text-yellow-400 fill-yellow-400" />}
                                          </div>
                                          <span className="text-[10px] text-gray-500">{comment.timestamp || 'Just now'}</span>
                                      </div>
                                      <p className="text-sm text-gray-300 leading-normal">{comment.text}</p>
                                  </div>
                              </div>
                          ))}
                          {(!matchDetails?.comments || matchDetails.comments.length === 0) && (
                              <div className="text-center text-gray-600 text-xs py-4">Be the first to comment!</div>
                          )}
                      </div>
                  </div>
              </div>
          )}

      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 md:ml-[260px] bg-[#121212]/95 backdrop-blur-xl border-t border-[#2C2C2C] p-4 z-30 flex items-center gap-4 safe-pb">
          <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Sheena's Pick</span>
              <div className="flex items-center gap-2">
                  <span className="font-condensed font-black text-lg uppercase text-white">
                      {match.prediction?.outcome === 'HOME' ? match.homeTeam.name : match.prediction?.outcome === 'AWAY' ? match.awayTeam.name : 'Draw'}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#00FFB2]">{match.prediction?.potentialReturn || '+100'}</span>
              </div>
          </div>
          
          <div className="flex-1 flex gap-2 justify-end">
              <button onClick={() => onOpenPweza()} className="w-12 h-12 bg-[#1E1E1E] hover:bg-[#2C2C2C] rounded-xl flex items-center justify-center border border-[#333] transition-colors">
                  <span className="text-2xl">🐙</span>
              </button>
              
              <button 
                  onClick={handleAddToSlip}
                  disabled={isInSlip || betSlipStatus === 'ADDED'}
                  className={`
                      flex-1 max-w-[200px] h-12 rounded-xl font-condensed font-black text-lg uppercase flex items-center justify-center gap-2 transition-all
                      ${isInSlip || betSlipStatus === 'ADDED'
                          ? 'bg-green-600 text-white cursor-default' 
                          : betSlipStatus === 'CONFIRM' 
                              ? 'bg-yellow-500 text-black animate-pulse' 
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                      }
                  `}
              >
                  {isInSlip || betSlipStatus === 'ADDED' ? (
                      <>In Slip <Check size={20} /></>
                  ) : betSlipStatus === 'CONFIRM' ? (
                      <>Confirm?</>
                  ) : (
                      <>Add to Slip <PlusCircle size={20} /></>
                  )}
              </button>
          </div>
      </div>

      {/* SCORESHOT MODAL */}
      {showScoreShot && <ScoreShotModal match={match} onClose={() => setShowScoreShot(false)} />}

    </div>
  );
};

// --- SUB COMPONENTS ---

const StreamItem: React.FC<{ event: TimelineEvent, dataSaver?: boolean }> = ({ event, dataSaver }) => (
    <div className="relative animate-in fade-in slide-in-from-bottom-2">
        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-[#121212] flex items-center justify-center bg-[#2C2C2C] z-10">
            {event.type === 'GOAL' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
            {event.type === 'CARD' && <div className="w-2 h-2 bg-yellow-500 rounded-[1px]"></div>}
            {event.type === 'SOCIAL' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
        </div>
        
        <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase">{event.minute}</span>
            {event.source && <span className="text-[10px] font-bold text-blue-400 uppercase">@{event.source}</span>}
        </div>
        
        {event.mediaUrl && !dataSaver && (
            <div className="mb-2 rounded-lg overflow-hidden border border-[#333] max-w-[200px]">
                <img src={event.mediaUrl} className="w-full h-full object-cover" />
            </div>
        )}
        
        <p className="text-sm text-gray-300 leading-relaxed font-medium">
            {event.description}
        </p>
    </div>
);

const TimelineItem: React.FC<{ event: TimelineEvent, isLast: boolean, dataSaver?: boolean }> = ({ event, isLast, dataSaver }) => (
    <div className="flex gap-4 relative pb-6">
        {!isLast && <div className="absolute left-[19px] top-8 bottom-0 w-[2px] bg-[#1E1E1E]"></div>}
        
        <div className="w-10 h-10 rounded-full bg-[#1E1E1E] border border-[#333] flex items-center justify-center shrink-0 z-10 font-bold text-xs text-white">
            {event.minute}
        </div>
        
        <div className="flex-1 pt-1">
            <div className="flex items-center gap-2 mb-1">
                {event.type === 'GOAL' && <Goal size={14} className="text-green-500" />}
                {event.type === 'CARD' && <div className="w-3 h-4 bg-yellow-500 rounded-[1px]"></div>}
                {event.type === 'SUB' && <Repeat size={14} className="text-blue-500" />}
                <span className="font-bold text-sm uppercase text-white">{event.player}</span>
            </div>
            <p className="text-xs text-gray-500">{event.description}</p>
        </div>
    </div>
);

const BoxScoreTable: React.FC<{ players?: BoxScore['home'], headers: string[] }> = ({ players, headers }) => {
    if (!players) return null;
    return (
        <div className="overflow-x-auto rounded-lg border border-[#2C2C2C]">
            <table className="w-full text-xs text-left">
                <thead className="bg-[#1E1E1E] text-gray-400 uppercase font-bold">
                    <tr>
                        <th className="p-3">Player</th>
                        {headers.map(h => <th key={h} className="p-3 text-center">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2C2C]">
                    {players.map(p => (
                        <tr key={p.id} className="hover:bg-white/5">
                            <td className="p-3 font-bold text-white">{p.name}</td>
                            {headers.map(h => (
                                <td key={h} className="p-3 text-center text-gray-300 font-mono">
                                    {p.stats[h] || '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const StatGroup: React.FC<{ title: string, stats: { label: string, home: number, away: number, isPercent?: boolean }[] }> = ({ title, stats }) => (
    <div>
        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-wider border-b border-[#2C2C2C] pb-1">{title}</h4>
        <div className="space-y-4">
            {stats.map((stat, i) => {
                const total = stat.home + stat.away || 1;
                const homePct = stat.isPercent ? stat.home : (stat.home / total) * 100;
                const awayPct = stat.isPercent ? stat.away : (stat.away / total) * 100;
                
                return (
                    <div key={i}>
                        <div className="flex justify-between text-xs font-bold text-gray-300 mb-1.5">
                            <span>{stat.home}{stat.isPercent && '%'}</span>
                            <span className="uppercase text-[10px] text-gray-500">{stat.label}</span>
                            <span>{stat.away}{stat.isPercent && '%'}</span>
                        </div>
                        <div className="flex h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden gap-0.5">
                            <div className="bg-indigo-500" style={{ width: `${homePct}%` }}></div>
                            <div className="bg-gray-600" style={{ width: `${awayPct}%` }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const SoccerPitch: React.FC<{ lineup: TeamLineup, teamName: string }> = ({ lineup, teamName }) => {
    return (
        <div className="relative w-full aspect-[3/4] bg-[#1a3c28] rounded-xl border-4 border-[#2a5a3b] overflow-hidden shadow-inner">
            {/* Pitch Markings - decorative */}
            <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none opacity-30">
                <div className="w-32 h-0.5 bg-white/20 rounded-full" />
                <div className="w-full flex justify-between px-6">
                    <div className="w-20 h-0.5 bg-white/10 rounded-full" />
                    <div className="w-20 h-0.5 bg-white/10 rounded-full" />
                </div>
                <div className="w-32 h-0.5 bg-white/20 rounded-full" />
            </div>

            {/* Simple starting XI grid (safe fallback to precise pitch positioning) */}
            <div className="relative p-4">
                <h4 className="text-sm font-bold text-white mb-3">{teamName} — Starting XI</h4>
                <div className="grid grid-cols-3 gap-2">
                    {(lineup?.starting || []).map(player => (
                        <div key={player.id} className="p-2 bg-[#153e2b] border border-[#224f39] rounded-md">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center font-bold text-sm">{player.number}</div>
                                <div>
                                    <div className="text-sm font-bold text-white">{player.name}</div>
                                    <div className="text-xs text-gray-300">{player.position}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
