
import React, { useState } from 'react';
import { Match, NewsStory, MatchStatus } from '../types';
import { Share2, MessageSquare, PlayCircle, ArrowRight, Target, Sparkles, CloudRain, Activity, AlertCircle } from 'lucide-react';

interface FeedProps {
  items: (NewsStory | Match)[];
  matches: Match[];
}

const TABS = ["Top News", "My Teams", "NFL", "NBA", "Premier League"];

export const Feed: React.FC<FeedProps> = ({ items, matches }) => {
  const [activeTab, setActiveTab] = useState("Top News");

  return (
    <div className="min-h-screen bg-br-bg pb-20">
      
      {/* 1. COMPACT SCORE STRIP */}
      <div className="h-[56px] bg-br-card border-b border-br-border overflow-x-auto no-scrollbar flex items-center sticky top-[60px] md:top-0 z-30">
        <div className="flex px-2 gap-2 min-w-max">
           {matches.map(m => <ScoreTile key={m.id} match={m} />)}
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="bg-br-bg/95 backdrop-blur border-b border-br-border sticky top-[116px] md:top-[56px] z-20 h-[44px]">
         <div className="flex items-center px-4 gap-6 overflow-x-auto no-scrollbar h-full">
            {TABS.map(tab => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`h-full flex items-center font-condensed font-bold text-lg uppercase tracking-wide border-b-[3px] transition-colors whitespace-nowrap ${activeTab === tab ? 'border-white text-white' : 'border-transparent text-br-muted hover:text-white'}`}
                >
                    {tab}
                </button>
            ))}
         </div>
      </div>

      {/* 3. MAIN FEED AREA */}
      <div className="md:max-w-[600px] md:mx-auto pt-0">
        
        {/* Social Stories Rail */}
        {activeTab === 'Top News' && (
            <div className="py-4 overflow-x-auto no-scrollbar bg-br-bg mb-2">
                <div className="flex gap-3 px-4">
                    {items.filter(i => 'type' in i && i.type === 'HIGHLIGHT').map((story, idx) => (
                        <StoryItem key={idx} story={story as NewsStory} />
                    ))}
                </div>
            </div>
        )}

        {/* Content Stream */}
        <div className="flex flex-col gap-1 md:gap-4">
            {items.map((item, index) => {
                if ('type' in item) {
                    const story = item as NewsStory;
                    if (index === 0 && activeTab === 'Top News') {
                        return <HeroNews key={story.id} story={story} />;
                    }
                    return <StandardNews key={story.id} story={story} />;
                } else {
                    return <SheenaIntelligenceCard key={item.id} match={item as Match} />;
                }
            })}
        </div>

      </div>
    </div>
  );
};

// --- COMPONENTS ---

const ScoreTile: React.FC<{ match: Match }> = ({ match }) => {
    const isLive = match.status === MatchStatus.LIVE;
    return (
        <div className="h-[36px] px-3 bg-br-surface/40 rounded border border-white/5 flex items-center justify-between gap-4 min-w-[140px] hover:bg-br-surface transition-colors cursor-pointer">
            <div className="flex items-center gap-2 text-xs font-bold font-condensed tracking-wide">
                 <span className="text-br-muted w-8 text-right">{match.homeTeam.name.substring(0,3).toUpperCase()}</span>
                 <span className="text-white">{match.score?.home ?? '-'}</span>
                 <span className="text-br-muted text-[9px]">vs</span>
                 <span className="text-white">{match.score?.away ?? '-'}</span>
                 <span className="text-br-muted w-8 text-left">{match.awayTeam.name.substring(0,3).toUpperCase()}</span>
            </div>
            {isLive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-br-accent animate-pulse" />
            ) : (
                <span className="text-[9px] font-bold text-br-muted">{match.time}</span>
            )}
        </div>
    )
}

const StoryItem: React.FC<{ story: NewsStory }> = ({ story }) => (
    <div className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group">
        <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-tr from-sheena-primary via-purple-500 to-br-bg group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full border-[3px] border-black overflow-hidden">
                <img src={story.imageUrl} className="w-full h-full object-cover" />
            </div>
        </div>
        <span className="text-[10px] font-bold text-br-muted uppercase tracking-wide truncate w-full text-center group-hover:text-white transition-colors">
            {story.source}
        </span>
    </div>
);

const HeroNews: React.FC<{ story: NewsStory }> = ({ story }) => (
    <div className="relative w-full aspect-[4/5] md:aspect-video bg-br-surface cursor-pointer group md:rounded-xl overflow-hidden mb-1">
        <img src={story.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-5 md:p-8 w-full">
            <div className="flex items-center gap-2 mb-3">
                <span className="bg-white text-black text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">Top Story</span>
                <span className="text-gray-300 text-xs font-condensed font-bold uppercase tracking-wider">• {story.timestamp}</span>
            </div>
            <h1 className="font-condensed font-black text-4xl md:text-5xl text-white uppercase leading-[0.9] mb-2 tracking-tight">
                {story.title}
            </h1>
            <p className="text-gray-300 line-clamp-2 text-sm md:text-base mb-4 font-medium max-w-[95%]">
                {story.summary}
            </p>
            <div className="flex items-center gap-5 text-white/70">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"><MessageSquare size={14} /> {story.comments}</span>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"><Share2 size={14} /> Share</span>
            </div>
        </div>
    </div>
);

const StandardNews: React.FC<{ story: NewsStory }> = ({ story }) => (
    <div className="flex gap-4 p-4 bg-br-bg border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors md:rounded-lg md:border md:mb-1">
        <div className="w-[120px] h-[80px] bg-br-surface shrink-0 overflow-hidden rounded relative">
            <img src={story.imageUrl} className="w-full h-full object-cover" />
            {story.type === 'HIGHLIGHT' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <PlayCircle size={24} className="text-white/90" />
                </div>
            )}
        </div>
        <div className="flex-1 flex flex-col justify-between py-0.5">
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-br-muted uppercase tracking-widest">{story.source}</span>
                    <span className="text-[10px] text-br-muted">• {story.timestamp}</span>
                </div>
                <h3 className="font-condensed font-bold text-lg text-white uppercase leading-none line-clamp-2 tracking-wide">
                    {story.title}
                </h3>
            </div>
            <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-br-muted uppercase"><MessageSquare size={12} /> {story.comments}</span>
            </div>
        </div>
    </div>
);

const SheenaIntelligenceCard: React.FC<{ match: Match }> = ({ match }) => {
    if (!match.prediction) return null;
    
    const isLive = match.status === MatchStatus.LIVE;

    return (
        <div className="bg-[#161616] md:rounded-lg overflow-hidden group relative border-y md:border border-white/10 md:mb-2">
            {/* HEADER: League & Context */}
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-br-muted uppercase tracking-widest">{match.league}</span>
                    <span className="text-[10px] text-br-muted font-medium">•</span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wide">{match.time}</span>
                </div>
                <div className="flex items-center gap-3">
                    {match.prediction.weather && (
                        <div className="flex items-center gap-1.5" title="Match Weather">
                            <CloudRain size={12} className="text-gray-400" />
                            <span className="text-[9px] font-bold text-gray-400 uppercase">{match.prediction.weather}</span>
                        </div>
                    )}
                    {match.prediction.sentiment && (
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm tracking-wider ${match.prediction.sentiment === 'POSITIVE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {match.prediction.sentiment} Vibe
                        </span>
                    )}
                </div>
            </div>

            {/* MAIN MATCHUP */}
            <div className="p-4 flex items-center justify-between relative">
                
                {/* Home Team */}
                <div className="flex-1 flex flex-col gap-1.5">
                     <div className="flex items-center gap-3">
                        <img src={match.homeTeam.logo} className="w-10 h-10 object-contain drop-shadow-lg" />
                        <div>
                            <span className="block font-condensed font-black text-2xl text-white leading-none tracking-tight">{match.homeTeam.name}</span>
                            <div className="flex gap-0.5 mt-1">
                                {match.homeTeam.form?.map((res, i) => <FormDot key={i} result={res} />)}
                            </div>
                        </div>
                     </div>
                </div>
                
                {/* Score / VS */}
                <div className="px-2 flex flex-col items-center">
                    {isLive ? (
                         <div className="flex flex-col items-center gap-1">
                             <span className="text-3xl font-condensed font-black text-br-accent tracking-tighter leading-none">
                                {match.score?.home}-{match.score?.away}
                             </span>
                             <span className="text-[9px] font-bold text-br-accent uppercase animate-pulse">Live</span>
                         </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <span className="text-xs font-black text-br-muted italic">VS</span>
                        </div>
                    )}
                </div>

                {/* Away Team */}
                 <div className="flex-1 flex flex-col gap-1.5 items-end text-right">
                     <div className="flex items-center gap-3 flex-row-reverse">
                        <img src={match.awayTeam.logo} className="w-10 h-10 object-contain drop-shadow-lg" />
                        <div>
                            <span className="block font-condensed font-black text-2xl text-white leading-none tracking-tight">{match.awayTeam.name}</span>
                             <div className="flex gap-0.5 mt-1 justify-end">
                                {match.awayTeam.form?.map((res, i) => <FormDot key={i} result={res} />)}
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* SHEENA INTELLIGENCE SECTION */}
            <div className="relative">
                {/* Subtle gradient background for intelligence section */}
                <div className="absolute inset-0 bg-gradient-to-r from-sheena-primary/10 to-purple-900/10 pointer-events-none" />
                
                <div className="relative border-t border-white/10 p-4 flex flex-col gap-3">
                    
                    {/* Top Row: Prediction & xG */}
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded bg-sheena-primary/20 flex items-center justify-center border border-sheena-primary/30 text-sheena-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                 <Sparkles size={16} />
                             </div>
                             <div>
                                 <span className="block text-[9px] font-black text-indigo-300 uppercase tracking-widest">Predicted Winner</span>
                                 <div className="flex items-center gap-2">
                                     <span className="font-condensed font-bold text-lg text-white uppercase tracking-wide">
                                        {match.prediction.outcome === 'HOME' ? match.homeTeam.name : match.prediction.outcome === 'AWAY' ? match.awayTeam.name : 'DRAW'}
                                     </span>
                                     <span className="text-xs font-bold text-indigo-400">({match.prediction.confidence}%)</span>
                                 </div>
                             </div>
                         </div>

                         <div className="text-right">
                             <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest">Expected Goals (xG)</span>
                             <div className="font-mono text-sm font-bold text-gray-300">
                                {match.prediction.xG?.home.toFixed(2)} - {match.prediction.xG?.away.toFixed(2)}
                             </div>
                         </div>
                    </div>

                    {/* Insight Text */}
                    <p className="text-sm text-gray-300 font-medium leading-relaxed border-l-2 border-sheena-primary/50 pl-3 py-0.5">
                        {match.prediction.aiReasoning}
                    </p>

                    {/* Footer: Betting Angle & Injuries */}
                    <div className="flex items-center justify-between pt-1 mt-1 border-t border-white/5">
                         <div className="flex items-center gap-1.5">
                             <Target size={12} className="text-br-accent" />
                             <span className="text-[10px] font-bold text-br-accent uppercase tracking-wider">Betting Angle: {match.prediction.keyInsight}</span>
                         </div>

                         {match.prediction.injuries && match.prediction.injuries.length > 0 && (
                             <div className="flex items-center gap-1.5">
                                 <AlertCircle size={12} className="text-red-400" />
                                 <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{match.prediction.injuries.length} Key Out</span>
                             </div>
                         )}
                    </div>

                </div>
            </div>
            
            {/* Full Details Action */}
            <button className="w-full bg-white/[0.03] hover:bg-white/[0.06] py-2 flex items-center justify-center gap-1 transition-colors border-t border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-white">View Full Match Analysis</span>
                <ArrowRight size={12} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>

        </div>
    );
}

const FormDot: React.FC<{ result: string }> = ({ result }) => {
    const color = result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-gray-500';
    return (
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} title={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'} />
    )
}
