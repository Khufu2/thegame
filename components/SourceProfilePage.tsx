
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';
import { ArrowLeft, Check, Plus, Twitter, Globe, Users, Newspaper } from 'lucide-react';
import { StandardNewsCard, HeroNewsCard } from './Feed'; // Reusing cards
import { NewsStory } from '../types';

export const SourceProfilePage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { news, user, updatePreferences } = useSports();

    // Mock Source Data (In production, fetch based on ID)
    // We try to find the source details from the first news item matching the source name or ID
    const sourceName = id ? decodeURIComponent(id) : 'Unknown Source';
    
    // Filter news for this source
    const sourceNews = useMemo(() => {
        return news.filter(n => n.source === sourceName || n.author === sourceName);
    }, [news, sourceName]);

    const isFollowing = user?.preferences.followedSources?.includes(sourceName) || false;

    const toggleFollow = () => {
        if (!user) return alert("Please sign in to follow sources.");
        const current = user.preferences.followedSources || [];
        let newSources;
        if (current.includes(sourceName)) {
            newSources = current.filter(s => s !== sourceName);
        } else {
            newSources = [...current, sourceName];
        }
        updatePreferences({ followedSources: newSources });
    };

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 h-[60px] flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#1E1E1E] rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </button>
                <span className="font-condensed font-black text-xl uppercase italic tracking-tighter">Source Profile</span>
            </div>

            {/* Profile Hero */}
            <div className="relative bg-[#1E1E1E] border-b border-[#2C2C2C] pb-8 pt-12 px-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-black bg-gray-800 mb-4 shadow-xl relative">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${sourceName}&background=random`} 
                        className="w-full h-full rounded-full object-cover" 
                    />
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-black">
                        <Twitter size={14} fill="currentColor" />
                    </div>
                </div>
                
                <h1 className="font-condensed font-black text-3xl uppercase text-white mb-1">{sourceName}</h1>
                <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                    Top tier sports journalism. Breaking news, transfer rumors, and in-depth analysis.
                </p>

                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase mb-6">
                    <div className="flex items-center gap-1">
                        <Newspaper size={14} /> {sourceNews.length} Stories
                    </div>
                    <div className="flex items-center gap-1">
                        <Users size={14} /> 1.2M Followers
                    </div>
                </div>

                <button 
                    onClick={toggleFollow}
                    className={`px-8 py-3 rounded-full font-condensed font-black uppercase text-sm flex items-center gap-2 transition-all ${isFollowing ? 'bg-transparent border border-gray-600 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                    {isFollowing ? <><Check size={16} /> Following</> : <><Plus size={16} /> Follow Source</>}
                </button>
            </div>

            {/* News Feed */}
            <div className="max-w-[800px] mx-auto p-4">
                <h3 className="font-condensed font-bold text-lg uppercase text-gray-400 mb-4 pl-2">Latest from {sourceName}</h3>
                
                {sourceNews.length > 0 ? (
                    <div className="space-y-4">
                        {sourceNews.map(story => (
                             story.isHero 
                             ? <HeroNewsCard key={story.id} story={story} onClick={() => navigate(`/article/${story.id}`)} />
                             : <StandardNewsCard key={story.id} story={story} onClick={() => navigate(`/article/${story.id}`)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <Newspaper size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="uppercase font-bold">No stories found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
