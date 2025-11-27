
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Hash, Send, MoreVertical, Shield, Bell, MessageCircle, Heart, Share2, Plus, Image, BarChart2, Paperclip, Smile, Pin, X, CheckCircle2, Menu, TrendingUp, Zap, Flame, Trophy } from 'lucide-react';
import { useSports } from '../context/SportsContext';

// Mock Data
const COMMUNITY_DATA: Record<string, any> = {
    'c1': { 
        name: 'Gunners Talk', 
        topic: 'Arsenal FC & EPL', 
        members: '145K', 
        color: 'from-red-900 via-red-800 to-black',
        channels: [
            { id: 'general', name: 'general', type: 'text' },
            { id: 'transfers', name: 'transfers', type: 'text' },
            { id: 'matchday', name: 'matchday-live', type: 'text', active: true },
            { id: 'predictions', name: 'predictions', type: 'text' }
        ]
    },
    'c2': { 
        name: 'NBA Top Shot', 
        topic: 'NBA Trading & Highlights', 
        members: '82K', 
        color: 'from-blue-900 via-blue-800 to-black',
        channels: [
            { id: 'general', name: 'general', type: 'text' },
            { id: 'highlights', name: 'highlights', type: 'text', active: true },
            { id: 'marketplace', name: 'marketplace', type: 'text' }
        ]
    },
    'c3': { 
        name: 'FPL Grinders', 
        topic: 'Fantasy Premier League', 
        members: '210K', 
        color: 'from-green-900 via-green-800 to-black',
        channels: [
            { id: 'general', name: 'general', type: 'text' },
            { id: 'rate-my-team', name: 'rate-my-team', type: 'text', active: true },
            { id: 'price-changes', name: 'price-changes', type: 'text' }
        ]
    }
};

const MOCK_MESSAGES = [
    { id: 1, user: 'SakaLover7', avatar: 'https://ui-avatars.com/api/?name=SL&background=EF0107&color=fff', text: 'Did you see that pass? Absolutely unreal vision.', time: '14:02', role: 'MEMBER' },
    { id: 2, user: 'ArtetaBall', avatar: 'https://ui-avatars.com/api/?name=AB&background=023474&color=fff', text: 'We need to control the midfield better in the second half.', time: '14:03', role: 'ADMIN', badge: 'Admin' },
    { id: 3, user: 'Gunner4Life', avatar: 'https://ui-avatars.com/api/?name=G4&background=fff&color=000', text: 'Anyone got the xG stats so far?', time: '14:04', role: 'MEMBER' },
];

export const CommunityPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSports();
    
    // Safely retrieve community data with a fallback
    const community = COMMUNITY_DATA[id || 'c1'] || COMMUNITY_DATA['c1'];
    
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [input, setInput] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mock Live Match Data for "Matchday" channel
    const liveMatch = {
        home: 'Arsenal',
        away: 'Liverpool',
        score: '2-2',
        time: "88'",
        momentum: 75 // 75% Home momentum
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!input.trim()) return;
        const newMsg = {
            id: Date.now(),
            user: user?.name || 'Guest',
            avatar: user?.avatar || 'https://ui-avatars.com/api/?name=G&background=333&color=fff',
            text: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: user?.isPro ? 'PRO' : 'MEMBER'
        };
        setMessages([...messages, newMsg]);
        setInput('');
    };

    if (!community) return <div className="p-10 text-white">Community not found</div>;

    return (
        <div className="fixed inset-0 bg-[#000000] text-white z-[50] flex flex-col md:flex-row overflow-hidden font-sans h-[100dvh]">
            
            {/* SIDEBAR (Channels) */}
            <div className={`
                fixed md:relative inset-y-0 left-0 w-[280px] bg-[#0A0A0A] border-r border-[#2C2C2C] flex flex-col transition-transform duration-300 z-30
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Desktop Sidebar Header */}
                <div className="hidden md:flex h-[60px] items-center px-4 border-b border-[#2C2C2C]">
                    <button onClick={() => navigate(-1)} className="mr-3 text-gray-500 hover:text-white"><ArrowLeft size={20} /></button>
                    <h2 className="font-condensed font-black text-xl uppercase italic truncate">{community.name}</h2>
                </div>
                
                {/* Mobile Close Button */}
                <div className="md:hidden p-4 flex justify-between items-center bg-[#121212] border-b border-[#2C2C2C]">
                    <span className="font-condensed font-bold uppercase">Channels</span>
                    <button onClick={() => setSidebarOpen(false)}><X size={24} /></button>
                </div>

                {/* Channel List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Text Channels</div>
                    {community.channels?.map((ch: any) => (
                        <div key={ch.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${ch.active ? 'bg-[#1E1E1E] text-white' : 'text-gray-400 hover:bg-[#121212] hover:text-gray-300'}`}>
                            <Hash size={16} className="text-gray-600" />
                            <span className="font-bold text-sm">{ch.name}</span>
                            {ch.name === 'matchday-live' && <div className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                        </div>
                    ))}
                    
                    {/* Live Poll UI */}
                    <div className="mt-6 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Live Poll</div>
                    <div className="mx-2 p-3 bg-gradient-to-br from-[#121212] to-black border border-[#2C2C2C] rounded-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1">
                            <BarChart2 size={12} className="text-gray-600" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-300 mb-3">Next Goalscorer?</h4>
                        <div className="space-y-2">
                            <button className="w-full h-8 bg-[#1E1E1E] hover:bg-[#252525] rounded border border-[#333] flex items-center px-2 relative overflow-hidden group/btn">
                                <div className="absolute inset-y-0 left-0 bg-indigo-600/20 w-[65%] transition-all group-hover/btn:bg-indigo-600/30"></div>
                                <span className="relative z-10 text-[10px] font-bold text-white flex justify-between w-full">
                                    <span>Saka</span>
                                    <span>65%</span>
                                </span>
                            </button>
                            <button className="w-full h-8 bg-[#1E1E1E] hover:bg-[#252525] rounded border border-[#333] flex items-center px-2 relative overflow-hidden group/btn">
                                <div className="absolute inset-y-0 left-0 bg-gray-600/20 w-[35%] transition-all group-hover/btn:bg-gray-600/30"></div>
                                <span className="relative z-10 text-[10px] font-bold text-white flex justify-between w-full">
                                    <span>Havertz</span>
                                    <span>35%</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT COLUMN */}
            <div className="flex-1 flex flex-col h-full bg-[#000000] relative w-full">
                
                {/* HEADER (Sticky) */}
                <div className="h-[50px] md:h-[60px] border-b border-[#2C2C2C] flex items-center justify-between px-4 bg-[#0A0A0A]/90 backdrop-blur-md shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400">
                            <Menu size={24} />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Hash size={16} className="text-gray-400" />
                                <span className="font-bold text-white text-sm md:text-base">matchday-live</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase hidden md:block">{community.topic}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1.5 text-gray-400 bg-[#1E1E1E] px-2 py-1 rounded-full">
                             <Users size={14} />
                             <span className="text-[10px] font-bold">{community.members}</span>
                         </div>
                    </div>
                </div>

                {/* LIVE TICKER (Pinned for Matchday Channel) */}
                <div className="bg-black border-b border-[#2C2C2C] p-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-red-500 animate-pulse uppercase">Live</span>
                            <span className="text-xs font-bold text-white">{liveMatch.time}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-condensed font-black text-lg uppercase">{liveMatch.home}</span>
                            <span className="font-mono font-bold text-lg text-indigo-400">{liveMatch.score}</span>
                            <span className="font-condensed font-black text-lg uppercase">{liveMatch.away}</span>
                        </div>
                    </div>
                    {/* Momentum Meter */}
                    <div className="hidden sm:flex flex-col w-[120px]">
                        <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase mb-1">
                            <span className="text-indigo-400"><Zap size={10} className="inline"/> Pressure</span>
                            <span>{liveMatch.momentum}% Home</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#1E1E1E] rounded-full overflow-hidden flex">
                            <div style={{width: `${liveMatch.momentum}%`}} className="bg-indigo-500 transition-all duration-1000"></div>
                            <div className="flex-1 bg-gray-700"></div>
                        </div>
                    </div>
                </div>

                {/* SCROLLABLE MESSAGES AREA */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={containerRef}>
                    {/* Pinned Message */}
                    <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-lg p-3 flex items-start gap-3 mb-6">
                        <Pin size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="block text-xs font-bold text-indigo-300 uppercase mb-1">Pinned by Moderators</span>
                            <p className="text-sm text-indigo-100">Welcome to the match thread! Keep it civil. Prediction contest closes at halftime. 🏆</p>
                        </div>
                    </div>

                    {messages.map((msg: any) => (
                        msg && <div key={msg.id} className="group flex gap-3 animate-in slide-in-from-bottom-2">
                            <div 
                                className="w-9 h-9 rounded-full bg-gray-700 shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                                onClick={() => navigate(`/user/${msg.user}`)}
                            >
                                <img src={msg.avatar} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                    <span 
                                        className={`font-bold text-sm cursor-pointer hover:underline ${msg.role === 'ADMIN' ? 'text-red-400' : 'text-white'}`}
                                        onClick={() => navigate(`/user/${msg.user}`)}
                                    >
                                        {msg.user}
                                    </span>
                                    {msg.role === 'ADMIN' && <Shield size={10} className="text-red-400" />}
                                    {msg.role === 'PRO' && <Trophy size={10} className="text-yellow-400" />}
                                    <span className="text-[10px] text-gray-600">{msg.time}</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed break-words">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA (Sticky Bottom) */}
                <div className="shrink-0 p-3 bg-[#0A0A0A] border-t border-[#2C2C2C] safe-pb">
                    <div className="flex items-end gap-2 bg-[#1E1E1E] rounded-2xl p-2 border border-[#333] focus-within:border-gray-500 transition-colors">
                        <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2C2C2C] shrink-0">
                            <Plus size={20} />
                        </button>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Join the conversation..."
                            className="flex-1 bg-transparent max-h-[100px] py-2.5 text-sm text-white placeholder-gray-500 outline-none resize-none overflow-hidden"
                            rows={1}
                            style={{ minHeight: '40px' }}
                        />
                        <div className="flex items-center gap-1 shrink-0 pb-1">
                             {/* Only show send button when typing, otherwise show media options */}
                             {input.trim() ? (
                                <button onClick={handleSendMessage} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                                    <Send size={18} className="ml-0.5" />
                                </button>
                             ) : (
                                <>
                                    <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2C2C2C] hidden sm:block"><Image size={20} /></button>
                                    <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2C2C2C] hidden sm:block"><Smile size={20} /></button>
                                </>
                             )}
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
            )}
        </div>
    );
};
