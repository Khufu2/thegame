
import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { Mail, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const { login } = useSports();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            login(email);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#00FFB2]/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
                
                {/* Logo Area */}
                <div className="text-center mb-10">
                    <div className="inline-block px-4 py-2 border border-white/10 bg-white/5 rounded-full backdrop-blur-md mb-6">
                        <span className="font-condensed font-black text-2xl text-white italic tracking-tighter">SHEENA</span>
                        <span className="font-sans font-bold text-[#00FFB2]">SPORTS</span>
                    </div>
                    <h1 className="font-condensed font-black text-5xl text-white uppercase italic tracking-tighter leading-none mb-2">
                        {isLogin ? 'Welcome Back' : 'Join the Elite'}
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">
                        The ultimate sports intelligence platform.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-[#121212] border border-[#2C2C2C] rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-condensed font-black text-xl uppercase py-3.5 rounded-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                        >
                            {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={20} />
                        </button>

                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 text-white font-bold hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                     <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Powered by Pweza AI</span>
                </div>
            </div>
        </div>
    );
};
