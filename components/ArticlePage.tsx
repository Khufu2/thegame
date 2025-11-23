
import React, { useEffect } from 'react';
import { ArrowLeft, Share2, MessageSquare, Bookmark, Flame, Twitter, ThumbsUp, Quote, Play } from 'lucide-react';
import { NewsStory, ArticleBlock } from '../types';
import { useNavigate } from 'react-router-dom';

interface ArticlePageProps {
  story: NewsStory;
  relatedStories: NewsStory[];
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ story, relatedStories }) => {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [story.id]);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white pb-[80px] relative z-50">
      
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur border-b border-gray-200 dark:border-[#2C2C2C] h-[60px] flex items-center justify-between px-4 transition-all">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] rounded-full transition-colors">
          <ArrowLeft size={24} className="text-black dark:text-white" />
        </button>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] rounded-full transition-colors">
            <Bookmark size={24} className="text-gray-500 dark:text-[#A1A1A1]" />
          </button>
          <button className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] rounded-full transition-colors">
            <Share2 size={24} className="text-gray-500 dark:text-[#A1A1A1]" />
          </button>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div className="w-full aspect-video relative bg-[#121212]">
        <img src={story.imageUrl} className="w-full h-full object-cover" alt={story.title} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none md:hidden"></div>
      </div>

      {/* ARTICLE CONTENT CONTAINER */}
      <div className="max-w-[700px] mx-auto px-5 py-6">
        
        {/* METADATA TOP */}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase px-2 py-1 tracking-widest rounded-sm">
            {story.source}
          </span>
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
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300 dark:border-[#2C2C2C]">
                    <img src={story.authorAvatar || "https://ui-avatars.com/api/?name=BR"} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <span className="font-sans font-bold text-sm">By {story.source} Staff</span>
                    <span className="text-xs text-gray-500 dark:text-[#A1A1A1]">National Lead Writer</span>
                </div>
            </div>
            <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">
                Follow
            </button>
        </div>

        {/* BODY CONTENT RENDERER */}
        <article className="prose dark:prose-invert prose-lg max-w-none">
            {story.contentBlocks ? (
                story.contentBlocks.map((block, idx) => (
                    <ContentBlockRenderer key={idx} block={block} />
                ))
            ) : story.body ? (
                // Fallback for old string[] body
                story.body.map((paragraph, idx) => (
                     <p key={idx} className="mb-6 font-sans text-[17px] leading-[1.6] text-gray-800 dark:text-[#D1D1D1]">
                         {paragraph}
                     </p>
                ))
            ) : (
                <p className="font-sans text-lg text-gray-500 italic">Content loading...</p>
            )}
        </article>

        {/* TAGS */}
        <div className="flex flex-wrap gap-2 mt-8 mb-12">
            {story.tags?.map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-gray-100 dark:bg-[#1E1E1E] text-gray-600 dark:text-[#A1A1A1] text-xs font-bold uppercase tracking-wide rounded border border-gray-200 dark:border-[#2C2C2C]">
                    {tag}
                </span>
            ))}
        </div>

        {/* RELATED STORIES */}
        <div className="border-t-4 border-black dark:border-white pt-6 mt-8">
             <h3 className="font-condensed font-black text-2xl uppercase italic tracking-tighter mb-6">More For You</h3>
             <div className="space-y-6">
                 {relatedStories.map(related => (
                     <div key={related.id} onClick={() => { navigate(`/article/${related.id}`); window.scrollTo(0,0); }} className="flex gap-4 cursor-pointer group">
                         <div className="w-24 h-16 bg-gray-800 rounded overflow-hidden shrink-0">
                             <img src={related.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
    </div>
  );
};

// --- RICH CONTENT BLOCK RENDERER ---
const ContentBlockRenderer: React.FC<{ block: ArticleBlock }> = ({ block }) => {
    switch (block.type) {
        case 'TEXT':
            return (
                <p className="mb-6 font-sans text-[17px] leading-[1.6] text-gray-800 dark:text-[#D1D1D1]">
                    {block.content}
                </p>
            );
        
        case 'IMAGE':
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
                                 <img src={block.avatar || `https://ui-avatars.com/api/?name=${block.author}`} className="w-full h-full object-cover" />
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

        default:
            return null;
    }
}
