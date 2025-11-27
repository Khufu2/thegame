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

// ---------------------------------------------------------------------------
// 🚨 CRITICAL ADVICE: NEWS API INTEGRATION 🚨
// ---------------------------------------------------------------------------
// The AI Agent (Gemini) does NOT have real-time knowledge of events happening
// right now (e.g., a goal scored 5 mins ago). It needs "Grounding".
// 
// To make this agent fully functional for live news, you MUST implement the
// function below using a real search API.
// 
// Recommended APIs:
// 1. Tavily AI (https://tavily.com) - Optimized for LLM RAG/Grounding.
// 2. Google Custom Search JSON API.
// ---------------------------------------------------------------------------

const performGroundingSearch = async (query: string): Promise<string> => {
    console.log(`[News Agent] Simulating search for: ${query}`);
    
    // --- TODO: IMPLEMENT REAL SEARCH HERE ---
    // Example Tavily Implementation:
    // try {
    //    const response = await fetch("https://api.tavily.com/search", {
    //        method: "POST",
    //        headers: { 'Content-Type': 'application/json' },
    //        body: JSON.stringify({ query: query, api_key: "YOUR_TAVILY_KEY" })
    //    });
    //    const data = await response.json();
    //    return data.results.map(r => r.content).join("\n");
    // } catch (e) { return "Search failed"; }

    // Current Mock Behavior:
    return "Simulated Search Result: The match ended 2-1. Key goal by Striker A in the 88th minute. Controversy over a penalty decision. Fans are calling it the comeback of the season.";
}

export const generateMatchNews = async (
    match: Match | null,
    customTopic: string | null,
    tone: 'HYPE' | 'RECAP' | 'ANALYTICAL' | 'RUMOR',
    language: 'ENGLISH' | 'SWAHILI',
    persona: 'SHEENA' | 'ORACLE' | 'STREET' | 'JOURNALIST',
    useGrounding: boolean = false
): Promise<GeneratedArticle | null> => {
    const client = getClient();
    if (!client) return null;

    let contextData = "";
    if (match) {
        const boxScoreStr = match.boxScore ? JSON.stringify(match.boxScore) : "No box score available.";
        const scoreStr = match.score ? `${match.homeTeam.name} ${match.score.home} - ${match.score.away} ${match.awayTeam.name}` : "Match not started";
        const statusStr = match.status;
        contextData = `Match: ${match.homeTeam.name} vs ${match.awayTeam.name}\nLeague: ${match.league}\nScore/Status: ${scoreStr} (${statusStr})\nBox Score Data: ${boxScoreStr}`;
    } else if (customTopic) {
        contextData = `Custom Topic: ${customTopic}`;
    }

    let groundingContext = "";
    if (useGrounding) {
        // Construct a query optimized for search engines
        const query = match ? `${match.homeTeam.name} vs ${match.awayTeam.name} ${match.league} match report quotes stats today` : `${customTopic} sports news latest updates`;
        groundingContext = await performGroundingSearch(query);
    }

    // Persona Logic
    let personaInstruction = "";
    switch (persona) {
        case 'SHEENA':
            personaInstruction = "You are Sheena, a sharp, data-driven, and professional sports journalist. Focus on stats, tactical shifts, and betting angles.";
            break;
        case 'ORACLE':
            personaInstruction = "You are 'The Oracle'. You write in cryptic, ancient, wise metaphors. You speak of players as warriors and gladiators. Use historical references and destiny metaphors.";
            break;
        case 'STREET':
            personaInstruction = "You are a hype-man. Use slang, high energy, exclamation marks, and focus on the excitement/drama. Great for social media. Use emojis.";
            break;
        case 'JOURNALIST':
            personaInstruction = "Standard objective reporting style. Neutral, factual, and concise (Associated Press style).";
            break;
    }

    const prompt = `
    ${personaInstruction}

    Write a news article based on the following context:
    ${contextData}

    GROUNDING CONTEXT (Real World Data - Use this for facts):
    ${useGrounding ? groundingContext : "N/A - Use internal data only."}

    TONE: ${tone}
    LANGUAGE: ${language === 'SWAHILI' ? 'Swahili (Use engaging "Sheng" slang where appropriate for hype)' : 'English'}

    REQUIREMENTS:
    1. Create a catchy Title appropriate for the persona.
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
        
        const blocks: ArticleBlock[] = (json.blocks || []).map((b: any) => {
            if (b.type === 'TWEET') {
                return {
                    type: 'TWEET',
                    id: Date.now().toString(),
                    author: persona === 'SHEENA' ? 'Sheena Sports' : (persona === 'ORACLE' ? 'The Oracle' : 'Sheena Hype'),
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