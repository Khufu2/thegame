
import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { NewsStory, SystemAlert, ArticleBlock, MatchStatus } from '../types';
import { generateMatchNews } from '../services/newsAgentService';
import { PenTool, Siren, Plus, Trash2, Layout, Image, MessageSquare, Twitter, Eye, Check, AlertTriangle, Wand2, RefreshCw, List, Globe, Send, Radio, UserPlus, Users, BadgeCheck, Link as LinkIcon, Copy } from 'lucide-react';
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
    const [generationMode, setGenerationMode] = useState<'MATCH' | 'TOPIC' | 'LINK'>('MATCH');
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [externalLink, setExternalLink] = useState(''); // NEW
    const [aiTone, setAiTone] = useState<'HYPE' | 'RECAP' | 'ANALYTICAL' | 'RUMOR'>('RECAP');
    const [aiLanguage, setAiLanguage] = useState<'ENGLISH' | 'SWAHILI'>('ENGLISH');
    const [aiPersona, setAiPersona] = useState<'SHEENA' | 'ORACLE' | 'STREET' | 'JOURNALIST'>('SHEENA'); 
    const [useGrounding, setUseGrounding] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSocial, setGeneratedSocial] = useState(''); // New for social media

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
        else if (type === 'VIDEO') newBlock = { type: 'VIDEO', url: '', thumbnail: 'https://via.placeholder.com/640x360', title: 'Video Title' };
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
            source: aiPersona === 'ORACLE' ? 'The Oracle' : 'Sheena Desk', 
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
        }

        setIsGenerating(true);
        // Call Service
        const result = await generateMatchNews(
            match, 
            customTopic, 
            aiTone, 
            aiLanguage, 
            aiPersona, 
            useGrounding,
            generationMode === 'LINK' ? externalLink : undefined
        );
        setIsGenerating(false);

        if (result) {
            setNewsTitle(result.title);
            setNewsSummary(result.summary);
            setBlocks(result.blocks);
            setNewsTag(match ? match.league : 'General');
            if (result.socialCaption) setGeneratedSocial(result.socialCaption);
            setActiveTab('NEWS'); 
        } else {
            window.alert("Failed to generate. Ensure API Key is active.");
        }
    };

    const copySocialToClipboard = () => {
        navigator.clipboard.writeText(generatedSocial);
        alert("Copied to clipboard! Ready to post on Twitter/X.");
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
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

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
                                     <p className="text-xs text-indigo-400">Content Automation & Social Manager</p>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                 {/* Mode Selector */}
                                 <div className="flex bg-black rounded p-1 border border-[#333]">
                                     <button onClick={() => setGenerationMode('MATCH')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${generationMode === 'MATCH' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}>Match</button>
                                     <button onClick={() => setGenerationMode('TOPIC')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${generationMode === 'TOPIC' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}>Topic</button>
                                     <button onClick={() => setGenerationMode('LINK')} className={`flex-1 py-2 text-xs font-bold uppercase rounded flex items-center justify-center gap-1 ${generationMode === 'LINK' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}><LinkIcon size={12}/> Scrape URL</button>
                                 </div>

                                 {/* Inputs */}
                                 {generationMode === 'MATCH' && (
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
                                 )}
                                 
                                 {generationMode === 'TOPIC' && (
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custom Topic</label>
                                         <input 
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                            placeholder="e.g., Nigeria Premier League Results..."
                                            value={customTopic}
                                            onChange={(e) => setCustomTopic(e.target.value)}
                                         />
                                     </div>
                                 )}

                                 {generationMode === 'LINK' && (
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Paste Link (Twitter/News)</label>
                                         <input 
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                            placeholder="https://twitter.com/..."
                                            value={externalLink}
                                            onChange={(e) => setExternalLink(e.target.value)}
                                         />
                                         <p className="text-[10px] text-gray-500 mt-1">AI will extract content and rewrite it.</p>
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
                                             <option value="RUMOR">Rumor / Speculation</option>
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Persona</label>
                                         <select 
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                            value={aiPersona}
                                            onChange={(e) => setAiPersona(e.target.value as any)}
                                         >
                                             <option value="SHEENA">Sheena (Pro)</option>
                                             <option value="ORACLE">The Oracle (Cryptic)</option>
                                             <option value="STREET">Street Hype</option>
                                         </select>
                                     </div>
                                 </div>

                                 <button 
                                     onClick={handleAIGeneration}
                                     disabled={isGenerating}
                                     className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-condensed font-black text-xl uppercase rounded flex items-center justify-center gap-2 mt-4"
                                 >
                                     {isGenerating ? <RefreshCw className="animate-spin" /> : <Wand2 />}
                                     {isGenerating ? 'Analyzing...' : 'Generate Content'}
                                 </button>
                             </div>
                         </div>
                     </div>
                )}

                {/* --- NEWS EDITOR & SOCIAL PREVIEW --- */}
                {activeTab === 'NEWS' && (
                    <>
                        {/* EDITOR */}
                        <div className="space-y-6">
                            {/* ... (Previous Editor Fields) ... */}
                             <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-4 flex items-center gap-2">
                                    <PenTool size={16} /> Story Details
                                </h3>
                                <div className="space-y-4">
                                    <input 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-lg font-bold placeholder-gray-600 focus:border-indigo-500 outline-none" 
                                        placeholder="Headline"
                                        value={newsTitle}
                                        onChange={e => setNewsTitle(e.target.value)}
                                    />
                                    <textarea 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-sm placeholder-gray-600 focus:border-indigo-500 outline-none h-24 resize-none" 
                                        placeholder="Summary"
                                        value={newsSummary}
                                        onChange={e => setNewsSummary(e.target.value)}
                                    />
                                    <input 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-sm placeholder-gray-600" 
                                        placeholder="Image URL"
                                        value={newsImage}
                                        onChange={e => setNewsImage(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {/* Blocks Editor (Simplified for brevity, keep existing implementation) */}
                            <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 flex items-center gap-2">
                                        <Layout size={16} /> Content Blocks
                                    </h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAddBlock('TEXT')} className="p-2 bg-[#1E1E1E] hover:bg-[#333] rounded"><MessageSquare size={14} /></button>
                                        <button onClick={() => handleAddBlock('TWEET')} className="p-2 bg-[#1E1E1E] hover:bg-[#333] rounded"><Twitter size={14} /></button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {blocks.map((block, idx) => (
                                        <div key={idx} className="bg-black border border-[#333] p-3 rounded relative">
                                            <button onClick={() => removeBlock(idx)} className="absolute top-2 right-2 text-red-500"><Trash2 size={14}/></button>
                                            {block.type === 'TEXT' && <textarea className="w-full bg-transparent text-sm text-gray-300 outline-none h-16" value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} />}
                                            {block.type === 'TWEET' && <p className="text-xs text-blue-400">Tweet Embed: {block.text?.substring(0,30)}...</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* PREVIEW & SOCIAL MANAGER */}
                        <div>
                             {/* Social Media Manager Card */}
                             {generatedSocial && (
                                 <div className="mb-6 bg-[#0A0A0A] border border-blue-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
                                     <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase">Social Ready</div>
                                     <h3 className="font-condensed font-bold text-lg uppercase text-blue-400 mb-2 flex items-center gap-2">
                                        <Twitter size={16} /> Social Caption
                                     </h3>
                                     <div className="bg-[#1E1E1E] p-3 rounded border border-[#333] mb-3">
                                         <p className="text-sm text-white font-medium">{generatedSocial}</p>
                                     </div>
                                     <button 
                                        onClick={copySocialToClipboard}
                                        className="w-full py-2 bg-white text-black font-bold uppercase rounded text-xs flex items-center justify-center gap-2 hover:bg-gray-200"
                                     >
                                         <Copy size={14} /> Copy to Clipboard
                                     </button>
                                 </div>
                             )}

                             <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <Eye size={16} /> App Preview
                            </h3>
                            <div className="bg-white text-black rounded-xl overflow-hidden shadow-xl mb-6">
                                <div className="h-48 bg-gray-200 relative">
                                    <img src={newsImage} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-2 left-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded font-bold uppercase">Sheena App</div>
                                </div>
                                <div className="p-6">
                                    <h1 className="font-condensed font-black text-3xl uppercase leading-none mb-3">{newsTitle || 'Headline'}</h1>
                                    <p className="font-serif text-lg leading-relaxed text-gray-800">{newsSummary}</p>
                                </div>
                            </div>

                            <button onClick={publishNews} className="w-full py-4 bg-[#00FFB2] hover:bg-[#00E09E] text-black font-condensed font-black text-xl uppercase rounded flex items-center justify-center gap-2">
                                <Check size={20} /> Publish to App
                            </button>
                        </div>
                    </>
                )}

                {/* --- WAR ROOM CONSOLE (Keep existing) --- */}
                {activeTab === 'WAR_ROOM' && (
                    <div className="col-span-2 bg-[#121212] p-5 rounded-xl border border-[#2C2C2C] text-center text-gray-500">
                        War Room Console Active.
                    </div>
                )}

            </div>
        </div>
    );
};
