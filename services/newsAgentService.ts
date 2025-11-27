
import { GoogleGenAI, Type } from "@google/genai";
import { Match, NewsStory, ArticleBlock } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found. AI features will be limited.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

interface GeneratedArticle {
    title: string;
    summary: string;
    blocks: ArticleBlock[];
    socialCaption?: string; // New field for Twitter/IG
}

// ---------------------------------------------------------------------------
// 🚨 CRITICAL ADVICE: NEWS API INTEGRATION 🚨
// ---------------------------------------------------------------------------
const performGroundingSearch = async (query: string): Promise<string> => {
    console.log(`[News Agent] Simulating search for: ${query}`);
    // Simulate finding external content
    if (query.includes('http')) {
        return "Simulated Scraped Content: This is the content extracted from the provided URL. It talks about a major player transfer and highlights a video clip of a goal.";
    }
    return "Simulated Search Result: The match ended 2-1. Key goal by Striker A in the 88th minute.";
}

export const generateMatchNews = async (
    match: Match | null,
    customTopic: string | null,
    tone: 'HYPE' | 'RECAP' | 'ANALYTICAL' | 'RUMOR',
    language: 'ENGLISH' | 'SWAHILI',
    persona: 'SHEENA' | 'ORACLE' | 'STREET' | 'JOURNALIST',
    useGrounding: boolean = false,
    externalLink?: string, // New input for scraping
    isLocalScout: boolean = false // New flag for Local Mode
): Promise<GeneratedArticle | null> => {
    const client = getClient();
    if (!client) return null;

    let contextData = "";
    if (externalLink) {
        contextData = `SOURCE URL: ${externalLink} (Extract key info and rewrite)`;
    } else if (match) {
        const boxScoreStr = match.boxScore ? JSON.stringify(match.boxScore) : "No box score available.";
        const scoreStr = match.score ? `${match.homeTeam.name} ${match.score.home} - ${match.score.away} ${match.awayTeam.name}` : "Match not started";
        contextData = `Match: ${match.homeTeam.name} vs ${match.awayTeam.name}\nScore: ${scoreStr}\nBox Score: ${boxScoreStr}`;
    } else if (customTopic) {
        contextData = `Topic: ${customTopic}`;
    }

    let groundingContext = "";
    if (useGrounding || externalLink || isLocalScout) {
        // If Local Scout mode, we search for the specific league/country
        const query = externalLink || (isLocalScout ? `Latest news, results, and top stories for ${customTopic}` : (match ? `${match.homeTeam.name} vs ${match.awayTeam.name} match report` : customTopic || "sports news"));
        groundingContext = await performGroundingSearch(query);
    }

    const prompt = `
    You are ${persona}. ${persona === 'STREET' ? 'Use slang, emojis, high energy.' : isLocalScout ? 'You are a dedicated Local Beat Writer covering local African leagues. Focus on grassroots heroes, local rivalries, and community impact.' : 'Be professional but engaging.'}

    TASK: Write a sports news article & a social media caption.
    ${isLocalScout ? 'SPECIAL INSTRUCTION: Focus on the specific local context of the league provided. Use local terminology if appropriate (e.g., "Oga", "Mzansi" depending on country).' : ''}
    
    CONTEXT:
    ${contextData}

    GROUNDED FACTS:
    ${groundingContext}

    TONE: ${tone}
    LANGUAGE: ${language}

    OUTPUT JSON FORMAT:
    {
      "title": "Catchy Headline",
      "summary": "1 sentence hook",
      "blocks": [ ... content blocks ... ],
      "socialCaption": "Short, viral tweet with hashtags"
    }
    
    IMPORTANT:
    - If the input is a URL, assume it contains a video and include a VIDEO block in the article.
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        socialCaption: { type: Type.STRING },
                        blocks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['TEXT', 'QUOTE', 'TWEET', 'VIDEO'] },
                                    content: { type: Type.STRING },
                                    text: { type: Type.STRING },
                                    author: { type: Type.STRING },
                                    handle: { type: Type.STRING },
                                    thumbnail: { type: Type.STRING },
                                    url: { type: Type.STRING },
                                    title: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || '{}');
        
        // Post-process blocks to ensure valid structure
        const blocks: ArticleBlock[] = (json.blocks || []).map((b: any) => {
            if (b.type === 'VIDEO') {
                return {
                    type: 'VIDEO',
                    url: b.url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Fallback
                    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000',
                    title: b.title || 'Watch Highlight'
                };
            }
            if (b.type === 'TWEET') {
                return {
                    type: 'TWEET',
                    id: Date.now().toString(),
                    author: 'Sheena Sports',
                    handle: '@SheenaApp',
                    text: b.text,
                    avatar: 'https://ui-avatars.com/api/?name=Sheena&background=6366F1&color=fff'
                };
            }
            if (b.type === 'QUOTE') {
                return {
                    type: 'QUOTE',
                    text: b.text,
                    author: b.author || 'Source',
                };
            }
            return { type: 'TEXT', content: b.content || b.text || '' };
        });

        return {
            title: json.title,
            summary: json.summary,
            blocks: blocks,
            socialCaption: json.socialCaption
        };

    } catch (e) {
        console.error("AI Generation Failed", e);
        return null;
    }
};
