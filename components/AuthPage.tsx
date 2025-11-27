
import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { Mail, ArrowRight, Lock, Eye, EyeOff, User, Phone, MessageCircle, ChevronDown, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// EXPANDED COUNTRY LIST
const COUNTRY_CODES = [
    // Major African Nations
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+27',  country: 'South Africa', flag: '🇿🇦' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+20',  country: 'Egypt', flag: '🇪🇬' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+221', country: 'Senegal', flag: '🇸🇳' },
    { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
    { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
    { code: '+260', country: 'Zambia', flag: '🇿🇲' },
    { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
    { code: '+225', country: 'Ivory Coast', flag: '🇨🇮' },
    // Global Major
    { code: '+1',   country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44',  country: 'UK', flag: '🇬🇧' },
    { code: '+91',  country: 'India', flag: '🇮🇳' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+33',  country: 'France', flag: '🇫🇷' },
    { code: '+49',  country: 'Germany', flag: '🇩🇪' },
    { code: '+34',  country: 'Spain', flag: '🇪🇸' },
    { code: '+55',  country: 'Brazil', flag: '🇧🇷' },
    { code: '+86',  country: 'China', flag: '🇨🇳' },
    { code: '+81',  country: 'Japan', flag: '🇯🇵' },
];

export const AuthPage: React.FC = () => {
    const { login, loginAsGuest } = useSports();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [authMethod, setAuthMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL'); // Default to EMAIL
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleGuestAccess = () => {
        loginAsGuest();
        navigate('/scores'); // Redirect to Matches page as requested
    };

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || !password) return;
        setIsLoading(true);

        setTimeout(() => {
            // LOGIN FLOW: Phone + Password -> Direct Login
            if (isLogin) {
                login(`${phone}@mobile.user`); // Simulate login
                setIsLoading(false);
            } 
            // SIGNUP FLOW: Phone + Password -> Request OTP
            else {
                setIsLoading(false);
                setShowOtpInput(true);
                alert(`OTP sent to WhatsApp: ${countryCode} ${phone}`);
            }
        }, 1500);
    };

    const handleOtpVerification = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            // Verify OTP -> Create Account
            login(`${phone}@mobile.user`);
            setIsLoading(false);
        }, 1500);
    }

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            login(email);
            setIsLoading(false);
        }, 1000);
    };

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
                    
                    {/* Method Toggle */}
                    <div className="flex bg-black rounded-lg p-1 mb-6 border border-[#333]">
                        <button 
                            onClick={() => { setAuthMethod('EMAIL'); setShowOtpInput(false); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold uppercase transition-all ${authMethod === 'EMAIL' ? 'bg-[#2C2C2C] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Mail size={14} /> Email
                        </button>
                        <button 
                            onClick={() => { setAuthMethod('PHONE'); setShowOtpInput(false); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold uppercase transition-all ${authMethod === 'PHONE' ? 'bg-[#2C2C2C] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Phone size={14} /> Phone
                        </button>
                    </div>

                    {/* PHONE AUTH FLOW */}
                    {authMethod === 'PHONE' && (
                        <form onSubmit={showOtpInput ? handleOtpVerification : handlePhoneSubmit} className="space-y-4">
                            {!showOtpInput ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">WhatsApp Number</label>
                                        <div className="flex gap-2">
                                            <div className="relative w-[130px]">
                                                <select 
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 pl-3 pr-8 text-white appearance-none focus:border-indigo-500 outline-none text-xs font-bold"
                                                >
                                                    {COUNTRY_CODES.map(c => (
                                                        <option key={c.code} value={c.code}>{c.flag} {c.country}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                            </div>
                                            <input 
                                                type="tel" 
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="712 345 678"
                                                className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
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

                                    {!isLogin && (
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <MessageCircle size={10} className="text-green-500" /> We'll verify this number via WhatsApp OTP.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-right">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">WhatsApp OTP Code</label>
                                    <input 
                                        type="text" 
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="0000"
                                        className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg py-3 px-4 text-white text-center tracking-[0.5em] font-black text-lg focus:outline-none focus:border-[#00FFB2] transition-colors"
                                        maxLength={4}
                                        autoFocus
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowOtpInput(false)}
                                        className="text-[10px] text-indigo-400 font-bold mt-2 hover:underline"
                                    >
                                        Wrong number? Go back.
                                    </button>
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#00FFB2] hover:bg-[#00E09E] text-black font-condensed font-black text-xl uppercase py-3.5 rounded-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : showOtpInput ? 'Verify & Create Account' : (isLogin ? 'Secure Login' : 'Send Verification Code')} 
                                {!isLoading && !showOtpInput && (isLogin ? <ArrowRight size={20}/> : <MessageCircle size={20} />)}
                                {!isLoading && showOtpInput && <ShieldCheck size={20} />}
                            </button>
                        </form>
                    )}

                    {/* EMAIL AUTH FLOW */}
                    {authMethod === 'EMAIL' && (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-condensed font-black text-xl uppercase py-3.5 rounded-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 disabled:opacity-50"
                            >
                                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')} <ArrowRight size={20} />
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                onClick={() => { setIsLogin(!isLogin); setShowOtpInput(false); }}
                                className="ml-2 text-white font-bold hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>

                    <div className="my-6 border-t border-[#333]"></div>

                    {/* GUEST MODE BUTTON */}
                    <button 
                        onClick={handleGuestAccess}
                        className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-condensed font-bold uppercase py-3 rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-colors"
                    >
                        <User size={16} /> Peek Inside (Guest Mode)
                    </button>

                </div>

                <div className="mt-8 text-center">
                     <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Powered by Pweza AI</span>
                </div>
            </div>
        </div>
    );
};
