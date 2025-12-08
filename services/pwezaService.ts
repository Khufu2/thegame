const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ebfhyyznuzxwhirwlcds.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmh5eXpudXp4d2hpcndsY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY3NzMsImV4cCI6MjA4MDY5Mjc3M30.qbLe9x8PBrg8smjcx03MiStS6fNAqfF_jWZqFfOwyPA";

const PWEZA_URL = `${SUPABASE_URL}/functions/v1/pweza-chat`;

interface HistoryMessage {
  role: string;
  parts?: { text: string }[];
  text?: string;
  content?: string;
}

interface MatchContext {
  homeTeam: string;
  awayTeam: string;
  league: string;
  status: string;
  score?: string;
  odds?: { home: number | null; draw: number | null; away: number | null };
}

export const streamPwezaResponse = async (
  history: HistoryMessage[],
  newMessage: string,
  onChunk: (text: string) => void,
  matchContext?: MatchContext
) => {
  try {
    // Prepare messages for the API
    const messages = [
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        text: h.parts?.[0]?.text || h.text || h.content || ''
      })),
      { role: 'user', text: newMessage }
    ];

    const response = await fetch(PWEZA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ 
        messages,
        matchContext 
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      
      if (response.status === 429) {
        onChunk("⚠️ I'm getting a lot of requests right now. Please try again in a moment.");
        return;
      }
      if (response.status === 402) {
        onChunk("⚠️ AI credits are low. Please contact support to continue using Pweza.");
        return;
      }
      
      onChunk("Sorry, I'm having trouble connecting right now. Please try again.");
      console.error("Pweza API error:", error);
      return;
    }

    if (!response.body) {
      onChunk("No response received. Please try again.");
      return;
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      // Process line-by-line
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onChunk(content);
        } catch {
          // Incomplete JSON, wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onChunk(content);
        } catch { /* ignore */ }
      }
    }
  } catch (error) {
    console.error("Error in streamPwezaResponse:", error);
    onChunk("Sorry, I'm having trouble connecting to the sports database right now. Try again in a moment.");
  }
};
