
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

//const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || "" });

export const getAIFeedback = async (
  guess: number, 
  target: number, 
  history: number[],
  status: 'UP' | 'DOWN' | 'CORRECT'
): Promise<AIResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user guessed ${guess}. The target number is ${target}. The hint is ${status}. Previous guesses: [${history.join(', ')}]. Provide a very short, witty, and encouraging comment as a Game Master in Korean.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: "A witty comment in Korean" },
            emoji: { type: Type.STRING, description: "A relevant emoji" }
          },
          required: ["message", "emoji"]
        }
      }
    });

    return JSON.parse(response.text || '{"message": "계속해봐요!", "emoji": "🤔"}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      message: status === 'UP' ? "더 높은 숫자예요!" : status === 'DOWN' ? "더 낮은 숫자예요!" : "정답입니다!",
      emoji: status === 'CORRECT' ? "🎉" : "💡"
    };
  }
};
