
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Share2, MessageSquare, Bookmark, Flame, Twitter, ThumbsUp, Quote, Play, ImageOff, WifiOff, Loader2, ExternalLink, X, Copy, Send } from 'lucide-react';
import { NewsStory, ArticleBlock } from '../types';
import { useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';

interface ArticlePageProps {
  story: NewsStory;
  relatedStories: NewsStory[];
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ story, relatedStories }) => {
   const navigate = useNavigate();
   const { user, authToken } = useSports();
   const dataSaver = user?.preferences.dataSaver || false;
   const [showShareModal, setShowShareModal] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [story.id]);

  const goToSource = () => {
      // Navigate to the source/author profile
      navigate(`/source/${encodeURIComponent(story.source)}`);
  };

  const handleShareClick = () => {
    console.log('Share button clicked');
    setShowShareModal(true);
  };

  const performShare = async (method: 'native' | 'copy') => {
    const shareData = {
      title: story.title,
      text: story.summary || story.title,
      url: window.location.href,
    };

    try {
      if (method === 'native' && navigator.share) {
        await navigator.share(shareData);
        showSuccessMessage('Shared successfully!');
      } else {
        // Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        showSuccessMessage('Link copied to clipboard!');
      }

      // Track the share in database
      try {
        const response = await fetch('https://ebfhyyznuzxwhirwlcds.supabase.co/functions/v1/track-news-share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA'}`,
          },
          body: JSON.stringify({
            feedId: story.id,
            shareMethod: method,
          }),
        });

        if (!response.ok) {
          console.warn('Failed to track share, but sharing succeeded');
        }
      } catch (trackError) {
        console.warn('Error tracking share:', trackError);
      }

      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing:', error);
      showSuccessMessage('Link copied to clipboard as fallback!');
      setShowShareModal(false);
    }
  };

  const showSuccessMessage = (message: string) => {
    // Simple toast-like notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-bold';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white pb-[80px] relative z-50">
      
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur border-b border-gray-200 dark:border-[#2C2C2C] h-[60px] flex items-center justify-between px-4 transition-all">
        <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] rounded-full transition-colors">
              <ArrowLeft size={24} className="text-black dark:text-white" />
            </button>
            {dataSaver && <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-yellow-500/20"><WifiOff size={10} /> Data Saver</div>}
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] rounded-full transition-colors">
            <Bookmark size={24} className="text-gray-500 dark:text-[#A1A1A1]" />
          </button>
          <button
            onClick={handleShareClick}
            className="p-2 -mr-2 hover:bg-blue-500 hover:bg-opacity-20 rounded-full transition-colors border-2 border-transparent hover:border-blue-500"
            title="Share this article"
          >
            <Share2 size={24} className="text-gray-500 dark:text-[#A1A1A1] hover:text-blue-500" />
          </button>
        </div>
      </div>

      {/* HERO IMAGE - CONDITIONAL RENDER */}
      {dataSaver ? (
          <div className="w-full h-48 bg-[#121212] border-b border-[#2C2C2C] flex items-center justify-center relative overflow-hidden group cursor-pointer">
               <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-black/80"></div>
               {/* Pattern */}
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
               
               <div className="relative z-10 flex flex-col items-center gap-2 text-gray-500 group-hover:text-indigo-400 transition-colors">
                   <div className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center border border-[#333] group-hover:border-indigo-500/50">
                        <ImageOff size={24} />
                   </div>
                   <div className="text-center">
                       <span className="block text-[10px] font-bold uppercase tracking-wider">Image Hidden</span>
                       <span className="text-[9px] text-gray-600 group-hover:text-indigo-500/80">Tap to load (1.2MB)</span>
                   </div>
               </div>
          </div>
      ) : (
          <div className="w-full aspect-video relative bg-[#121212]">
            <img src={story.imageUrl} className="w-full h-full object-cover" alt={story.title} />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none md:hidden"></div>
          </div>
      )}

      {/* ARTICLE CONTENT CONTAINER */}
      <div className="max-w-[700px] mx-auto px-5 py-6">
        
        {/* METADATA TOP */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={goToSource} className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase px-2 py-1 tracking-widest rounded-sm hover:opacity-80 transition-opacity">
            {story.source}
          </button>
          <span className="text-[11px] font-bold text-gray-500 dark:text-[#A1A1A1] uppercase tracking-wide">
            {story.timestamp}
          </span>
        </div>

        {/* TITLE */}
        <h1 className="font-condensed font-black text-4xl md:text-5xl leading-[0.95] uppercase tracking-tighter mb-6 text-black dark:text-white">
          {story.title}
        </h1>

        {/* AUTHOR ROW */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-6 mb-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={goToSource}>
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300 dark:border-[#2C2C2C]">
                    {!dataSaver && <img src={story.authorAvatar || "https://ui-avatars.com/api/?name=BR"} className="w-full h-full object-cover" />}
                    {dataSaver && <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">{story.source[0]}</div>}
                </div>
                <div className="flex flex-col">
                    <span className="font-sans font-bold text-sm hover:underline">By {story.source} Staff</span>
                    <span className="text-xs text-gray-500 dark:text-[#A1A1A1]">National Lead Writer</span>
                </div>
            </div>
            <button onClick={goToSource} className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">
                View Profile
            </button>
        </div>

        {/* BODY CONTENT RENDERER */}
        <article className="prose dark:prose-invert prose-lg max-w-none">
            {story.contentBlocks && story.contentBlocks.length > 0 ? (
                story.contentBlocks.map((block, idx) => (
                    <ContentBlockRenderer key={idx} block={block} dataSaver={dataSaver} />
                ))
            ) : story.body && Array.isArray(story.body) ? (
                // Fallback for old string[] body
                story.body.map((paragraph, idx) => (
                     <p key={idx} className="mb-6 font-sans text-[17px] leading-[1.6] text-gray-800 dark:text-[#D1D1D1]">
                         {paragraph}
                     </p>
                ))
            ) : (
                <div className="text-center py-8">
                    <p className="font-sans text-lg text-gray-500 italic mb-4">No content available</p>
                    <p className="text-sm text-gray-400">This article may still be processing or content may be missing.</p>
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500">Debug Info:</p>
                        <p className="text-xs text-gray-400">contentBlocks: {story.contentBlocks ? 'present' : 'missing'}</p>
                        <p className="text-xs text-gray-400">body: {story.body ? 'present' : 'missing'}</p>
                    </div>
                </div>
            )}
        </article>

        {/* ENTITIES */}
        {story.entities && story.entities.length > 0 && (
            <div className="mt-8 mb-6">
                <h3 className="text-sm font-bold text-gray-500 dark:text-[#A1A1A1] uppercase tracking-wide mb-3">Related</h3>
                <div className="flex flex-wrap gap-2">
                    {story.entities.map(entity => (
                        <button
                            key={entity.id}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wide rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            {entity.name}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* CONTENT TAGS */}
        {(story.contentTags && story.contentTags.length > 0) || (story.tags && story.tags.length > 0) ? (
            <div className="flex flex-wrap gap-2 mt-8 mb-12">
                {/* Content tags */}
                {story.contentTags?.map(tag => (
                    <span key={tag.id} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded border ${
                        tag.type === 'category'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                            : tag.type === 'topic'
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                    }`}>
                        {tag.value}
                    </span>
                ))}
                {/* Legacy tags */}
                {story.tags?.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-100 dark:bg-[#1E1E1E] text-gray-600 dark:text-[#A1A1A1] text-xs font-bold uppercase tracking-wide rounded border border-gray-200 dark:border-[#2C2C2C]">
                        {tag}
                    </span>
                ))}
            </div>
        ) : null}

        {/* RELATED STORIES */}
        <div className="border-t-4 border-black dark:border-white pt-6 mt-8">
             <h3 className="font-condensed font-black text-2xl uppercase italic tracking-tighter mb-6">More For You</h3>
             <div className="space-y-6">
                 {relatedStories.map(related => (
                     <div key={related.id} onClick={() => { navigate(`/article/${related.id}`); window.scrollTo(0,0); }} className="flex gap-4 cursor-pointer group">
                         <div className="w-24 h-16 bg-gray-800 rounded overflow-hidden shrink-0 relative flex items-center justify-center border border-[#333]">
                             {dataSaver ? (
                                <ImageOff size={16} className="text-gray-600" />
                             ) : (
                                <img src={related.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                             )}
                         </div>
                         <div>
                             <h4 className="font-condensed font-bold text-lg leading-none uppercase mb-1 group-hover:underline underline-offset-2 decoration-2">
                                 {related.title}
                             </h4>
                             <span className="text-[10px] font-bold text-gray-500 dark:text-[#A1A1A1] uppercase">
                                 {related.timestamp} • {related.source}
                             </span>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

      </div>

      {/* STICKY BOTTOM ENGAGEMENT BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-[#2C2C2C] h-[60px] flex items-center justify-between px-6 z-50 md:max-w-[700px] md:mx-auto md:relative md:border-none md:bg-transparent md:mt-10">
          
          <div className="flex items-center gap-6">
               <button className="flex items-center gap-2 text-gray-500 dark:text-[#A1A1A1] hover:text-red-500 transition-colors group">
                   <Flame size={24} className="group-hover:fill-red-500 transition-colors" />
                   <span className="font-condensed font-bold text-lg hidden sm:block">{story.likes > 1000 ? (story.likes/1000).toFixed(1) + 'k' : story.likes}</span>
               </button>
               
               <button className="flex items-center gap-2 text-gray-500 dark:text-[#A1A1A1] hover:text-blue-500 transition-colors">
                   <MessageSquare size={22} />
                   <span className="font-condensed font-bold text-lg hidden sm:block">{story.comments}</span>
               </button>
          </div>

          <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1E1E1E] flex items-center justify-center text-gray-600 dark:text-white hover:bg-[#1DA1F2] hover:text-white transition-colors">
                  <Twitter size={18} />
              </button>
              <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1E1E1E] flex items-center justify-center text-gray-600 dark:text-white hover:bg-green-600 hover:text-white transition-colors">
                  <ThumbsUp size={18} />
              </button>
          </div>

      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#2C2C2C]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-condensed font-black text-xl uppercase tracking-tighter">Share Article</h3>
                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2C] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-[#A1A1A1] uppercase tracking-wide mb-2">Title</label>
                  <div className="p-3 bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-[#2C2C2C]">
                    <p className="text-sm font-medium">{story.title}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-[#A1A1A1] uppercase tracking-wide mb-2">Message</label>
                  <div className="p-3 bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-[#2C2C2C]">
                    <p className="text-sm">{story.summary || story.title}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-[#A1A1A1] uppercase tracking-wide mb-2">Link</label>
                  <div className="p-3 bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-[#2C2C2C]">
                    <p className="text-sm text-blue-600 dark:text-blue-400 break-all">{window.location.href}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => performShare('copy')}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#2C2C2C] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white py-3 px-4 rounded-xl font-bold uppercase text-sm tracking-wide transition-colors"
                >
                  <Copy size={18} />
                  Copy Link
                </button>
                {navigator.share && (
                  <button
                    onClick={() => performShare('native')}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold uppercase text-sm tracking-wide transition-colors"
                  >
                    <Send size={18} />
                    Share
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- RICH CONTENT BLOCK RENDERER ---
const ContentBlockRenderer: React.FC<{ block: ArticleBlock, dataSaver: boolean }> = ({ block, dataSaver }) => {
    switch (block.type) {
        case 'TEXT':
            return (
                <p className="mb-6 font-sans text-[17px] leading-[1.6] text-gray-800 dark:text-[#D1D1D1]">
                    {block.content}
                </p>
            );
        
        case 'IMAGE':
            if (dataSaver) return (
                <div className="my-8 p-6 bg-[#121212] border border-[#2C2C2C] rounded-lg text-center flex flex-col items-center gap-2">
                    <ImageOff size={20} className="text-gray-500" />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Image Hidden (Lite Mode)</span>
                </div>
            );
            return (
                <figure className="my-8">
                    <img src={block.url} alt={block.caption} className="w-full rounded-lg" />
                    {block.caption && (
                        <figcaption className="mt-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {block.caption}
                        </figcaption>
                    )}
                </figure>
            );

        case 'QUOTE':
            return (
                <blockquote className="border-l-4 border-indigo-600 pl-6 my-10 relative">
                    <Quote size={32} className="text-indigo-600/20 absolute -top-4 -left-2 fill-indigo-600" />
                    <p className="font-condensed font-bold text-2xl italic text-gray-900 dark:text-white mb-2 leading-tight">
                        "{block.text}"
                    </p>
                    <footer className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                        — {block.author}{block.role && `, ${block.role}`}
                    </footer>
                </blockquote>
            );

        case 'TWEET':
            return (
                <div className="my-8 mx-auto max-w-[500px] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-4 bg-white dark:bg-[#151515] shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                             <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                 {dataSaver ? (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center font-bold text-gray-500">
                                        {block.author[0]}
                                    </div>
                                 ) : (
                                    <img src={block.avatar || `https://ui-avatars.com/api/?name=${block.author}`} className="w-full h-full object-cover" />
                                 )}
                             </div>
                             <div className="leading-tight">
                                 <span className="block font-bold text-sm text-black dark:text-white">{block.author}</span>
                                 <span className="text-xs text-gray-500">{block.handle}</span>
                             </div>
                        </div>
                        <Twitter size={18} className="text-[#1DA1F2] fill-[#1DA1F2]" />
                    </div>
                    <p className="text-[15px] leading-normal text-black dark:text-gray-200 mb-2 whitespace-pre-wrap">
                        {block.text}
                    </p>
                    {block.url && (
                        <span className="text-xs text-[#1DA1F2] hover:underline cursor-pointer truncate block">
                            {block.url}
                        </span>
                    )}
                </div>
            );
        
        case 'VIDEO':
            if (dataSaver) {
                return (
                    <div className="my-8 p-4 bg-[#1E1E1E] rounded border border-[#333] flex items-center gap-3">
                         <Play size={20} className="text-gray-500" />
                         <span className="text-sm font-bold text-gray-400">Video Content Hidden (Lite Mode)</span>
                         <button className="ml-auto text-xs font-bold text-indigo-400">Load</button>
                    </div>
                )
            }
            return (
                <div className="my-8 relative group cursor-pointer rounded-xl overflow-hidden aspect-video bg-black">
                    <img src={block.thumbnail} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                            <Play size={32} className="text-white fill-white ml-2" />
                        </div>
                    </div>
                    {block.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                            <span className="text-white font-bold text-sm">{block.title}</span>
                        </div>
                    )}
                </div>
            );

        case 'LINK':
            return (
                <div className="my-8 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer" onClick={() => window.open(block.url, '_blank')}>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <ExternalLink size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-condensed font-bold text-lg text-blue-900 dark:text-blue-100 mb-2 group-hover:underline">
                                {block.title}
                            </h4>
                            {block.description && (
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3 leading-relaxed">
                                    {block.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                <span>Read Full Article</span>
                                <ExternalLink size={12} />
                            </div>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}
