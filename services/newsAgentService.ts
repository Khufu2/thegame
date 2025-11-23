
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
}

export const generateMatchNews = async (
    match: Match,
    tone: 'HYPE' | 'RECAP' | 'ANALYTICAL' | 'RUMOR',
    language: 'ENGLISH' | 'SWAHILI'
): Promise<GeneratedArticle | null> => {
    const client = getClient();
    if (!client) return null;

    // Construct the context prompt
    const boxScoreStr = match.boxScore ? JSON.stringify(match.boxScore) : "No box score available.";
    const scoreStr = match.score ? `${match.homeTeam.name} ${match.score.home} - ${match.score.away} ${match.awayTeam.name}` : "Match not started";
    const statusStr = match.status;

    const prompt = `
    You are 'Sheena Agent', a top-tier sports journalist for a premium app called 'Sheena Sports'.
    Write a news article about this match:
    Match: ${match.homeTeam.name} vs ${match.awayTeam.name}
    League: ${match.league}
    Score/Status: ${scoreStr} (${statusStr})
    Box Score Data: ${boxScoreStr}

    TONE: ${tone}
    LANGUAGE: ${language === 'SWAHILI' ? 'Swahili (Use engaging "Sheng" slang where appropriate for hype)' : 'English (Premium, Professional but engaging)'}

    REQUIREMENTS:
    1. Create a catchy Title.
    2. Create a 1-sentence Summary.
    3. Generate the article body as a list of "Blocks".
    4. IF Box Score data is present, analyze the stats and mention top performers in the text.
    5. Include a "TWEET" block at the end that is perfect for social media sharing (short, hashtags).
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
                        blocks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['TEXT', 'QUOTE', 'TWEET'] },
                                    content: { type: Type.STRING, description: "For TEXT type" },
                                    text: { type: Type.STRING, description: "For QUOTE or TWEET type" },
                                    author: { type: Type.STRING },
                                    handle: { type: Type.STRING },
                                    role: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || '{}');
        
        // Map the raw JSON to our internal ArticleBlock type
        const blocks: ArticleBlock[] = (json.blocks || []).map((b: any) => {
            if (b.type === 'TWEET') {
                return {
                    type: 'TWEET',
                    id: Date.now().toString(),
                    author: 'Sheena Sports',
                    handle: '@SheenaSports',
                    text: b.text,
                    avatar: 'https://ui-avatars.com/api/?name=Sheena&background=6366F1&color=fff'
                };
            }
            if (b.type === 'QUOTE') {
                return {
                    type: 'QUOTE',
                    text: b.text,
                    author: b.author || 'Key Player',
                    role: b.role || 'Star'
                };
            }
            return { type: 'TEXT', content: b.content || b.text };
        });

        return {
            title: json.title,
            summary: json.summary,
            blocks: blocks
        };

    } catch (e) {
        console.error("AI Generation Failed", e);
        return null;
    }
};
