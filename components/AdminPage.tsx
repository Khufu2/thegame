
import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { NewsStory, SystemAlert, ArticleBlock } from '../types';
import { PenTool, Siren, Plus, Trash2, Layout, Image, MessageSquare, Twitter, Eye, Check, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
    const { addNewsStory, addSystemAlert, user } = useSports();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'NEWS' | 'WAR_ROOM'>('NEWS');

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
            source: 'Sheena Desk',
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
        window.alert('Alert Broadcasted to War Room');
        navigate('/');
    };

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
                    <button onClick={() => setActiveTab('WAR_ROOM')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded ${activeTab === 'WAR_ROOM' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>War Room</button>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

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
                                    {blocks.length === 0 && <div className="text-center text-gray-600 text-xs py-4">No content blocks added.</div>}
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
