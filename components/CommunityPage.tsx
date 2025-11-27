
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Hash, Send, MoreVertical, Shield, Bell, MessageCircle, Heart, Share2, Plus, Image, BarChart2, Paperclip, Smile, Pin, X, CheckCircle2, Menu } from 'lucide-react';
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
    const community = COMMUNITY_DATA[id || 'c1'] || COMMUNITY_DATA['c1'];
    
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [input, setInput] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer state
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="fixed inset-0 bg-[#050505] text-white z-[50] flex flex-col md:flex-row overflow-hidden font-sans">
            
            {/* MOBILE HEADER */}
            <div className="md:hidden h-[60px] bg-[#121212] border-b border-[#2C2C2C] flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
                    <span className="font-condensed font-bold text-lg uppercase truncate">{community.name}</span>
                </div>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-[#2C2C2C] rounded-md">
                    <Menu size={20} />
                </button>
            </div>

            {/* SIDEBAR (Channels) - Desktop & Mobile Drawer */}
            <div className={`
                fixed md:relative inset-y-0 left-0 w-[280px] bg-[#0A0A0A] border-r border-[#2C2C2C] flex flex-col transition-transform duration-300 z-30
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Header (Desktop) */}
                <div className="hidden md:flex h-[60px] items-center px-4 border-b border-[#2C2C2C]">
                    <button onClick={() => navigate(-1)} className="mr-3 text-gray-500 hover:text-white"><ArrowLeft size={20} /></button>
                    <h2 className="font-condensed font-black text-xl uppercase italic">{community.name}</h2>
                </div>
                
                {/* Mobile Close Button */}
                <div className="md:hidden p-4 flex justify-end">
                    <button onClick={() => setSidebarOpen(false)}><X size={24} /></button>
                </div>

                {/* Channel List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Text Channels</div>
                    {community.channels.map((ch: any) => (
                        <div key={ch.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${ch.active ? 'bg-[#1E1E1E] text-white' : 'text-gray-400 hover:bg-[#121212] hover:text-gray-300'}`}>
                            <Hash size={16} className="text-gray-600" />
                            <span className="font-bold text-sm">{ch.name}</span>
                        </div>
                    ))}
                    
                    <div className="mt-6 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Active Polls</div>
                    <div className="mx-2 p-3 bg-gradient-to-br from-indigo-900/20 to-black border border-indigo-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                             <BarChart2 size={14} className="text-indigo-400" />
                             <span className="text-xs font-bold text-indigo-300">MOTM Prediction?</span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-6 bg-indigo-900/40 rounded flex items-center px-2 text-[10px] font-bold relative overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-indigo-600/50 w-[70%]"></div>
                                <span className="relative z-10">Saka (70%)</span>
                            </div>
                            <div className="h-6 bg-gray-800 rounded flex items-center px-2 text-[10px] font-bold relative overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gray-600/50 w-[30%]"></div>
                                <span className="relative z-10">Odegaard (30%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Status Footer */}
                <div className="p-4 bg-[#121212] border-t border-[#2C2C2C] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs border border-white/20">
                        {user ? user.name.substring(0,2).toUpperCase() : 'G'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <span className="block font-bold text-sm truncate">{user ? user.name : 'Guest'}</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="flex-1 flex flex-col bg-[#000000] relative">
                
                {/* Chat Header */}
                <div className="h-[60px] border-b border-[#2C2C2C] flex items-center justify-between px-6 bg-[#0A0A0A]/90 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2">
                        <Hash size={20} className="text-gray-400" />
                        <span className="font-bold text-white">matchday-live</span>
                        <span className="text-gray-600 text-sm hidden sm:inline">| {community.topic}</span>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2 text-gray-400 bg-[#1E1E1E] px-3 py-1.5 rounded-full">
                             <Users size={16} />
                             <span className="text-xs font-bold">{community.members}</span>
                         </div>
                         <Bell size={20} className="text-gray-500 hover:text-white cursor-pointer" />
                         <Shield size={20} className="text-gray-500 hover:text-white cursor-pointer" />
                    </div>
                </div>

                {/* Pinned Message */}
                <div className="bg-indigo-900/10 border-b border-indigo-500/20 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                        <Pin size={12} />
                        <span>Pinned: Keep it civil. No spamming links. Enjoy the game!</span>
                    </div>
                    <X size={12} className="text-indigo-400/50 cursor-pointer" />
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {messages.map((msg: any) => (
                        <div key={msg.id} className="group flex gap-4 animate-in slide-in-from-bottom-2">
                            <div 
                                className="w-10 h-10 rounded-full bg-gray-700 shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                                onClick={() => navigate(`/user/${msg.user}`)}
                            >
                                <img src={msg.avatar} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span 
                                        className="font-bold text-white hover:underline cursor-pointer"
                                        onClick={() => navigate(`/user/${msg.user}`)}
                                    >
                                        {msg.user}
                                    </span>
                                    {msg.role === 'ADMIN' && <span className="bg-indigo-500 text-white text-[9px] font-bold px-1 rounded uppercase flex items-center gap-0.5"><Shield size={8} /> Admin</span>}
                                    {msg.role === 'PRO' && <span className="bg-yellow-500 text-black text-[9px] font-bold px-1 rounded uppercase">Pro</span>}
                                    <span className="text-[10px] text-gray-500">{msg.time}</span>
                                </div>
                                <p className="text-gray-300 text-[15px] leading-relaxed break-words">{msg.text}</p>
                                
                                {/* Message Actions */}
                                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 hover:bg-[#1E1E1E] rounded text-gray-500 hover:text-pink-500"><Heart size={14} /></button>
                                    <button className="p-1 hover:bg-[#1E1E1E] rounded text-gray-500 hover:text-blue-500"><MessageCircle size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#0A0A0A] border-t border-[#2C2C2C]">
                    <div className="bg-[#1E1E1E] rounded-xl flex items-center p-2 border border-[#333] focus-within:border-gray-500 transition-colors">
                        <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2C2C2C]"><Plus size={20} /></button>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={`Message #${community.channels.find((c: any) => c.active)?.name || 'general'}`}
                            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-gray-500 outline-none"
                        />
                        <div className="flex items-center gap-1 pr-2">
                            <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2C2C2C] hidden sm:block"><Image size={20} /></button>
                            <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2C2C2C] hidden sm:block"><Smile size={20} /></button>
                            {input.trim() && (
                                <button onClick={handleSendMessage} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors ml-2">
                                    <Send size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black/80 z-20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
            )}
        </div>
    );
};
