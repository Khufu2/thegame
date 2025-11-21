import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found. Pweza features will be limited.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const streamPwezaResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  onChunk: (text: string) => void
) => {
  const client = getClient();
  if (!client) {
    onChunk("I need an API key to function correctly. Please configure it in the settings.");
    return;
  }

  try {
    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are Pweza, a world-class AI sports betting assistant and football analyst integrated into the Sheena Sports app. 
        Your tone is sharp, data-driven, slightly witty, and similar to a seasoned sports bettor or expert pundit.
        
        Capabilities:
        1. Analyze matches based on form, injuries, and historical data.
        2. Suggest "Value Bets" but always advise responsible gambling (bankroll management).
        3. Explain complex stats (xG, PPDA) simply.
        4. If asked about a specific match, assume the user wants a prediction or tactical breakdown.
        
        Keep responses concise (under 150 words) unless asked for a "deep dive". Use emojis sparingly.
        `,
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessageStream({ message: newMessage });
    
    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Error calling Gemini:", error);
    onChunk("Sorry, I'm having trouble connecting to the sports database right now. Try again in a moment.");
  }
};