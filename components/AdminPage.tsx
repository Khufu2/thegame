import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { NewsStory, SystemAlert, ArticleBlock, MatchStatus } from '../types';
import { generateMatchNews } from '../services/newsAgentService';
import { PenTool, Siren, Plus, Trash2, Layout, Image, MessageSquare, Twitter, Eye, Check, AlertTriangle, Wand2, RefreshCw, List, Globe, Send, Radio, UserPlus, Users, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
    const { addNewsStory, addSystemAlert, deleteNewsStory, deleteSystemAlert, user, matches, news, alerts } = useSports();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'NEWS' | 'WAR_ROOM' | 'AI_AGENT' | 'MANAGE' | 'TEAM'>('NEWS');

    // --- NEWS STATE ---
    const [newsTitle, setNewsTitle] = useState('');
    const [newsSummary, setNewsSummary] = useState('');
    const [newsImage, setNewsImage] = useState('https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000&auto=format&fit=crop');
    const [newsTag, setNewsTag] = useState('NBA');
    const [blocks, setBlocks] = useState<ArticleBlock[]>([]);
    
    // --- ALERT STATE ---
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDesc, setAlertDesc] = useState('');
    const [alertData, setAlertData] = useState('');
    const [alertLeague, setAlertLeague] = useState('NFL');
    const [alertType, setAlertType] = useState<SystemAlert['alertType']>('SHARP_MONEY');
    const [broadcastToBots, setBroadcastToBots] = useState(true);

    // --- AI AGENT STATE ---
    const [generationMode, setGenerationMode] = useState<'MATCH' | 'TOPIC'>('MATCH');
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [aiTone, setAiTone] = useState<'HYPE' | 'RECAP' | 'ANALYTICAL' | 'RUMOR'>('RECAP');
    const [aiLanguage, setAiLanguage] = useState<'ENGLISH' | 'SWAHILI'>('ENGLISH');
    const [aiPersona, setAiPersona] = useState<'SHEENA' | 'ORACLE' | 'STREET' | 'JOURNALIST'>('SHEENA'); // NEW
    const [useGrounding, setUseGrounding] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- TEAM MANAGEMENT STATE ---
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('JOURNALIST');

    if (!user?.isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-white uppercase">Access Denied</h1>
                    <p className="text-gray-500">You do not have clearance for the Command Center.</p>
                    <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-[#1E1E1E] text-white rounded">Return Home</button>
                </div>
            </div>
        );
    }

    const handleAddBlock = (type: ArticleBlock['type']) => {
        let newBlock: ArticleBlock;
        if (type === 'TEXT') newBlock = { type: 'TEXT', content: '' };
        else if (type === 'QUOTE') newBlock = { type: 'QUOTE', text: '', author: '' };
        else if (type === 'TWEET') newBlock = { type: 'TWEET', id: Date.now().toString(), author: 'Twitter User', handle: '@handle', text: '' };
        else return;
        
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (index: number, field: string, value: string) => {
        const newBlocks = [...blocks];
        (newBlocks[index] as any)[field] = value;
        setBlocks(newBlocks);
    };

    const removeBlock = (index: number) => {
        setBlocks(blocks.filter((_, i) => i !== index));
    };

    const publishNews = () => {
        const story: NewsStory = {
            id: `news_${Date.now()}`,
            type: 'NEWS',
            title: newsTitle,
            summary: newsSummary,
            imageUrl: newsImage,
            source: aiPersona === 'ORACLE' ? 'The Oracle' : 'Sheena Desk', // Dynamic source
            timestamp: 'Just Now',
            likes: 0,
            comments: 0,
            tags: [newsTag],
            contentBlocks: blocks
        };
        addNewsStory(story);
        window.alert('Story Published to Feed');
        navigate('/');
    };

    const publishAlert = () => {
        const newAlert: SystemAlert = {
            id: `alert_${Date.now()}`,
            type: 'SYSTEM_ALERT',
            alertType: alertType,
            title: alertTitle,
            description: alertDesc,
            dataPoint: alertData,
            league: alertLeague,
            timestamp: 'Just Now',
            signalStrength: 'HIGH'
        };
        // Pass broadcast flag to context (simulating backend trigger)
        addSystemAlert(newAlert); 
        
        let msg = 'Alert Broadcasted to War Room';
        if (broadcastToBots) msg += ' & Pushed to Telegram/WhatsApp';
        window.alert(msg);
        navigate('/');
    };

    const handleAIGeneration = async () => {
        let match = null;
        if (generationMode === 'MATCH') {
            match = matches.find(m => m.id === selectedMatchId) || null;
            if (!match) return;
        } else if (generationMode === 'TOPIC' && !customTopic) {
            return;
        }

        setIsGenerating(true);
        const result = await generateMatchNews(match, customTopic, aiTone, aiLanguage, aiPersona, useGrounding);
        setIsGenerating(false);

        if (result) {
            setNewsTitle(result.title);
            setNewsSummary(result.summary);
            setBlocks(result.blocks);
            setNewsTag(match ? match.league : 'General');
            setActiveTab('NEWS'); // Switch to editor to review
        } else {
            window.alert("Failed to generate article. Check API Key or try again.");
        }
    };

    const handleSendInvite = () => {
        alert(`Invite sent to ${inviteEmail} as ${inviteRole}`);
        setInviteEmail('');
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-24 font-sans">
            
            {/* HEADER */}
            <div className="sticky top-0 z-40 bg-[#121212] border-b border-[#2C2C2C] h-[60px] flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                        <Siren size={18} className="text-white" />
                    </div>
                    <span className="font-condensed font-black text-xl uppercase tracking-tighter italic">Command Center</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('NEWS')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded ${activeTab === 'NEWS' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>News Desk</button>
                    <button onClick={() => setActiveTab('AI_AGENT')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 ${activeTab === 'AI_AGENT' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}><Wand2 size={12}/> AI Agent</button>
                    <button onClick={() => setActiveTab('WAR_ROOM')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded ${activeTab === 'WAR_ROOM' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>War Room</button>
                    <button onClick={() => setActiveTab('MANAGE')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 ${activeTab === 'MANAGE' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}><List size={12}/> Manage</button>
                    <button onClick={() => setActiveTab('TEAM')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 ${activeTab === 'TEAM' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}><Users size={12}/> Team</button>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* --- TEAM MANAGEMENT --- */}
                {activeTab === 'TEAM' && (
                    <div className="col-span-2">
                        <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-6 flex items-center gap-2">
                             <Users size={16} /> Staff Management
                        </h3>
                        
                        {/* Invite Card */}
                        <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 mb-8">
                            <h4 className="font-bold text-white mb-4 uppercase text-sm">Add New Member</h4>
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        value={inviteEmail} 
                                        onChange={e => setInviteEmail(e.target.value)} 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-sm text-white" 
                                        placeholder="journalist@sheena.com" 
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                                    <select 
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value)}
                                        className="w-full bg-black border border-[#333] p-3 rounded text-sm text-white uppercase"
                                    >
                                        <option value="JOURNALIST">Journalist</option>
                                        <option value="MODERATOR">Moderator</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <button onClick={handleSendInvite} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded flex items-center gap-2 font-bold uppercase text-sm">
                                    <UserPlus size={16} /> Invite
                                </button>
                            </div>
                        </div>

                        {/* Current Staff List (Mock) */}
                        <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-black text-gray-500 font-bold uppercase text-xs border-b border-[#2C2C2C]">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2C2C2C]">
                                    <tr>
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">JD</div>
                                            <span className="font-bold text-white">John Doe</span>
                                        </td>
                                        <td className="p-4"><span className="bg-green-900/30 text-green-500 px-2 py-0.5 rounded text-xs font-bold uppercase">Admin</span></td>
                                        <td className="p-4 text-right"><button className="text-gray-500 hover:text-white">Edit</button></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">AL</div>
                                            <span className="font-bold text-white">Alice Lee</span>
                                        </td>
                                        <td className="p-4"><span className="bg-blue-900/30 text-blue-500 px-2 py-0.5 rounded text-xs font-bold uppercase">Journalist</span></td>
                                        <td className="p-4 text-right"><button className="text-gray-500 hover:text-white">Edit</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- MANAGE EXISTING CONTENT --- */}
                {activeTab === 'MANAGE' && (
                    <div className="col-span-2">
                         <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-6 flex items-center gap-2">
                             <List size={16} /> Active Content
                         </h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* News List */}
                             <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                 <h4 className="text-sm font-bold text-white mb-4 uppercase border-b border-[#333] pb-2">Active News Stories</h4>
                                 <div className="space-y-2">
                                     {news.map(story => (
                                         <div key={story.id} className="flex justify-between items-center bg-black p-3 rounded border border-[#333]">
                                             <div className="flex-1 overflow-hidden">
                                                 <span className="block text-sm font-bold text-white truncate">{story.title}</span>
                                                 <span className="text-xs text-gray-500 uppercase">{story.tags?.[0]} • {story.timestamp}</span>
                                             </div>
                                             <button 
                                                 onClick={() => { if(confirm('Delete this story?')) deleteNewsStory(story.id) }}
                                                 className="ml-3 p-2 text-red-500 hover:bg-red-900/20 rounded"
                                             >
                                                 <Trash2 size={16} />
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             {/* Alerts List */}
                             <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                 <h4 className="text-sm font-bold text-white mb-4 uppercase border-b border-[#333] pb-2">Active War Room Alerts</h4>
                                 <div className="space-y-2">
                                     {alerts.map(alert => (
                                         <div key={alert.id} className="flex justify-between items-center bg-black p-3 rounded border border-[#333]">
                                             <div className="flex-1 overflow-hidden">
                                                 <span className="block text-sm font-bold text-red-500 truncate">{alert.title}</span>
                                                 <span className="text-xs text-gray-500 uppercase">{alert.alertType} • {alert.league}</span>
                                             </div>
                                             <button 
                                                 onClick={() => { if(confirm('Delete this alert?')) deleteSystemAlert(alert.id) }}
                                                 className="ml-3 p-2 text-red-500 hover:bg-red-900/20 rounded"
                                             >
                                                 <Trash2 size={16} />
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                    </div>
                )}

                {/* --- AI AGENT WORKFLOW --- */}
                {activeTab === 'AI_AGENT' && (
                     <div className="col-span-2 max-w-[600px] mx-auto w-full">
                         <div className="bg-[#121212] border border-indigo-500/50 rounded-xl p-6 shadow-2xl shadow-indigo-900/20">
                             <div className="flex items-center gap-3 mb-6">
                                 <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                                     <Wand2 size={20} className="text-white" />
                                 </div>
                                 <div>
                                     <h3 className="font-condensed font-black text-2xl uppercase text-white leading-none">Sheena Agent</h3>
                                     <p className="text-xs text-indigo-400">Automated Content Generation</p>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                 {/* Mode Selector */}
                                 <div className="flex bg-black rounded p-1 border border-[#333]">
                                     <button onClick={() => setGenerationMode('MATCH')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${generationMode === 'MATCH' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}>Match Analysis</button>
                                     <button onClick={() => setGenerationMode('TOPIC')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${generationMode === 'TOPIC' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}>Custom Topic</button>
                                 </div>

                                 {generationMode === 'MATCH' ? (
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Match</label>
                                         <select 
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                            value={selectedMatchId}
                                            onChange={(e) => setSelectedMatchId(e.target.value)}
                                         >
                                             <option value="">-- Choose a Game --</option>
                                             {matches.map(m => (
                                                 <option key={m.id} value={m.id}>
                                                     {m.homeTeam.name} vs {m.awayTeam.name} ({m.status})
                                                 </option>
                                             ))}
                                         </select>
                                     </div>
                                 ) : (
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custom Topic</label>
                                         <input 
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                            placeholder="e.g., Nigeria Premier League Results, AFCON Qualifiers..."
                                            value={customTopic}
                                            onChange={(e) => setCustomTopic(e.target.value)}
                                         />
                                     </div>
                                 )}

                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tone</label>
                                         <select 
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                            value={aiTone}
                                            onChange={(e) => setAiTone(e.target.value as any)}
                                         >
                                             <option value="RECAP">Standard Recap</option>
                                             <option value="HYPE">Hype / Viral</option>
                                             <option value="ANALYTICAL">Analytical / Deep Dive</option>
                                             <option value="RUMOR">Rumor / Speculation</option>
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Language</label>
                                         <select 
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                            value={aiLanguage}
                                            onChange={(e) => setAiLanguage(e.target.value as any)}
                                         >
                                             <option value="ENGLISH">English (US)</option>
                                             <option value="SWAHILI">Swahili / Sheng</option>
                                         </select>
                                     </div>
                                 </div>

                                 {/* Persona Selector */}
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Agent Persona</label>
                                     <select 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                        value={aiPersona}
                                        onChange={(e) => setAiPersona(e.target.value as any)}
                                     >
                                         <option value="SHEENA">Sheena (Professional Analyst)</option>
                                         <option value="ORACLE">The Oracle (Cryptic/Wise)</option>
                                         <option value="STREET">Street Hype (Energetic/Slang)</option>
                                         <option value="JOURNALIST">Standard Journalist (Neutral)</option>
                                     </select>
                                 </div>

                                 {/* Grounding Toggle */}
                                 <div className="flex items-center gap-3 p-3 bg-black rounded border border-[#333] cursor-pointer" onClick={() => setUseGrounding(!useGrounding)}>
                                     <div className={`w-4 h-4 rounded-full border border-[#555] flex items-center justify-center ${useGrounding ? 'bg-indigo-600 border-indigo-500' : ''}`}>
                                         {useGrounding && <Check size={10} className="text-white" />}
                                     </div>
                                     <div>
                                         <span className="block text-sm font-bold text-white">Google Search Grounding</span>
                                         <span className="text-[10px] text-gray-500">Fetch real-time stats/quotes from web (Simulated)</span>
                                     </div>
                                     <Globe size={16} className={`ml-auto ${useGrounding ? 'text-indigo-500' : 'text-gray-600'}`} />
                                 </div>

                                 <button 
                                     onClick={handleAIGeneration}
                                     disabled={isGenerating || (generationMode === 'MATCH' && !selectedMatchId) || (generationMode === 'TOPIC' && !customTopic)}
                                     className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-condensed font-black text-xl uppercase rounded flex items-center justify-center gap-2 mt-4"
                                 >
                                     {isGenerating ? <RefreshCw className="animate-spin" /> : <Wand2 />}
                                     {isGenerating ? 'Generating...' : 'Generate Article'}
                                 </button>
                             </div>
                         </div>
                     </div>
                )}

                {/* --- NEWS EDITOR --- */}
                {activeTab === 'NEWS' && (
                    <>
                        <div className="space-y-6">
                            <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-4 flex items-center gap-2">
                                    <PenTool size={16} /> Story Details
                                </h3>
                                <div className="space-y-4">
                                    <input 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-lg font-bold placeholder-gray-600 focus:border-indigo-500 outline-none" 
                                        placeholder="Headline (e.g., Lakers acquire Kyrie)"
                                        value={newsTitle}
                                        onChange={e => setNewsTitle(e.target.value)}
                                    />
                                    <textarea 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-sm placeholder-gray-600 focus:border-indigo-500 outline-none h-24 resize-none" 
                                        placeholder="Short summary for the feed card..."
                                        value={newsSummary}
                                        onChange={e => setNewsSummary(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 bg-black border border-[#333] p-3 rounded text-sm placeholder-gray-600" 
                                            placeholder="Image URL"
                                            value={newsImage}
                                            onChange={e => setNewsImage(e.target.value)}
                                        />
                                        <select 
                                            className="bg-black border border-[#333] p-3 rounded text-sm font-bold uppercase"
                                            value={newsTag}
                                            onChange={e => setNewsTag(e.target.value)}
                                        >
                                            <option>NFL</option>
                                            <option>NBA</option>
                                            <option>EPL</option>
                                            <option>UFC</option>
                                            <option>General</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 flex items-center gap-2">
                                        <Layout size={16} /> Content Blocks
                                    </h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAddBlock('TEXT')} className="p-2 bg-[#1E1E1E] hover:bg-[#333] rounded"><MessageSquare size={14} /></button>
                                        <button onClick={() => handleAddBlock('QUOTE')} className="p-2 bg-[#1E1E1E] hover:bg-[#333] rounded"><MessageSquare size={14} className="rotate-180" /></button>
                                        <button onClick={() => handleAddBlock('TWEET')} className="p-2 bg-[#1E1E1E] hover:bg-[#333] rounded"><Twitter size={14} /></button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    {blocks.map((block, idx) => (
                                        <div key={idx} className="bg-black border border-[#333] p-3 rounded relative group">
                                            <button onClick={() => removeBlock(idx)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                            
                                            {block.type === 'TEXT' && (
                                                <textarea 
                                                    className="w-full bg-transparent text-sm text-gray-300 outline-none resize-none h-20" 
                                                    placeholder="Write paragraph..."
                                                    value={block.content}
                                                    onChange={e => updateBlock(idx, 'content', e.target.value)}
                                                />
                                            )}

                                            {block.type === 'QUOTE' && (
                                                <div className="flex flex-col gap-2">
                                                    <input 
                                                        className="bg-transparent text-lg font-serif italic text-white outline-none" 
                                                        placeholder="Quote text..."
                                                        value={block.text}
                                                        onChange={e => updateBlock(idx, 'text', e.target.value)}
                                                    />
                                                    <input 
                                                        className="bg-transparent text-xs font-bold uppercase text-gray-500 outline-none" 
                                                        placeholder="Author Name"
                                                        value={block.author}
                                                        onChange={e => updateBlock(idx, 'author', e.target.value)}
                                                    />
                                                </div>
                                            )}

                                             {block.type === 'TWEET' && (
                                                <div className="flex flex-col gap-2">
                                                     <div className="flex gap-2">
                                                        <input className="bg-transparent text-xs font-bold text-blue-400 outline-none w-1/2" placeholder="@handle" value={block.handle} onChange={e => updateBlock(idx, 'handle', e.target.value)} />
                                                        <input className="bg-transparent text-xs font-bold text-gray-400 outline-none w-1/2" placeholder="Author" value={block.author} onChange={e => updateBlock(idx, 'author', e.target.value)} />
                                                     </div>
                                                    <textarea 
                                                        className="w-full bg-transparent text-sm text-white outline-none resize-none h-16" 
                                                        placeholder="Tweet content..."
                                                        value={block.text}
                                                        onChange={e => updateBlock(idx, 'text', e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {blocks.length === 0 && <div className="text-center text-gray-600 text-xs py-4">No content blocks added. Use AI Agent or add manually.</div>}
                                </div>
                            </div>
                        </div>

                        {/* PREVIEW */}
                        <div>
                             <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <Eye size={16} /> Live Preview
                            </h3>
                            <div className="bg-white text-black rounded-xl overflow-hidden shadow-xl">
                                <div className="h-48 bg-gray-200">
                                    <img src={newsImage} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6">
                                    <h1 className="font-condensed font-black text-3xl uppercase leading-none mb-3">{newsTitle || 'Headline'}</h1>
                                    <p className="font-serif text-lg leading-relaxed text-gray-800">{blocks[0]?.type === 'TEXT' ? blocks[0].content : newsSummary}</p>
                                </div>
                            </div>
                            <button onClick={publishNews} className="w-full mt-6 py-4 bg-[#00FFB2] hover:bg-[#00E09E] text-black font-condensed font-black text-xl uppercase rounded flex items-center justify-center gap-2">
                                <Check size={20} /> Publish Story
                            </button>
                        </div>
                    </>
                )}

                {/* --- WAR ROOM CONSOLE --- */}
                {activeTab === 'WAR_ROOM' && (
                    <>
                        <div className="space-y-6">
                            <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                <h3 className="font-condensed font-bold text-lg uppercase text-red-500 mb-4 flex items-center gap-2">
                                    <AlertTriangle size={16} /> Alert Configuration
                                </h3>
                                <div className="space-y-4">
                                    <select 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-sm font-bold uppercase text-white"
                                        value={alertType}
                                        onChange={e => setAlertType(e.target.value as any)}
                                    >
                                        <option value="SHARP_MONEY">Sharp Money Influx</option>
                                        <option value="LINE_MOVE">Line Movement</option>
                                        <option value="INJURY_CRITICAL">Critical Injury</option>
                                    </select>
                                    
                                    <input 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-lg font-bold placeholder-gray-600 focus:border-red-500 outline-none" 
                                        placeholder="Title (e.g., Heavy Steam on Bills)"
                                        value={alertTitle}
                                        onChange={e => setAlertTitle(e.target.value)}
                                    />
                                    
                                    <div className="flex gap-2">
                                        <input 
                                            className="w-2/3 bg-black border border-[#333] p-3 rounded text-sm placeholder-gray-600" 
                                            placeholder="Data Point (e.g., 90% Money)"
                                            value={alertData}
                                            onChange={e => setAlertData(e.target.value)}
                                        />
                                        <select 
                                            className="w-1/3 bg-black border border-[#333] p-3 rounded text-sm font-bold uppercase"
                                            value={alertLeague}
                                            onChange={e => setAlertLeague(e.target.value)}
                                        >
                                            <option>NFL</option>
                                            <option>NBA</option>
                                            <option>EPL</option>
                                        </select>
                                    </div>

                                    <textarea 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-sm placeholder-gray-600 focus:border-red-500 outline-none h-24 resize-none" 
                                        placeholder="Detailed analysis for the sharps..."
                                        value={alertDesc}
                                        onChange={e => setAlertDesc(e.target.value)}
                                    />
                                    
                                    {/* Bot Broadcast Toggle */}
                                    <div className="flex items-center gap-3 p-3 bg-red-900/10 border border-red-500/20 rounded cursor-pointer" onClick={() => setBroadcastToBots(!broadcastToBots)}>
                                        <div className={`w-4 h-4 rounded-full border border-[#555] flex items-center justify-center ${broadcastToBots ? 'bg-red-600 border-red-500' : ''}`}>
                                             {broadcastToBots && <Check size={10} className="text-white" />}
                                        </div>
                                        <div>
                                             <span className="block text-sm font-bold text-white">Broadcast to Bots</span>
                                             <span className="text-[10px] text-gray-500">Push this alert to Telegram & WhatsApp Groups</span>
                                        </div>
                                        <Send size={16} className={`ml-auto ${broadcastToBots ? 'text-red-500' : 'text-gray-600'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PREVIEW */}
                        <div>
                             <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <Eye size={16} /> Terminal Preview
                            </h3>
                            <div className="bg-black border border-red-500/50 rounded p-4 font-mono relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase">
                                    War Room Alert
                                </div>
                                <div className="flex items-start gap-3 relative z-10">
                                    <AlertTriangle size={20} className="text-red-500 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-red-500 text-sm uppercase mb-1">{alertTitle || 'Alert Title'}</h4>
                                        <p className="text-xs text-gray-300 mb-2 leading-relaxed">{alertDesc || 'Description of the sharp action...'}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold bg-[#1E1E1E] text-white px-1.5 py-0.5 rounded border border-[#333]">
                                                {alertData || 'Data'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={publishAlert} className="w-full mt-6 py-4 bg-red-600 hover:bg-red-500 text-white font-condensed font-black text-xl uppercase rounded flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">
                                <Siren size={20} /> Broadcast Alert
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};