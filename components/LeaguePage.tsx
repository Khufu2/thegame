
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';
import { ArrowLeft, Trophy, Calendar, Users, ChevronRight, TrendingUp, Shield, Target, Award, PlayCircle, Star, Filter, ArrowRightLeft, DollarSign } from 'lucide-react';
import { Match, MatchStatus } from '../types';
import { HeroNewsCard, StandardNewsCard } from './Feed';

// --- MOCK DATA GENERATORS ---
const getLeagueColors = (id: string) => {
    switch (id) {
        case 'EPL': return { bg: 'from-[#38003C] to-[#19001F]', accent: 'text-[#00FF85]', border: 'border-[#00FF85]' };
        case 'LaLiga': return { bg: 'from-[#FF0000] to-[#4a0000]', accent: 'text-[#FFCC00]', border: 'border-[#FF0000]' };
        case 'NBA': return { bg: 'from-[#1D428A] to-[#000000]', accent: 'text-[#C8102E]', border: 'border-[#1D428A]' };
        case 'NFL': return { bg: 'from-[#013369] to-[#000000]', accent: 'text-[#D50A0A]', border: 'border-[#D50A0A]' };
        default: return { bg: 'from-gray-900 to-black', accent: 'text-white', border: 'border-gray-500' };
    }
};

const MOCK_PLAYERS = [
    { name: 'Erling Haaland', team: 'Man City', value: '14', label: 'Goals', avatar: 'https://ui-avatars.com/api/?name=EH&background=00B5E2&color=fff' },
    { name: 'Mohamed Salah', team: 'Liverpool', value: '10', label: 'Goals', avatar: 'https://ui-avatars.com/api/?name=MS&background=C8102E&color=fff' },
    { name: 'Cole Palmer', team: 'Chelsea', value: '8', label: 'Goals', avatar: 'https://ui-avatars.com/api/?name=CP&background=034694&color=fff' },
];

const MOCK_ASSISTS = [
    { name: 'Bukayo Saka', team: 'Arsenal', value: '9', label: 'Assists', avatar: 'https://ui-avatars.com/api/?name=BS&background=EF0107&color=fff' },
    { name: 'Cole Palmer', team: 'Chelsea', value: '7', label: 'Assists', avatar: 'https://ui-avatars.com/api/?name=CP&background=034694&color=fff' },
];

const MOCK_STANDINGS = [
    { rank: 1, team: 'Liverpool', p: 11, w: 9, d: 1, l: 1, gd: 15, pts: 28, form: ['W','W','D','W','W'] },
    { rank: 2, team: 'Man City', p: 11, w: 7, d: 2, l: 2, gd: 9, pts: 23, form: ['L','L','W','W','W'] },
    { rank: 3, team: 'Chelsea', p: 11, w: 5, d: 4, l: 2, gd: 8, pts: 19, form: ['D','W','D','L','W'] },
    { rank: 4, team: 'Arsenal', p: 11, w: 5, d: 4, l: 2, gd: 6, pts: 19, form: ['D','L','D','L','W'] },
    { rank: 5, team: 'Nottm Forest', p: 11, w: 5, d: 4, l: 2, gd: 5, pts: 19, form: ['L','W','W','W','D'] },
    { rank: 6, team: 'Aston Villa', p: 11, w: 5, d: 3, l: 3, gd: 0, pts: 18, form: ['L','L','D','W','D'] },
];

const MOCK_TRANSFERS = [
    { id: 1, player: 'Victor Osimhen', from: 'Napoli', to: 'Chelsea', fee: '€120M', type: 'RUMOR' },
    { id: 2, player: 'Ivan Toney', from: 'Brentford', to: 'Al-Ahli', fee: '€40M', type: 'CONFIRMED' },
    { id: 3, player: 'Pedro Neto', from: 'Wolves', to: 'Chelsea', fee: '€60M', type: 'CONFIRMED' },
];

// League code to name mapping
const LEAGUE_CODE_MAP: Record<string, string[]> = {
    'PL': ['Premier League'],
    'EPL': ['Premier League'],
    'BL1': ['Bundesliga'],
    'SA': ['Serie A'],
    'PD': ['La Liga'],
    'FL1': ['Ligue 1'],
    'CL': ['Champions League'],
    'EL': ['Europa League'],
    'NBA': ['NBA'],
    'F1': ['Formula 1'],
};

export const LeaguePage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { matches, news } = useSports();
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATCHES' | 'STANDINGS' | 'STATS' | 'TRANSFERS' | 'NEWS'>('OVERVIEW');

    const leagueId = id || 'EPL';
    const theme = getLeagueColors(leagueId);
    
    // Get league names that match this code
    const leagueNames = LEAGUE_CODE_MAP[leagueId] || [leagueId];

    // Filter content - match by league name or code
    const leagueMatches = (matches || []).filter(m => 
        leagueNames.some(name => m.league?.toLowerCase().includes(name.toLowerCase())) ||
        m.league === leagueId
    );
    const leagueNews = (news || []).filter(n => n.tags?.includes(leagueId));

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            
            {/* 1. IMMERSIVE HERO HEADER */}
            <div className={`relative w-full pt-16 pb-8 px-6 bg-gradient-to-br ${theme.bg} overflow-hidden`}>
                {/* Abstract Patterns */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <button onClick={() => navigate(-1)} className="mb-6 p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-colors w-fit">
                        <ArrowLeft size={24} className="text-white" />
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center p-2 transform rotate-3">
                                <span className="font-black text-4xl text-black uppercase">{leagueId.substring(0,2)}</span>
                                {/* Ideally <img src={logo} /> */}
                            </div>
                            <div>
                                <h1 className="font-condensed font-black text-5xl md:text-7xl uppercase italic tracking-tighter leading-none">{leagueId}</h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="bg-black/30 backdrop-blur px-3 py-1 rounded text-xs font-bold uppercase border border-white/10">Season 2024/25</span>
                                    <span className={`text-xs font-bold uppercase ${theme.accent} flex items-center gap-1`}>
                                        <Trophy size={12} /> Defending Champs: Man City
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Strip */}
                        <div className="flex gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/60 uppercase">Matches</span>
                                <span className="font-mono font-black text-xl">380</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/60 uppercase">Teams</span>
                                <span className="font-mono font-black text-xl">20</span>
                            </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/60 uppercase">Followers</span>
                                <span className="font-mono font-black text-xl">2.4B</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. NAVIGATION TABS */}
            <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C]">
                 <div className="flex overflow-x-auto no-scrollbar px-4">
                     {['OVERVIEW', 'MATCHES', 'STANDINGS', 'STATS', 'TRANSFERS', 'NEWS'].map(tab => (
                         <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-4 font-condensed font-bold text-sm uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? `text-white ${theme.border}` : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                         >
                             {tab}
                         </button>
                     ))}
                 </div>
            </div>

            <div className="max-w-[1000px] mx-auto p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4">
                
                {/* TAB: OVERVIEW */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-8">
                        
                        {/* Spotlight Match */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-condensed font-black text-xl uppercase italic text-gray-400">Match of the Week</h3>
                            </div>
                            {leagueMatches[0] ? (
                                <div onClick={() => navigate(`/match/${leagueMatches[0].id}`)} className="cursor-pointer group relative h-[200px] rounded-2xl overflow-hidden border border-[#333]">
                                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                                    
                                    <div className="absolute inset-0 z-20 p-6 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`bg-white text-black text-[10px] font-black uppercase px-2 py-0.5 rounded`}>Sunday Showdown</span>
                                            <span className="text-white font-bold text-xs uppercase shadow-black drop-shadow-md">16:30 GMT</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <h4 className="font-condensed font-black text-4xl uppercase text-white leading-none">{leagueMatches[0].homeTeam.name}</h4>
                                                <span className="text-xs font-bold text-gray-400 uppercase">Home</span>
                                            </div>
                                            <span className="font-serif italic text-2xl text-gray-500">VS</span>
                                            <div>
                                                <h4 className="font-condensed font-black text-4xl uppercase text-white leading-none">{leagueMatches[0].awayTeam.name}</h4>
                                                <span className="text-xs font-bold text-gray-400 uppercase">Away</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-300">
                                            <Target size={16} className={theme.accent.replace('text-', 'text-')} />
                                            <span>Prediction: Over 2.5 Goals & Both Teams to Score</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center bg-[#1E1E1E] rounded-xl border border-[#333] text-gray-500">No upcoming big games.</div>
                            )}
                        </section>

                        {/* Fixtures Rail */}
                        <section>
                             <h3 className="font-condensed font-black text-xl uppercase italic text-gray-400 mb-4">Upcoming Fixtures</h3>
                             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                                 {leagueMatches.slice(1, 6).map(m => (
                                     <div key={m.id} onClick={() => navigate(`/match/${m.id}`)} className="min-w-[220px] bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-3 flex flex-col gap-3 cursor-pointer hover:border-gray-500 transition-colors">
                                         <span className="text-[10px] font-bold text-gray-500 uppercase">{m.time} • Sun 17</span>
                                         <div className="space-y-2">
                                             <div className="flex items-center gap-2">
                                                 <img src={m.homeTeam.logo} className="w-5 h-5 object-contain" />
                                                 <span className="font-bold text-sm text-white">{m.homeTeam.name}</span>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <img src={m.awayTeam.logo} className="w-5 h-5 object-contain" />
                                                 <span className="font-bold text-sm text-white">{m.awayTeam.name}</span>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </section>

                        {/* Top Scorers Preview */}
                        <section>
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="font-condensed font-black text-xl uppercase italic text-gray-400">Golden Boot Race</h3>
                                <button onClick={() => setActiveTab('STATS')} className="text-xs font-bold text-indigo-500 uppercase">View All</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {MOCK_PLAYERS.map((player, idx) => (
                                    <PlayerStatCard key={idx} rank={idx+1} player={player} />
                                ))}
                            </div>
                        </section>

                        {/* Mini Standings */}
                        <section>
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="font-condensed font-black text-xl uppercase italic text-gray-400">Table</h3>
                                <button onClick={() => setActiveTab('STANDINGS')} className="text-xs font-bold text-indigo-500 uppercase">Full Table</button>
                            </div>
                            <StandingsTable data={MOCK_STANDINGS.slice(0, 5)} compact />
                        </section>

                    </div>
                )}

                {/* TAB: STANDINGS (Full) */}
                {activeTab === 'STANDINGS' && (
                    <div>
                         <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden shadow-2xl">
                             <div className="p-4 bg-[#121212] border-b border-[#2C2C2C] flex justify-between items-center">
                                 <h3 className="font-condensed font-bold uppercase text-white">Live Table</h3>
                                 <div className="flex gap-2">
                                     <span className="flex items-center gap-1 text-[10px] font-bold text-green-500"><div className="w-2 h-2 rounded-full bg-green-500"></div> UCL</span>
                                     <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> UEL</span>
                                     <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><div className="w-2 h-2 rounded-full bg-red-500"></div> Rel</span>
                                 </div>
                             </div>
                             <StandingsTable data={MOCK_STANDINGS} />
                         </div>
                         <div className="mt-4 p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-lg flex items-start gap-3">
                             <TrendingUp className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                             <div>
                                 <h4 className="font-bold text-indigo-400 text-sm uppercase mb-1">Sheena Insight</h4>
                                 <p className="text-xs text-gray-300">
                                     Liverpool have a 85% probability of winning the title based on current form and remaining fixtures.
                                     Arsenal needs to win their next 3 to stay in contention.
                                 </p>
                             </div>
                         </div>
                    </div>
                )}

                {/* TAB: MATCHES */}
                {activeTab === 'MATCHES' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 overflow-x-auto no-scrollbar pb-2">
                            <button className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold uppercase whitespace-nowrap">Gameweek 12</button>
                            <button className="px-4 py-2 bg-[#1E1E1E] text-gray-400 hover:text-white rounded-full text-xs font-bold uppercase whitespace-nowrap">Gameweek 13</button>
                            <button className="px-4 py-2 bg-[#1E1E1E] text-gray-400 hover:text-white rounded-full text-xs font-bold uppercase whitespace-nowrap">Gameweek 14</button>
                        </div>

                        {leagueMatches.length > 0 ? leagueMatches.map(match => (
                            <div key={match.id} onClick={() => navigate(`/match/${match.id}`)} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#252525] transition-colors">
                                <div className="flex flex-col items-center w-16 border-r border-[#333] pr-4 mr-4">
                                    <span className="text-xs font-bold text-gray-400">{match.time}</span>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase">Sun 17</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <img src={match.homeTeam.logo} className="w-6 h-6 object-contain" />
                                            <span className="font-bold text-sm text-white">{match.homeTeam.name}</span>
                                        </div>
                                        <span className="font-mono text-sm text-gray-400">{match.score?.home ?? '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <img src={match.awayTeam.logo} className="w-6 h-6 object-contain" />
                                            <span className="font-bold text-sm text-white">{match.awayTeam.name}</span>
                                        </div>
                                        <span className="font-mono text-sm text-gray-400">{match.score?.away ?? '-'}</span>
                                    </div>
                                </div>
                                {match.prediction && (
                                    <div className="ml-4 pl-4 border-l border-[#333] flex flex-col items-center">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase">Odds</span>
                                        <span className="text-xs font-mono font-bold text-[#00FFB2]">{match.prediction.potentialReturn}</span>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="p-10 text-center text-gray-500">No matches scheduled for this period.</div>
                        )}
                    </div>
                )}

                {/* TAB: STATS */}
                {activeTab === 'STATS' && (
                    <div className="space-y-8">
                        <section>
                             <h3 className="font-condensed font-black text-xl uppercase italic text-white mb-4 flex items-center gap-2"><Target size={20} className="text-blue-500" /> Top Scorers</h3>
                             <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden">
                                 {MOCK_PLAYERS.map((p, i) => (
                                     <div key={i} className="flex items-center p-4 border-b border-[#333] last:border-0 hover:bg-[#252525]">
                                         <span className="w-8 font-mono font-bold text-gray-500 text-lg">{i+1}</span>
                                         <img src={p.avatar} className="w-10 h-10 rounded-full bg-gray-700 mr-4" />
                                         <div className="flex-1">
                                             <span className="block font-bold text-white text-sm">{p.name}</span>
                                             <span className="text-xs text-gray-500 uppercase">{p.team}</span>
                                         </div>
                                         <span className="font-mono font-black text-xl text-white">{p.value}</span>
                                     </div>
                                 ))}
                             </div>
                        </section>

                        <section>
                             <h3 className="font-condensed font-black text-xl uppercase italic text-white mb-4 flex items-center gap-2"><Users size={20} className="text-green-500" /> Assists</h3>
                             <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden">
                                 {MOCK_ASSISTS.map((p, i) => (
                                     <div key={i} className="flex items-center p-4 border-b border-[#333] last:border-0 hover:bg-[#252525]">
                                         <span className="w-8 font-mono font-bold text-gray-500 text-lg">{i+1}</span>
                                         <img src={p.avatar} className="w-10 h-10 rounded-full bg-gray-700 mr-4" />
                                         <div className="flex-1">
                                             <span className="block font-bold text-white text-sm">{p.name}</span>
                                             <span className="text-xs text-gray-500 uppercase">{p.team}</span>
                                         </div>
                                         <span className="font-mono font-black text-xl text-white">{p.value}</span>
                                     </div>
                                 ))}
                             </div>
                        </section>
                    </div>
                )}

                {/* TAB: TRANSFERS */}
                {activeTab === 'TRANSFERS' && (
                     <div className="space-y-4">
                         <div className="flex items-center gap-2 mb-4 bg-yellow-900/10 border border-yellow-600/30 p-3 rounded-lg">
                             <ArrowRightLeft className="text-yellow-500" size={18} />
                             <span className="text-sm text-yellow-500 font-bold uppercase">Transfer Window Open</span>
                         </div>
                         
                         {MOCK_TRANSFERS.map(t => (
                             <div key={t.id} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
                                 {t.type === 'CONFIRMED' && <div className="absolute top-0 right-0 bg-green-500 text-black text-[9px] font-black uppercase px-2 py-0.5">Confirmed</div>}
                                 {t.type === 'RUMOR' && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black uppercase px-2 py-0.5">Rumor</div>}
                                 
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-[#121212] border border-[#333] flex items-center justify-center font-bold text-xs text-gray-500">
                                         {t.player[0]}
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-white text-sm">{t.player}</h4>
                                         <div className="flex items-center gap-2 mt-1">
                                             <span className="text-xs text-gray-400 font-bold uppercase">{t.from}</span>
                                             <ArrowRightLeft size={10} className="text-gray-600" />
                                             <span className="text-xs text-white font-bold uppercase">{t.to}</span>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <span className="block text-[10px] font-bold text-gray-500 uppercase">Fee</span>
                                     <span className="font-mono font-bold text-[#00FFB2]">{t.fee}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                )}

                {/* TAB: NEWS */}
                {activeTab === 'NEWS' && (
                    <div className="space-y-4">
                        {leagueNews.length > 0 ? leagueNews.map(story => (
                             story.isHero 
                             ? <HeroNewsCard key={story.id} story={story} onClick={() => navigate(`/article/${story.id}`)} />
                             : <StandardNewsCard key={story.id} story={story} onClick={() => navigate(`/article/${story.id}`)} />
                        )) : (
                            <div className="p-10 text-center text-gray-500">No recent news for {leagueId}.</div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const PlayerStatCard: React.FC<{ rank: number, player: any }> = ({ rank, player }) => (
    <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/50 to-transparent pointer-events-none"></div>
        
        <div className="w-8 h-8 rounded bg-[#121212] border border-[#333] flex items-center justify-center font-mono font-bold text-gray-400 absolute top-2 right-2 text-xs">
            #{rank}
        </div>

        <div className="w-14 h-14 rounded-full border-2 border-[#333] overflow-hidden shrink-0 z-10">
            <img src={player.avatar} className="w-full h-full object-cover" />
        </div>
        
        <div className="z-10">
            <span className="block font-bold text-white text-sm">{player.name}</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">{player.team}</span>
            <div className="flex items-baseline gap-1">
                <span className="font-mono font-black text-2xl text-[#00FFB2]">{player.value}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{player.label}</span>
            </div>
        </div>
    </div>
);

const StandingsTable: React.FC<{ data: any[], compact?: boolean }> = ({ data, compact }) => (
    <table className="w-full text-left text-xs">
        <thead className={`text-gray-500 uppercase font-bold border-b border-[#2C2C2C] ${compact ? 'bg-transparent' : 'bg-black'}`}>
            <tr>
                <th className="p-3 text-center">Pos</th>
                <th className="p-3">Team</th>
                <th className="p-3 text-center">P</th>
                {!compact && <th className="p-3 text-center">W</th>}
                {!compact && <th className="p-3 text-center">D</th>}
                {!compact && <th className="p-3 text-center">L</th>}
                <th className="p-3 text-center">GD</th>
                <th className="p-3 text-center text-white">Pts</th>
                {!compact && <th className="p-3 text-center">Form</th>}
            </tr>
        </thead>
        <tbody className="divide-y divide-[#2C2C2C]">
            {data.map((row) => (
                <tr key={row.rank} className="hover:bg-white/5 transition-colors">
                    <td className={`p-3 text-center font-mono font-bold ${row.rank <= 4 ? 'text-green-500 border-l-2 border-green-500' : row.rank >= 18 ? 'text-red-500 border-l-2 border-red-500' : 'text-gray-500'}`}>
                        {row.rank}
                    </td>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                        {/* Mock Logo */}
                        <div className="w-4 h-4 rounded-full bg-gray-700"></div>
                        {row.team}
                    </td>
                    <td className="p-3 text-center text-gray-400">{row.p}</td>
                    {!compact && <td className="p-3 text-center text-gray-400">{row.w}</td>}
                    {!compact && <td className="p-3 text-center text-gray-400">{row.d}</td>}
                    {!compact && <td className="p-3 text-center text-gray-400">{row.l}</td>}
                    <td className="p-3 text-center text-gray-400">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                    <td className="p-3 text-center font-black text-white">{row.pts}</td>
                    {!compact && (
                        <td className="p-3 flex justify-center gap-1">
                            {row.form.map((res: string, i: number) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${res === 'W' ? 'bg-green-500' : res === 'D' ? 'bg-gray-500' : 'bg-red-500'}`} />
                            ))}
                        </td>
                    )}
                </tr>
            ))}
        </tbody>
    </table>
);
