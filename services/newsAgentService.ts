import { Match, ArticleBlock } from "../types";

const SUPABASE_URL = "https://ebfhyyznuzxwhirwlcds.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA";

interface GeneratedArticle {
    title: string;
    summary: string;
    blocks: ArticleBlock[];
    socialCaption?: string;
}

export const generateMatchNews = async (
    match: Match | null,
    customTopic: string | null,
    tone: 'HYPE' | 'RECAP' | 'ANALYTICAL' | 'RUMOR',
    language: 'ENGLISH' | 'SWAHILI',
    persona: 'SHEENA' | 'ORACLE' | 'STREET' | 'JOURNALIST',
    useGrounding: boolean = true,
    externalLink?: string,
    isLocalScout: boolean = false,
    aiProvider: 'GEMINI' | 'GROK' | 'OLLAMA' = 'GEMINI'
): Promise<GeneratedArticle | null> => {
    try {
        // Build the topic based on mode
        let topic = customTopic || "sports news";
        if (match) {
            topic = `${match.homeTeam.name} vs ${match.awayTeam.name} match`;
        }
        if (externalLink) {
            topic = `Rewrite and summarize: ${externalLink}`;
        }
        if (isLocalScout && customTopic) {
            topic = `Local African football news: ${customTopic}`;
        }

        // Call the generate-news edge function
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/generate-news`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                    match_id: match?.id,
                    persona,
                    tone,
                    language,
                    useGrounding,
                    aiProvider,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Generate news failed:', response.status, errorText);
            return null;
        }

        const result = await response.json();
        
        if (!result.success || !result.article) {
            console.error('Invalid response from generate-news:', result);
            return null;
        }

        const article = result.article;
        
        // Parse blocks if they're a string (JSON)
        let blocks: ArticleBlock[] = [];
        if (typeof article.blocks === 'string') {
            try {
                blocks = JSON.parse(article.blocks);
            } catch {
                blocks = [{ type: 'TEXT', content: article.blocks }];
            }
        } else if (Array.isArray(article.blocks)) {
            blocks = article.blocks;
        }

        return {
            title: article.title || 'News Update',
            summary: article.summary || '',
            blocks,
            socialCaption: article.socialCaption || '',
        };
    } catch (error) {
        console.error('Error generating news:', error);
        return null;
    }
};

// New function to share external news articles
export const shareExternalNews = async (
    url: string,
    source: string = 'External'
): Promise<GeneratedArticle | null> => {
    try {
        // Use Tavily search via the generate-news function to fetch and rewrite
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/generate-news`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: `Summarize and rewrite news from: ${url}`,
                    persona: 'JOURNALIST',
                    tone: 'RECAP',
                    language: 'ENGLISH',
                    useGrounding: true,
                }),
            }
        );

        if (!response.ok) {
            console.error('Share external news failed:', response.status);
            return null;
        }

        const result = await response.json();
        
        if (result.success && result.article) {
            const article = result.article;
            let blocks: ArticleBlock[] = [];
            if (typeof article.blocks === 'string') {
                try {
                    blocks = JSON.parse(article.blocks);
                } catch {
                    blocks = [{ type: 'TEXT', content: article.blocks }];
                }
            } else if (Array.isArray(article.blocks)) {
                blocks = article.blocks;
            }

            return {
                title: article.title,
                summary: article.summary,
                blocks,
                socialCaption: article.socialCaption,
            };
        }
        return null;
    } catch (error) {
        console.error('Error sharing external news:', error);
        return null;
    }
};
