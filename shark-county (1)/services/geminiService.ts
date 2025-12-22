
import { GoogleGenAI } from "@google/genai";

/**
 * Searches for nearby pool halls using Gemini's search grounding.
 */
export async function getNearbyPoolHalls(lat: number, lng: number, radius: number) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `List the names and web addresses of highly rated pool halls, billiards clubs, or sports bars with pool tables within a ${radius} mile radius of coordinates ${lat}, ${lng}.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract chunks from grounding metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && chunks.length > 0) {
      return chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
    }

    return null;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return null;
  }
}
