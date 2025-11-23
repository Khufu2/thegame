
import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { Check, Trophy, Heart, ArrowRight } from 'lucide-react';

const LEAGUES = [
    { id: 'NFL', name: 'NFL', icon: '🏈' },
    { id: 'NBA', name: 'NBA', icon: '🏀' },
    { id: 'EPL', name: 'Premier League', icon: '⚽' },
    { id: 'LaLiga', name: 'La Liga', icon: '🇪🇸' },
    { id: 'UFC', name: 'UFC', icon: '🥊' },
    { id: 'F1', name: 'Formula 1', icon: '🏎️' },
];

const TEAMS = [
    { id: 't5', name: 'Arsenal', league: 'EPL' },
    { id: 't6', name: 'Chelsea', league: 'EPL' },
    { id: 't1', name: 'Patriots', league: 'NFL' },
    { id: 'nba1', name: 'Lakers', league: 'NBA' },
    { id: 't7', name: 'Real Madrid', league: 'LaLiga' },
    { id: 't8', name: 'Barcelona', league: 'LaLiga' },
];

export const Onboarding: React.FC = () => {
    const { completeOnboarding } = useSports();
    const [step, setStep] = useState(1);
    const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    const toggleLeague = (id: string) => {
        if (selectedLeagues.includes(id)) setSelectedLeagues(prev => prev.filter(l => l !== id));
        else setSelectedLeagues(prev => [...prev, id]);
    };

    const toggleTeam = (id: string) => {
        if (selectedTeams.includes(id)) setSelectedTeams(prev => prev.filter(t => t !== id));
        else setSelectedTeams(prev => [...prev, id]);
    };

    const handleNext = () => {
        if (step === 1) setStep(2);
        else completeOnboarding({ leagues: selectedLeagues, teams: selectedTeams });
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
            <div className="w-full max-w-md animate-in slide-in-from-bottom duration-500">
                
                {/* Progress */}
                <div className="flex gap-2 mb-8">
                    <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-[#333]'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-[#333]'}`}></div>
                </div>

                <div className="mb-8">
                    <h1 className="font-condensed font-black text-4xl uppercase italic leading-none mb-2">
                        {step === 1 ? 'Pick Your Sports' : 'Follow Your Teams'}
                    </h1>
                    <p className="text-gray-400">
                        {step === 1 ? 'We will customize your news feed and predictions based on these leagues.' : 'Get instant alerts for match starts and final scores.'}
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {step === 1 ? (
                        LEAGUES.map(league => (
                            <button
                                key={league.id}
                                onClick={() => toggleLeague(league.id)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                    selectedLeagues.includes(league.id) 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : 'bg-[#121212] border-[#2C2C2C] text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                <span className="text-3xl">{league.icon}</span>
                                <span className="font-condensed font-bold uppercase">{league.name}</span>
                                {selectedLeagues.includes(league.id) && <div className="absolute top-2 right-2"><Check size={14} /></div>}
                            </button>
                        ))
                    ) : (
                        TEAMS.map(team => (
                            <button
                                key={team.id}
                                onClick={() => toggleTeam(team.id)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                    selectedTeams.includes(team.id) 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : 'bg-[#121212] border-[#2C2C2C] text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                <span className="font-condensed font-bold uppercase">{team.name}</span>
                                <span className="text-[10px] font-bold opacity-60 uppercase">{team.league}</span>
                            </button>
                        ))
                    )}
                </div>

                <button 
                    onClick={handleNext}
                    className="w-full bg-white text-black font-condensed font-black text-xl uppercase py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                    {step === 1 ? 'Next Step' : 'Launch Sheena'} <ArrowRight size={20} />
                </button>

            </div>
        </div>
    );
};
