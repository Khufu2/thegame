import React, { useState, useEffect } from 'react';
import { useSports } from '../context/SportsContext';
import { Mail, ArrowRight, Lock, Eye, EyeOff, ChevronDown, Check, Trophy, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, UserPreferences } from '../types';
import supabase from '../services/supabaseClient';

const COUNTRY_CODES = [
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+27',  country: 'South Africa', flag: '🇿🇦' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+1',   country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44',  country: 'UK', flag: '🇬🇧' },
];

const LEAGUES = [
    { id: 'PL', name: 'Premier League', icon: '⚽' },
    { id: 'BL1', name: 'Bundesliga', icon: '🇩🇪' },
    { id: 'SA', name: 'Serie A', icon: '🇮🇹' },
    { id: 'PD', name: 'La Liga', icon: '🇪🇸' },
    { id: 'FL1', name: 'Ligue 1', icon: '🇫🇷' },
    { id: 'CL', name: 'Champions League', icon: '🏆' },
];

const TEAMS = [
    { id: 't1', name: 'Arsenal', league: 'PL' },
    { id: 't2', name: 'Chelsea', league: 'PL' },
    { id: 't3', name: 'Manchester United', league: 'PL' },
    { id: 't4', name: 'Liverpool', league: 'PL' },
    { id: 't5', name: 'Real Madrid', league: 'PD' },
    { id: 't6', name: 'Barcelona', league: 'PD' },
    { id: 't7', name: 'Bayern Munich', league: 'BL1' },
    { id: 't8', name: 'Juventus', league: 'SA' },
];

export const AuthPage: React.FC = () => {
    const { login, loginAsGuest, user } = useSports();
    const navigate = useNavigate();
    const [step, setStep] = useState<'AUTH' | 'ONBOARDING_LEAGUES' | 'ONBOARDING_TEAMS'>('AUTH');
    const [isLogin, setIsLogin] = useState(true);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Onboarding states
    const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    // Check if already logged in
    useEffect(() => {
        if (user && user.preferences?.hasCompletedOnboarding) {
            navigate('/scores');
        }
    }, [user, navigate]);

    const buildDefaultPreferences = (raw?: Partial<UserPreferences>): UserPreferences => ({
        favoriteLeagues: raw?.favoriteLeagues ?? [],
        favoriteTeams: raw?.favoriteTeams ?? [],
        notifications: {
            gameStart: true,
            scoreUpdates: true,
            lineMoves: true,
            breakingNews: true,
            whatsappUpdates: false
        },
        communicationChannel: 'EMAIL',
        whatsappNumber: '',
        oddsFormat: 'DECIMAL',
        dataSaver: false,
        theme: 'DARK',
        hasCompletedOnboarding: false
    });

    const mapProfileToUser = (profile: any, fallbackEmail: string, fallbackName?: string): UserProfile => {
        const preferences = buildDefaultPreferences(profile?.preferences);
        const nameFromEmail = fallbackEmail ? fallbackEmail.split('@')[0] : 'Sheena User';

        return {
            id: profile?.id ?? '',
            name: profile?.display_name || fallbackName || nameFromEmail,
            email: profile?.email || fallbackEmail,
            avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameFromEmail)}`,
            isPro: Boolean(profile?.is_pro),
            isAdmin: profile?.email === 'admin@sheena.sports' || profile?.is_admin,
            stats: {
                betsPlaced: profile?.stats?.betsPlaced ?? 0,
                wins: profile?.stats?.wins ?? 0,
                losses: profile?.stats?.losses ?? 0,
                winRate: profile?.stats?.winRate ?? 0,
                netProfit: profile?.stats?.netProfit ?? 0
            },
            preferences
        };
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setErrorMessage('Email and password are required.');
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            if (isLogin) {
                // Sign in
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw new Error(error.message);
                
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                
                const userProfile = mapProfileToUser(profile, email, displayName);
                login(userProfile, data.session?.access_token);
                
                if (!profile?.preferences?.hasCompletedOnboarding) {
                    setStep('ONBOARDING_LEAGUES');
                } else {
                    navigate('/scores');
                }
            } else {
                // Sign up
                const redirectUrl = `${window.location.origin}/`;
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: redirectUrl,
                        data: {
                            display_name: displayName || email.split('@')[0]
                        }
                    }
                });
                
                if (error) throw new Error(error.message);
                
                if (data.user) {
                    setSuccessMessage('Account created! Please check your email to confirm, or continue to set up your profile.');
                    
                    // Try to sign in immediately (works if email confirmation is disabled)
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });
                    
                    if (!signInError && signInData.user) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', signInData.user.id)
                            .single();
                        
                        const userProfile = mapProfileToUser(profile, email, displayName);
                        login(userProfile, signInData.session?.access_token);
                        setStep('ONBOARDING_LEAGUES');
                    }
                }
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Authentication failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleLeague = (id: string) => {
        setSelectedLeagues(prev => 
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };

    const toggleTeam = (id: string) => {
        setSelectedTeams(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleOnboardingNext = async () => {
        if (step === 'ONBOARDING_LEAGUES') {
            setStep('ONBOARDING_TEAMS');
        } else if (step === 'ONBOARDING_TEAMS' && user) {
            // Save preferences to profile
            const updatedPrefs = {
                ...user.preferences,
                favoriteLeagues: selectedLeagues,
                favoriteTeams: selectedTeams,
                hasCompletedOnboarding: true
            };
            
            const { error } = await supabase
                .from('profiles')
                .update({ preferences: updatedPrefs })
                .eq('id', user.id);
            
            if (!error) {
                login({ ...user, preferences: updatedPrefs });
                navigate('/scores');
            }
        }
    };

    const handleGuestAccess = () => {
        loginAsGuest();
        navigate('/scores');
    };

    // Onboarding Screens
    if (step === 'ONBOARDING_LEAGUES' || step === 'ONBOARDING_TEAMS') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
                <div className="w-full max-w-md animate-in slide-in-from-bottom duration-500">
                    
                    {/* Progress */}
                    <div className="flex gap-2 mb-8">
                        <div className={`h-1 flex-1 rounded-full ${step === 'ONBOARDING_LEAGUES' || step === 'ONBOARDING_TEAMS' ? 'bg-indigo-600' : 'bg-[#333]'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${step === 'ONBOARDING_TEAMS' ? 'bg-indigo-600' : 'bg-[#333]'}`}></div>
                    </div>

                    <div className="mb-8">
                        <h1 className="font-condensed font-black text-4xl uppercase italic leading-none mb-2">
                            {step === 'ONBOARDING_LEAGUES' ? 'Pick Your Leagues' : 'Follow Your Teams'}
                        </h1>
                        <p className="text-gray-400">
                            {step === 'ONBOARDING_LEAGUES' 
                                ? 'We will customize your news feed and predictions based on these leagues.' 
                                : 'Get instant alerts for match starts and final scores.'}
                        </p>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {step === 'ONBOARDING_LEAGUES' ? (
                            LEAGUES.map(league => (
                                <button
                                    key={league.id}
                                    onClick={() => toggleLeague(league.id)}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all relative ${
                                        selectedLeagues.includes(league.id) 
                                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                                        : 'bg-[#121212] border-[#2C2C2C] text-gray-400 hover:border-gray-500'
                                    }`}
                                >
                                    <span className="text-3xl">{league.icon}</span>
                                    <span className="font-condensed font-bold uppercase text-sm">{league.name}</span>
                                    {selectedLeagues.includes(league.id) && (
                                        <div className="absolute top-2 right-2">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            TEAMS.filter(t => selectedLeagues.length === 0 || selectedLeagues.includes(t.league))
                                .map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => toggleTeam(team.id)}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all relative ${
                                        selectedTeams.includes(team.id) 
                                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                                        : 'bg-[#121212] border-[#2C2C2C] text-gray-400 hover:border-gray-500'
                                    }`}
                                >
                                    <Heart size={24} className={selectedTeams.includes(team.id) ? 'fill-current' : ''} />
                                    <span className="font-condensed font-bold uppercase text-sm">{team.name}</span>
                                    <span className="text-[10px] font-bold opacity-60 uppercase">{team.league}</span>
                                    {selectedTeams.includes(team.id) && (
                                        <div className="absolute top-2 right-2">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <button 
                        onClick={handleOnboardingNext}
                        className="w-full bg-white text-black font-condensed font-black text-xl uppercase py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        {step === 'ONBOARDING_LEAGUES' ? 'Next Step' : 'Launch Sheena'} <ArrowRight size={20} />
                    </button>

                    {step === 'ONBOARDING_LEAGUES' && (
                        <button 
                            onClick={() => setStep('ONBOARDING_TEAMS')}
                            className="w-full mt-3 text-gray-500 text-sm hover:text-white transition-colors"
                        >
                            Skip for now
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#00FFB2]/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
                
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="inline-block px-4 py-2 border border-white/10 bg-white/5 rounded-full backdrop-blur-md mb-6">
                        <span className="font-condensed font-black text-2xl text-white italic tracking-tighter">SHEENA</span>
                        <span className="font-sans font-bold text-[#00FFB2]">SPORTS</span>
                    </div>
                    <h1 className="font-condensed font-black text-4xl text-white uppercase italic tracking-tighter leading-none mb-2">
                        {isLogin ? 'Welcome Back' : 'Join the Elite'}
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">
                        The ultimate sports intelligence platform.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-[#121212] border border-[#2C2C2C] rounded-2xl p-6 shadow-2xl">
                    
                    {(errorMessage || successMessage) && (
                        <div className="mb-4 text-center text-xs font-bold">
                            {errorMessage && <p className="text-red-400">{errorMessage}</p>}
                            {successMessage && <p className="text-emerald-400 mt-1">{successMessage}</p>}
                        </div>
                    )}

                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Display Name</label>
                                <input 
                                    type="text" 
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 pl-11 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-white text-black font-condensed font-black text-lg uppercase py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setErrorMessage(null); setSuccessMessage(null); }}
                            className="text-gray-500 text-sm hover:text-indigo-400 transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>

                {/* Guest Access */}
                <button 
                    onClick={handleGuestAccess}
                    className="mt-6 w-full py-3 text-gray-500 text-sm font-bold uppercase hover:text-white transition-colors"
                >
                    Continue as Guest
                </button>
            </div>
        </div>
    );
};
