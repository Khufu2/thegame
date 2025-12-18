import React, { useState, useEffect } from 'react';
import { useSports } from '../context/SportsContext';
import { NewsStory, SystemAlert, ArticleBlock, MatchStatus } from '../types';
import { generateMatchNews, shareExternalNews } from '../services/newsAgentService';
import { PenTool, Siren, Plus, Trash2, Layout, Image, MessageSquare, Twitter, Eye, Check, AlertTriangle, Wand2, RefreshCw, List, Globe, Send, Radio, UserPlus, Users, BadgeCheck, Link as LinkIcon, Copy, MapPin, ExternalLink, Newspaper, Loader2, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabaseClient';

// Popular sports news sources
const NEWS_SOURCES = [
    { id: 'bleacher', name: 'Bleacher Report', url: 'https://bleacherreport.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Bleacher_Report_logo.png' },
    { id: 'espn', name: 'ESPN', url: 'https://espn.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ESPN_wordmark.svg' },
    { id: 'skysports', name: 'Sky Sports', url: 'https://skysports.com', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Sky_Sports_logo_2020.svg' },
    { id: 'goal', name: 'Goal.com', url: 'https://goal.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Goal.com_logo.svg' },
    { id: 'bbc', name: 'BBC Sport', url: 'https://bbc.com/sport', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/BBC_Sport_logo.svg' },
];

export const AdminPage: React.FC = () => {
    const { addNewsStory, addSystemAlert, deleteNewsStory, deleteSystemAlert, user, matches, news, alerts } = useSports();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'NEWS' | 'WAR_ROOM' | 'AI_AGENT' | 'SHARE_NEWS' | 'MANAGE' | 'BACKTEST' | 'AGGREGATION'>('NEWS');
    const [publishedNews, setPublishedNews] = useState<any[]>([]);
    const [editingNews, setEditingNews] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
    const [apiKeysAvailable, setApiKeysAvailable] = useState<boolean | null>(null);

    // Check admin status from database
    useEffect(() => {
        const checkAdminStatus = async () => {
            setIsCheckingAdmin(true);
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                
                if (!authUser) {
                    setIsAdmin(false);
                    setIsCheckingAdmin(false);
                    return;
                }

                // Check if user has admin role in user_roles table
                const { data, error } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', authUser.id)
                    .eq('role', 'admin')
                    .single();

                if (error || !data) {
                    // Also check legacy isAdmin property as fallback
                    setIsAdmin(user?.isAdmin || false);
                } else {
                    setIsAdmin(true);
                }
            } catch (err) {
                console.error('Error checking admin status:', err);
                setIsAdmin(user?.isAdmin || false);
            }
            setIsCheckingAdmin(false);
        };

        checkAdminStatus();
    }, [user]);

    // Check API key availability
    useEffect(() => {
        const checkApiKeys = async () => {
            try {
                const response = await fetch(
                    `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/generate-news`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            topic: "test",
                            persona: "SHEENA",
                            tone: "RECAP",
                            language: "ENGLISH",
                            useGrounding: false
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setApiKeysAvailable(!data.warning); // If warning exists, keys are not available
                } else {
                    setApiKeysAvailable(false);
                }
            } catch (error) {
                console.error('Error checking API keys:', error);
                setApiKeysAvailable(false);
            }
        };

        if (isAdmin) {
            checkApiKeys();
        }
    }, [isAdmin]);

    // --- NEWS STATE ---
    const [newsTitle, setNewsTitle] = useState('');
    const [newsSummary, setNewsSummary] = useState('');
    const [newsBody, setNewsBody] = useState(''); // Simple body text area
    const [newsImage, setNewsImage] = useState('https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000&auto=format&fit=crop');
    const [newsTag, setNewsTag] = useState('NBA');
    const [blocks, setBlocks] = useState<ArticleBlock[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [useSimpleMode, setUseSimpleMode] = useState(true); // Default to simple mode
    
    // --- ALERT STATE ---
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDesc, setAlertDesc] = useState('');
    const [alertData, setAlertData] = useState('');
    const [alertLeague, setAlertLeague] = useState('NFL');
    const [alertType, setAlertType] = useState<SystemAlert['alertType']>('SHARP_MONEY');
    const [broadcastToBots, setBroadcastToBots] = useState(true);

    // --- AI AGENT STATE ---
    const [generationMode, setGenerationMode] = useState<'MATCH' | 'TOPIC' | 'LINK' | 'LOCAL'>('MATCH');
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [externalLink, setExternalLink] = useState('');
    const [localCountry, setLocalCountry] = useState('Nigeria');
    const [localLeagueName, setLocalLeagueName] = useState('NPFL');
    
    const [aiTone, setAiTone] = useState<'HYPE' | 'RECAP' | 'ANALYTICAL' | 'RUMOR'>('RECAP');
    const [aiLanguage, setAiLanguage] = useState<'ENGLISH' | 'SWAHILI'>('ENGLISH');
    const [aiPersona, setAiPersona] = useState<'SHEENA' | 'ORACLE' | 'STREET' | 'JOURNALIST'>('SHEENA');
    const [aiProvider, setAiProvider] = useState<'GEMINI' | 'GROK' | 'OLLAMA'>('GEMINI');
    const [useGrounding, setUseGrounding] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSocial, setGeneratedSocial] = useState('');

    // --- SHARE NEWS STATE ---
    const [shareUrl, setShareUrl] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    // --- SHARE LINK STATE ---
    const [linkTitle, setLinkTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkDescription, setLinkDescription] = useState('');
    const [linkTag, setLinkTag] = useState('News');
    const [linkImage, setLinkImage] = useState('https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop');

    // --- TEAM MANAGEMENT STATE ---
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('JOURNALIST');

    // --- BACKTEST STATE ---
    const [backtestDays, setBacktestDays] = useState(30);
    const [backtestModel, setBacktestModel] = useState('');
    const [backtestLeague, setBacktestLeague] = useState('');
    const [backtestResults, setBacktestResults] = useState<any>(null);
    const [isRunningBacktest, setIsRunningBacktest] = useState(false);

    // NEWS AGGREGATION STATE
    const [isAggregatingNews, setIsAggregatingNews] = useState(false);
    const [aggregationResults, setAggregationResults] = useState<any>(null);

    if (isCheckingAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="text-white mx-auto mb-4 animate-spin" />
                    <p className="text-gray-500">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
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

    const publishNews = async () => {
        if (!newsTitle.trim()) {
            alert('Please enter a title');
            return;
        }

        if (!newsSummary.trim()) {
            alert('Please enter a summary');
            return;
        }

        let finalBlocks = blocks;

        // If using simple mode, create a TEXT block from the body
        if (useSimpleMode && newsBody.trim()) {
            finalBlocks = [{ type: 'TEXT', content: newsBody }];
        } else if (useSimpleMode && !newsBody.trim()) {
            alert('Please enter article content in the body field');
            return;
        } else if (!useSimpleMode && blocks.length === 0) {
            alert('Please add at least one content block');
            return;
        }

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
            contentBlocks: finalBlocks
        };
        await addNewsStory(story);
        window.alert('Story Published to Feed');
        navigate('/');
    };

    const publishAlert = async () => {
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
        await addSystemAlert(newAlert); 
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
            generationMode === 'LOCAL' ? `${localLeagueName} (${localCountry})` : customTopic,
            aiTone,
            aiLanguage,
            aiPersona,
            useGrounding,
            generationMode === 'LINK' ? externalLink : undefined,
            generationMode === 'LOCAL' // Is Local Mode?
        );
        setIsGenerating(false);

        if (result) {
            setNewsTitle(result.title);
            setNewsSummary(result.summary);

            // If using simple mode, extract text from blocks and put in body
            if (useSimpleMode && result.blocks && result.blocks.length > 0) {
                const textBlocks = result.blocks.filter(block => block.type === 'TEXT');
                const combinedText = textBlocks.map(block => block.content).join('\n\n');
                setNewsBody(combinedText);
            } else {
                setBlocks(result.blocks);
            }

            setNewsTag(generationMode === 'LOCAL' ? localLeagueName : (match ? match.league : 'General'));
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

    const handleShareExternalNews = async () => {
        if (!shareUrl) {
            alert("Please enter a URL to share");
            return;
        }
        setIsSharing(true);
        const result = await shareExternalNews(shareUrl, selectedSource || 'External');
        setIsSharing(false);

        if (result) {
            setNewsTitle(result.title);
            setNewsSummary(result.summary);
            setBlocks(result.blocks);
            setNewsTag('News');
            if (result.socialCaption) setGeneratedSocial(result.socialCaption);
            setActiveTab('NEWS');
            alert("News imported! Review and publish from News Desk.");
        } else {
            alert("Failed to fetch and process the article. Try again.");
        }
    };

    const handleShareLink = async () => {
        if (!linkTitle || !linkUrl) {
            alert("Please enter both title and URL");
            return;
        }

        const linkBlock = {
            type: 'LINK' as const,
            title: linkTitle,
            url: linkUrl,
            description: linkDescription
        };

        const story: NewsStory = {
            id: `news_${Date.now()}`,
            type: 'NEWS',
            title: linkTitle,
            summary: linkDescription || 'Click to read the full article',
            imageUrl: linkImage,
            source: 'Sheena Desk',
            timestamp: 'Just Now',
            likes: 0,
            comments: 0,
            tags: [linkTag],
            contentBlocks: [linkBlock]
        };

        await addNewsStory(story);
        alert('Link shared successfully!');

        // Reset form
        setLinkTitle('');
        setLinkUrl('');
        setLinkDescription('');
        setLinkTag('News');
    };

    const handleRunBacktest = async () => {
        setIsRunningBacktest(true);
        try {
            const response = await fetch(
                `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/backtest-predictions`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        days: backtestDays,
                        model: backtestModel || undefined,
                        league: backtestLeague || undefined,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setBacktestResults(data.backtest);
            } else {
                alert('Failed to run backtest');
            }
        } catch (error) {
            console.error('Backtest error:', error);
            alert('Error running backtest');
        }
        setIsRunningBacktest(false);
    };

    const handleAggregateNews = async () => {
        setIsAggregatingNews(true);
        try {
            const response = await fetch(
                `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/aggregate-news`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setAggregationResults(data);
                alert(`News aggregation complete! Fetched ${data.stats?.totalFetched || 0} items, processed ${data.stats?.processed || 0} stories.`);
            } else {
                const errorData = await response.json();
                alert(`News aggregation failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('News aggregation error:', error);
            alert('Error running news aggregation');
        }
        setIsAggregatingNews(false);
    };

    const fetchPublishedNews = async () => {
        try {
            const response = await fetch(
                `https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/get-news`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPublishedNews(data);
            } else {
                console.error('Failed to fetch published news');
            }
        } catch (error) {
            console.error('Error fetching published news:', error);
        }
    };

    const deletePublishedNews = async (newsId: string) => {
        if (!confirm('Are you sure you want to delete this news article?')) return;

        try {
            const { error } = await supabase
                .from('feeds')
                .delete()
                .eq('id', newsId);

            if (error) {
                console.error('Error deleting news:', error);
                alert('Failed to delete news article');
            } else {
                alert('News article deleted successfully');
                fetchPublishedNews(); // Refresh the list
            }
        } catch (error) {
            console.error('Error deleting news:', error);
            alert('Error deleting news article');
        }
    };

    const startEditingNews = (newsItem: any) => {
        setEditingNews(newsItem);
        setNewsTitle(newsItem.title || '');
        setNewsSummary(newsItem.excerpt || '');
        setNewsImage(newsItem.image_url || '');
        setNewsTag(newsItem.tags?.[0] || 'News');

        // Parse content blocks - handle both JSON string and already parsed array
        try {
            let contentBlocks;
            if (typeof newsItem.content === 'string') {
                contentBlocks = JSON.parse(newsItem.content || '[]');
            } else if (Array.isArray(newsItem.content)) {
                contentBlocks = newsItem.content;
            } else {
                contentBlocks = [];
            }

            // If editing and content blocks exist, switch to advanced mode
            if (contentBlocks.length > 0) {
                setUseSimpleMode(false);
                setBlocks(contentBlocks);

                // If there's only one TEXT block, also populate the simple body for convenience
                if (contentBlocks.length === 1 && contentBlocks[0].type === 'TEXT') {
                    setNewsBody(contentBlocks[0].content || '');
                }
            } else {
                setUseSimpleMode(true);
                setBlocks([]);
                setNewsBody('');
            }
        } catch (error) {
            console.warn('Failed to parse content blocks:', error);
            setBlocks([]);
            setUseSimpleMode(true);
            setNewsBody('');
        }

        setActiveTab('NEWS');
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `news-images/${fileName}`;

            console.log('Attempting to upload to:', filePath);

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            if (data.publicUrl) {
                setNewsImage(data.publicUrl);
                alert('Image uploaded successfully!');
            } else {
                throw new Error('Failed to get public URL');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image to storage. Please check if the storage bucket is configured correctly.');
        } finally {
            setUploadingImage(false);
        }
    };

    const updatePublishedNews = async () => {
        if (!editingNews) return;

        try {
            const { error } = await supabase
                .from('feeds')
                .update({
                    title: newsTitle,
                    excerpt: newsSummary,
                    content: JSON.stringify(blocks),
                    image_url: newsImage,
                    tags: [newsTag]
                })
                .eq('id', editingNews.id);

            if (error) {
                console.error('Error updating news:', error);
                alert('Failed to update news article');
            } else {
                alert('News article updated successfully');
                setEditingNews(null);
                fetchPublishedNews(); // Refresh the list
            }
        } catch (error) {
            console.error('Error updating news:', error);
            alert('Error updating news article');
        }
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
                <div className="flex gap-2 overflow-x-auto">
                    <button onClick={() => navigate('/admin/dashboard')} className="px-4 py-1.5 text-xs font-bold uppercase rounded whitespace-nowrap bg-purple-600 text-white hover:bg-purple-500">📊 Dashboard</button>
                    <button onClick={() => setActiveTab('NEWS')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded whitespace-nowrap ${activeTab === 'NEWS' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>News Desk</button>
                    <button onClick={() => setActiveTab('AI_AGENT')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 whitespace-nowrap ${activeTab === 'AI_AGENT' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}><Wand2 size={12}/> AI Agent</button>
                    <button onClick={() => setActiveTab('SHARE_NEWS')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 whitespace-nowrap ${activeTab === 'SHARE_NEWS' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white'}`}><ExternalLink size={12}/> Share News</button>
                    <button onClick={() => { setActiveTab('MANAGE'); fetchPublishedNews(); }} className={`px-4 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 whitespace-nowrap ${activeTab === 'MANAGE' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-white'}`}>📝 Manage</button>
                    <button onClick={() => setActiveTab('BACKTEST')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 whitespace-nowrap ${activeTab === 'BACKTEST' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>📊 Backtest</button>
                    <button onClick={() => setActiveTab('AGGREGATION')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 whitespace-nowrap ${activeTab === 'AGGREGATION' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white'}`}>📰 Aggregation</button>
                    <button onClick={() => setActiveTab('WAR_ROOM')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded whitespace-nowrap ${activeTab === 'WAR_ROOM' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>War Room</button>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* --- SHARE NEWS TAB --- */}
                {activeTab === 'SHARE_NEWS' && (
                    <div className="col-span-2 max-w-[600px] mx-auto w-full space-y-6">

                        {/* SHARE LINK SECTION */}
                        <div className="bg-[#121212] border border-blue-500/50 rounded-xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <LinkIcon size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-condensed font-black text-2xl uppercase text-white leading-none">Share Link</h3>
                                    <p className="text-xs text-blue-400">Share articles directly without AI processing</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                    <input
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-blue-500"
                                        placeholder="Article title..."
                                        value={linkTitle}
                                        onChange={(e) => setLinkTitle(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL</label>
                                    <input
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-blue-500"
                                        placeholder="https://example.com/article"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                                    <textarea
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-blue-500 h-20 resize-none"
                                        placeholder="Brief description..."
                                        value={linkDescription}
                                        onChange={(e) => setLinkDescription(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tag</label>
                                        <select
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-blue-500"
                                            value={linkTag}
                                            onChange={(e) => setLinkTag(e.target.value)}
                                        >
                                            <option value="News">News</option>
                                            <option value="NBA">NBA</option>
                                            <option value="NFL">NFL</option>
                                            <option value="Soccer">Soccer</option>
                                            <option value="UFC">UFC</option>
                                            <option value="F1">F1</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL (Optional)</label>
                                        <input
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-blue-500"
                                            placeholder="https://..."
                                            value={linkImage}
                                            onChange={(e) => setLinkImage(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleShareLink}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    <LinkIcon size={16} /> Share Link
                                </button>
                            </div>
                        </div>

                        {/* SHARE EXTERNAL NEWS SECTION */}
                        <div className="bg-[#121212] border border-green-500/50 rounded-xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                                    <Newspaper size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-condensed font-black text-2xl uppercase text-white leading-none">Share External News</h3>
                                    <p className="text-xs text-green-400">Import & rewrite articles from popular sources</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Quick Source Buttons */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quick Sources</label>
                                    <div className="flex flex-wrap gap-2">
                                        {NEWS_SOURCES.map(source => (
                                            <button
                                                key={source.id}
                                                onClick={() => { setSelectedSource(source.name); window.open(source.url, '_blank'); }}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedSource === source.name ? 'bg-green-900/30 border-green-500' : 'bg-[#1E1E1E] border-[#333] hover:border-gray-500'}`}
                                            >
                                                <span className="text-xs font-bold text-white">{source.name}</span>
                                                <ExternalLink size={12} className="text-gray-500" />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2">Click to open source, then copy article URL below</p>
                                </div>

                                {/* URL Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Paste Article URL</label>
                                    <input 
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-green-500"
                                        placeholder="https://bleacherreport.com/articles/..."
                                        value={shareUrl}
                                        onChange={(e) => setShareUrl(e.target.value)}
                                    />
                                </div>

                                {/* Import Button */}
                                <button 
                                    onClick={handleShareExternalNews}
                                    disabled={isSharing || !shareUrl}
                                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    {isSharing ? (
                                        <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                                    ) : (
                                        <><Wand2 size={16} /> Import & Rewrite with AI</>
                                    )}
                                </button>

                                <p className="text-[10px] text-gray-500 text-center">
                                    AI will fetch the article, extract key information, and rewrite it in Sheena's style.
                                </p>
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
                                     <p className="text-xs text-indigo-400">Content Automation & Social Manager</p>
                                 </div>
                             </div>

                             {/* API Keys Warning */}
                             {apiKeysAvailable === false && (
                                 <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center">
                                             <AlertTriangle size={16} className="text-white" />
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-yellow-400 text-sm">AI Features Limited</h4>
                                             <p className="text-xs text-yellow-300">API keys not configured. News generation will use basic templates.</p>
                                         </div>
                                     </div>
                                 </div>
                             )}

                             <div className="space-y-4">
                                 {/* Mode Selector */}
                                 <div className="flex bg-black rounded p-1 border border-[#333]">
                                     <button onClick={() => setGenerationMode('MATCH')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${generationMode === 'MATCH' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}>Match</button>
                                     <button onClick={() => setGenerationMode('TOPIC')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${generationMode === 'TOPIC' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}>Topic</button>
                                     <button onClick={() => setGenerationMode('LOCAL')} className={`flex-1 py-2 text-xs font-bold uppercase rounded flex items-center justify-center gap-1 ${generationMode === 'LOCAL' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}><MapPin size={12}/> Local Scout</button>
                                     <button onClick={() => setGenerationMode('LINK')} className={`flex-1 py-2 text-xs font-bold uppercase rounded flex items-center justify-center gap-1 ${generationMode === 'LINK' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500'}`}><LinkIcon size={12}/> Link</button>
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
                                            placeholder="e.g., Lakers Trade News..."
                                            value={customTopic}
                                            onChange={(e) => setCustomTopic(e.target.value)}
                                         />
                                     </div>
                                 )}

                                 {generationMode === 'LOCAL' && (
                                     <div className="space-y-3 p-3 bg-indigo-900/10 border border-indigo-500/30 rounded-lg">
                                         <div>
                                            <label className="block text-xs font-bold text-indigo-400 uppercase mb-1">Country</label>
                                            <select 
                                                className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                                value={localCountry}
                                                onChange={(e) => setLocalCountry(e.target.value)}
                                            >
                                                <option value="Nigeria">Nigeria</option>
                                                <option value="Kenya">Kenya</option>
                                                <option value="South Africa">South Africa</option>
                                                <option value="Ghana">Ghana</option>
                                                <option value="Tanzania">Tanzania</option>
                                                <option value="Egypt">Egypt</option>
                                                <option value="Morocco">Morocco</option>
                                            </select>
                                         </div>
                                         <div>
                                            <label className="block text-xs font-bold text-indigo-400 uppercase mb-1">League Name</label>
                                            <input 
                                                className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                                placeholder="e.g. NPFL, GPL, PSL..."
                                                value={localLeagueName}
                                                onChange={(e) => setLocalLeagueName(e.target.value)}
                                            />
                                         </div>
                                         <p className="text-[10px] text-gray-500">AI will assume the role of a local beat writer to fetch coverage.</p>
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

                                 <div className="grid grid-cols-3 gap-4">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">AI Provider</label>
                                         <select
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-indigo-500"
                                            value={aiProvider}
                                            onChange={(e) => setAiProvider(e.target.value as any)}
                                         >
                                             <option value="GEMINI">Gemini (Paid)</option>
                                             <option value="GROK">Grok (Free)</option>
                                             <option value="OLLAMA">Ollama (Local)</option>
                                         </select>
                                     </div>
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
                                             <option value="JOURNALIST">Local Scout (Detailed)</option>
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
                            {/* STORY DETAILS */}
                            <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 flex items-center gap-2">
                                        <PenTool size={16} /> Story Details
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 uppercase">Mode:</span>
                                        <button
                                            onClick={() => setUseSimpleMode(true)}
                                            className={`px-3 py-1 text-xs font-bold uppercase rounded ${useSimpleMode ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                        >
                                            Simple
                                        </button>
                                        <button
                                            onClick={() => setUseSimpleMode(false)}
                                            className={`px-3 py-1 text-xs font-bold uppercase rounded ${!useSimpleMode ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                        >
                                            Advanced
                                        </button>
                                    </div>
                                </div>
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

                                    {/* SIMPLE MODE: Body Text Area */}
                                    {useSimpleMode && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Article Body</label>
                                            <textarea
                                                className="w-full bg-black border border-[#333] p-3 rounded text-sm placeholder-gray-600 focus:border-indigo-500 outline-none h-48 resize-none"
                                                placeholder="Write your article content here..."
                                                value={newsBody}
                                                onChange={e => setNewsBody(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <input
                                            className="w-full bg-black border border-[#333] p-3 rounded text-sm placeholder-gray-600"
                                            placeholder="Image URL (or upload below)"
                                            value={newsImage}
                                            onChange={e => setNewsImage(e.target.value)}
                                        />
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(file);
                                                }}
                                                className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                                                disabled={uploadingImage}
                                            />
                                            {uploadingImage && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* ADVANCED MODE: Content Blocks Editor */}
                            {!useSimpleMode && (
                                <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 flex items-center gap-2">
                                            <Layout size={16} /> Content Blocks
                                        </h3>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleAddBlock('TEXT')} className="p-2 bg-[#1E1E1E] hover:bg-[#333] rounded" title="Add Text Block"><MessageSquare size={14} /></button>
                                            <button onClick={() => handleAddBlock('TWEET')} className="p-2 bg-[#1E1E1E] hover:bg-[#333] rounded" title="Add Tweet"><Twitter size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {blocks.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <Layout size={48} className="mx-auto mb-4 opacity-50" />
                                                <p className="text-sm">No content blocks added yet.</p>
                                                <p className="text-xs text-gray-600 mt-1">Click the buttons above to add text, tweets, or other content.</p>
                                            </div>
                                        ) : (
                                            blocks.map((block, idx) => (
                                                <div key={idx} className="bg-black border border-[#333] p-3 rounded relative">
                                                    <button onClick={() => removeBlock(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400" title="Remove Block"><Trash2 size={14}/></button>
                                                    {block.type === 'TEXT' && (
                                                        <div>
                                                            <div className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-2">
                                                                <MessageSquare size={12} /> Text Block
                                                            </div>
                                                            <textarea
                                                                className="w-full bg-transparent text-sm text-gray-300 outline-none h-20 resize-none"
                                                                placeholder="Enter your text content here..."
                                                                value={block.content}
                                                                onChange={e => updateBlock(idx, 'content', e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                    {block.type === 'TWEET' && (
                                                        <div>
                                                            <div className="text-xs text-blue-400 uppercase mb-2 flex items-center gap-2">
                                                                <Twitter size={12} /> Tweet Embed
                                                            </div>
                                                            <input
                                                                className="w-full bg-transparent text-sm text-gray-300 outline-none border-b border-gray-700 pb-1"
                                                                placeholder="Tweet text..."
                                                                value={block.text || ''}
                                                                onChange={e => updateBlock(idx, 'text', e.target.value)}
                                                            />
                                                            <input
                                                                className="w-full bg-transparent text-sm text-gray-500 outline-none mt-2"
                                                                placeholder="@username"
                                                                value={block.author || ''}
                                                                onChange={e => updateBlock(idx, 'author', e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
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

                            {editingNews ? (
                                <div className="flex gap-3">
                                    <button onClick={updatePublishedNews} className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-condensed font-black text-xl uppercase rounded flex items-center justify-center gap-2">
                                        <Check size={20} /> Save Changes
                                    </button>
                                    <button onClick={() => {
                                        setEditingNews(null);
                                        setNewsTitle('');
                                        setNewsSummary('');
                                        setNewsBody('');
                                        setNewsImage('https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000&auto=format&fit=crop');
                                        setBlocks([]);
                                        setUseSimpleMode(true);
                                    }} className="px-6 py-4 bg-gray-600 hover:bg-gray-500 text-white font-condensed font-black text-xl uppercase rounded">
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button onClick={publishNews} className="w-full py-4 bg-[#00FFB2] hover:bg-[#00E09E] text-black font-condensed font-black text-xl uppercase rounded flex items-center justify-center gap-2">
                                    <Check size={20} /> Publish to App
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* --- BACKTEST DASHBOARD --- */}
                {activeTab === 'BACKTEST' && (
                    <div className="col-span-2 max-w-[800px] mx-auto w-full space-y-6">

                        {/* BACKTEST CONTROLS */}
                        <div className="bg-[#121212] border border-purple-500/50 rounded-xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                                    <BarChart2 size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-condensed font-black text-2xl uppercase text-white leading-none">Prediction Backtest</h3>
                                    <p className="text-xs text-purple-400">Analyze ML model performance over time</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time Period</label>
                                    <select
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-purple-500"
                                        value={backtestDays}
                                        onChange={(e) => setBacktestDays(Number(e.target.value))}
                                    >
                                        <option value={7}>7 days</option>
                                        <option value={30}>30 days</option>
                                        <option value={90}>90 days</option>
                                        <option value={180}>180 days</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model Filter</label>
                                    <select
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-purple-500"
                                        value={backtestModel}
                                        onChange={(e) => setBacktestModel(e.target.value)}
                                    >
                                        <option value="">All Models</option>
                                        <option value="Elo Rating System">Elo Ratings</option>
                                        <option value="Poisson Regression">Regression</option>
                                        <option value="AI Enhanced">AI Enhanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">League Filter</label>
                                    <select
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-purple-500"
                                        value={backtestLeague}
                                        onChange={(e) => setBacktestLeague(e.target.value)}
                                    >
                                        <option value="">All Leagues</option>
                                        <option value="Premier League">Premier League</option>
                                        <option value="La Liga">La Liga</option>
                                        <option value="Bundesliga">Bundesliga</option>
                                        <option value="Serie A">Serie A</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleRunBacktest}
                                disabled={isRunningBacktest}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                {isRunningBacktest ? (
                                    <><RefreshCw size={16} className="animate-spin" /> Running Backtest...</>
                                ) : (
                                    <><BarChart2 size={16} /> Run Backtest Analysis</>
                                )}
                            </button>
                        </div>

                        {/* BACKTEST RESULTS */}
                        {backtestResults && (
                            <div className="bg-[#121212] border border-purple-500/50 rounded-xl p-6 shadow-2xl">
                                <h3 className="font-condensed font-black text-xl uppercase text-white mb-6">Backtest Results</h3>

                                {/* OVERVIEW STATS */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-black/40 p-4 rounded-lg border border-[#333]">
                                        <div className="text-2xl font-bold text-purple-400">{backtestResults.accuracy?.toFixed(1)}%</div>
                                        <div className="text-xs text-gray-500 uppercase">Accuracy</div>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-lg border border-[#333]">
                                        <div className="text-2xl font-bold text-green-400">${backtestResults.profitLoss?.toFixed(0)}</div>
                                        <div className="text-xs text-gray-500 uppercase">Profit/Loss</div>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-lg border border-[#333]">
                                        <div className="text-2xl font-bold text-blue-400">{backtestResults.totalPredictions}</div>
                                        <div className="text-xs text-gray-500 uppercase">Total Predictions</div>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-lg border border-[#333]">
                                        <div className="text-2xl font-bold text-yellow-400">{backtestResults.avgConfidence?.toFixed(0)}%</div>
                                        <div className="text-xs text-gray-500 uppercase">Avg Confidence</div>
                                    </div>
                                </div>

                                {/* MODEL BREAKDOWN */}
                                {backtestResults.modelBreakdown && Object.keys(backtestResults.modelBreakdown).length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-bold text-white mb-3">Model Performance</h4>
                                        <div className="space-y-2">
                                            {Object.entries(backtestResults.modelBreakdown).map(([model, stats]: [string, any]) => (
                                                <div key={model} className="flex justify-between items-center bg-black/20 p-3 rounded">
                                                    <span className="text-sm text-gray-300">{model}</span>
                                                    <div className="flex gap-4 text-xs">
                                                        <span className="text-gray-500">{stats.correct}/{stats.total}</span>
                                                        <span className={`font-bold ${stats.accuracy > 60 ? 'text-green-400' : stats.accuracy > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {stats.accuracy.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CONFIDENCE BREAKDOWN */}
                                {backtestResults.confidenceBreakdown && Object.keys(backtestResults.confidenceBreakdown).length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-white mb-3">Confidence Analysis</h4>
                                        <div className="space-y-2">
                                            {Object.entries(backtestResults.confidenceBreakdown).map(([range, stats]: [string, any]) => (
                                                <div key={range} className="flex justify-between items-center bg-black/20 p-3 rounded">
                                                    <span className="text-sm text-gray-300">{range} confidence</span>
                                                    <div className="flex gap-4 text-xs">
                                                        <span className="text-gray-500">{stats.correct}/{stats.total}</span>
                                                        <span className={`font-bold ${stats.accuracy > 60 ? 'text-green-400' : stats.accuracy > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {stats.accuracy.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- MANAGE NEWS --- */}
                {activeTab === 'MANAGE' && (
                    <div className="col-span-2 max-w-[1000px] mx-auto w-full space-y-6">

                        {/* PUBLISHED NEWS LIST */}
                        <div className="bg-[#121212] border border-orange-500/50 rounded-xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
                                    <Newspaper size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-condensed font-black text-2xl uppercase text-white leading-none">Published News</h3>
                                    <p className="text-xs text-orange-400">Edit, delete, and manage your published articles</p>
                                </div>
                                <button
                                    onClick={fetchPublishedNews}
                                    className="ml-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase rounded flex items-center gap-2"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>

                            {publishedNews.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No published news found. Create some articles first!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {publishedNews.map((newsItem: any) => (
                                        <div key={newsItem.id} className="bg-black/40 border border-[#333] rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white text-lg mb-2">{newsItem.title}</h4>
                                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{newsItem.excerpt}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>{newsItem.source}</span>
                                                        <span>{new Date(newsItem.created_at).toLocaleDateString()}</span>
                                                        <span>{newsItem.type}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => startEditingNews(newsItem)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deletePublishedNews(newsItem.id)}
                                                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* EDITING MODE INDICATOR */}
                        {editingNews && (
                            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center">
                                            <PenTool size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-yellow-400">Editing: {editingNews.title}</h4>
                                            <p className="text-sm text-gray-400">Make your changes in the News Desk tab, then save.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={updatePublishedNews}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold uppercase rounded"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setEditingNews(null)}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold uppercase rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                 )}

                 {/* --- NEWS AGGREGATION --- */}
                 {activeTab === 'AGGREGATION' && (
                     <div className="col-span-2 max-w-[800px] mx-auto w-full space-y-6">

                         {/* AGGREGATION CONTROLS */}
                         <div className="bg-[#121212] border border-green-500/50 rounded-xl p-6 shadow-2xl">
                             <div className="flex items-center gap-3 mb-6">
                                 <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                                     <Globe size={20} className="text-white" />
                                 </div>
                                 <div>
                                     <h3 className="font-condensed font-black text-2xl uppercase text-white leading-none">News Aggregation</h3>
                                     <p className="text-xs text-green-400">Automated content collection from RSS feeds</p>
                                 </div>
                             </div>

                             <div className="mb-6">
                                 <h4 className="font-bold text-white mb-3">Phase 1: RSS Feed Integration</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                     <div className="bg-black/40 p-3 rounded-lg border border-[#333]">
                                         <div className="text-lg font-bold text-green-400">8</div>
                                         <div className="text-xs text-gray-400 uppercase">Sources</div>
                                     </div>
                                     <div className="bg-black/40 p-3 rounded-lg border border-[#333]">
                                         <div className="text-lg font-bold text-blue-400">NFL</div>
                                         <div className="text-xs text-gray-400 uppercase">NBA</div>
                                     </div>
                                     <div className="bg-black/40 p-3 rounded-lg border border-[#333]">
                                         <div className="text-lg font-bold text-purple-400">Soccer</div>
                                         <div className="text-xs text-gray-400 uppercase">UFC</div>
                                     </div>
                                     <div className="bg-black/40 p-3 rounded-lg border border-[#333]">
                                         <div className="text-lg font-bold text-yellow-400">F1</div>
                                         <div className="text-xs text-gray-400 uppercase">MLB</div>
                                     </div>
                                 </div>
                             </div>

                             <button
                                 onClick={handleAggregateNews}
                                 disabled={isAggregatingNews}
                                 className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                             >
                                 {isAggregatingNews ? (
                                     <><RefreshCw size={16} className="animate-spin" /> Aggregating News...</>
                                 ) : (
                                     <><Globe size={16} /> Start News Aggregation</>
                                 )}
                             </button>
                         </div>

                         {/* AGGREGATION RESULTS */}
                         {aggregationResults && (
                             <div className="bg-[#121212] border border-green-500/50 rounded-xl p-6 shadow-2xl">
                                 <h3 className="font-condensed font-black text-xl uppercase text-white mb-6">Aggregation Results</h3>

                                 {/* STATS OVERVIEW */}
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                     <div className="bg-black/40 p-4 rounded-lg border border-[#333]">
                                         <div className="text-2xl font-bold text-green-400">{aggregationResults.stats?.totalFetched || 0}</div>
                                         <div className="text-xs text-gray-400 uppercase">Fetched</div>
                                     </div>
                                     <div className="bg-black/40 p-4 rounded-lg border border-[#333]">
                                         <div className="text-2xl font-bold text-blue-400">{aggregationResults.stats?.processed || 0}</div>
                                         <div className="text-xs text-gray-400 uppercase">Processed</div>
                                     </div>
                                     <div className="bg-black/40 p-4 rounded-lg border border-[#333]">
                                         <div className="text-2xl font-bold text-yellow-400">{aggregationResults.stats?.duplicates || 0}</div>
                                         <div className="text-xs text-gray-400 uppercase">Duplicates</div>
                                     </div>
                                     <div className="bg-black/40 p-4 rounded-lg border border-[#333]">
                                         <div className="text-2xl font-bold text-red-400">{aggregationResults.stats?.errors || 0}</div>
                                         <div className="text-xs text-gray-400 uppercase">Errors</div>
                                     </div>
                                 </div>

                                 {/* CACHE STATS */}
                                 {aggregationResults.cacheStats && (
                                     <div className="mb-6">
                                         <h4 className="font-bold text-white mb-3">Cache Performance</h4>
                                         <div className="grid grid-cols-2 gap-4">
                                             <div className="bg-black/20 p-3 rounded">
                                                 <div className="text-sm text-gray-300">RSS Cache Size: {aggregationResults.cacheStats.rssCache?.size || 0}</div>
                                             </div>
                                             <div className="bg-black/20 p-3 rounded">
                                                 <div className="text-sm text-gray-300">Processed URLs: {aggregationResults.cacheStats.processedUrls || 0}</div>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {/* STATUS */}
                                 <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                                             <Check size={16} className="text-white" />
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-green-400">Aggregation Complete</h4>
                                             <p className="text-sm text-gray-300">
                                                 Successfully stored {aggregationResults.newsStored || 0} news stories and {aggregationResults.alertsStored || 0} alerts.
                                             </p>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}

                 {/* --- WAR ROOM ALERT SYSTEM --- */}
                {activeTab === 'WAR_ROOM' && (
                    <div className="col-span-2 max-w-[600px] mx-auto w-full space-y-6">

                        {/* WAR ROOM HEADER */}
                        <div className="bg-[#121212] border border-red-500/50 rounded-xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                    <Siren size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-condensed font-black text-2xl uppercase text-white leading-none">War Room</h3>
                                    <p className="text-xs text-red-400">Strategic Intelligence & Alert Broadcasting</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alert Title</label>
                                    <input
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-red-500"
                                        placeholder="e.g., SHARP MONEY ALERT: Arsenal ML"
                                        value={alertTitle}
                                        onChange={(e) => setAlertTitle(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alert Description</label>
                                    <textarea
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-red-500 h-24 resize-none"
                                        placeholder="Detailed analysis and reasoning..."
                                        value={alertDesc}
                                        onChange={(e) => setAlertDesc(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Point</label>
                                    <input
                                        className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-red-500"
                                        placeholder="e.g., $2.1M on Arsenal ML"
                                        value={alertData}
                                        onChange={(e) => setAlertData(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">League</label>
                                        <select
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-red-500"
                                            value={alertLeague}
                                            onChange={(e) => setAlertLeague(e.target.value)}
                                        >
                                            <option value="NFL">NFL</option>
                                            <option value="NBA">NBA</option>
                                            <option value="EPL">Premier League</option>
                                            <option value="LaLiga">La Liga</option>
                                            <option value="Serie A">Serie A</option>
                                            <option value="UFC">UFC</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alert Type</label>
                                        <select
                                            className="w-full bg-black border border-[#333] p-3 rounded text-white outline-none focus:border-red-500"
                                            value={alertType}
                                            onChange={(e) => setAlertType(e.target.value as SystemAlert['alertType'])}
                                        >
                                            <option value="SHARP_MONEY">Sharp Money</option>
                                            <option value="LINE_MOVEMENT">Line Movement</option>
                                            <option value="INJURY_UPDATE">Injury Update</option>
                                            <option value="WEATHER_ALERT">Weather Alert</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="broadcastToBots"
                                        checked={broadcastToBots}
                                        onChange={(e) => setBroadcastToBots(e.target.checked)}
                                        className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                    />
                                    <label htmlFor="broadcastToBots" className="text-sm font-medium text-gray-300">
                                        Broadcast to Telegram/WhatsApp bots
                                    </label>
                                </div>

                                <button
                                    onClick={publishAlert}
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    <Radio size={16} /> Broadcast Alert
                                </button>
                            </div>
                        </div>

                        {/* RECENT ALERTS */}
                        <div className="bg-[#121212] border border-red-500/50 rounded-xl p-6 shadow-2xl">
                            <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <Radio size={16} /> Recent Alerts
                            </h3>

                            {alerts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Siren size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No alerts broadcasted yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {alerts.slice(0, 5).map((alert: SystemAlert) => (
                                        <div key={alert.id} className="bg-black/40 border border-[#333] rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-red-400 text-sm mb-1">{alert.title}</h4>
                                                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{alert.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span className="bg-red-900/30 text-red-300 px-2 py-0.5 rounded">{alert.alertType}</span>
                                                        <span>{alert.league}</span>
                                                        <span>{alert.timestamp}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
