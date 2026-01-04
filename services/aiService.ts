import { GoogleGenAI } from "@google/genai";

export const streamAIResponse = async (
  apiKey: string,
  prompt: string,
  temperature: number,
  onChunk: (text: string) => void
) => {
  try {
    // Initialize Google GenAI Client
    const ai = new GoogleGenAI({ apiKey });
    
    // Use gemini-3-flash-preview for text generation tasks
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: temperature,
      }
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw new Error(error.message || "Unknown error occurred during AI generation");
  }
};

// New function for fetching real-time news using Google Search Grounding
export const fetchRealTimeNews = async (apiKey: string, siteName: string, topic: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key Missing");
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Supports Google Search tool
      contents: `Find the single most recent and important news headline from the website "${siteName}" related to "${topic}". 
      Return ONLY the headline text in Simplified Chinese. Do not add quotes, dates, or intro text. Keep it concise (under 25 words).`,
      config: {
        tools: [{ googleSearch: {} }], // Enable real-time search
        temperature: 0.3,
      }
    });

    const text = response.text;
    if (!text) return "暂无最新动态";
    return text.trim();
  } catch (error: any) {
    console.error("News Fetch Error:", error);
    return "获取失败 (请检查网络/Key)";
  }
};