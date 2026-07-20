import { GoogleGenAI } from "@google/genai";

// Gemini AI Provider
// Schema generation prompt targets schema types: Product, Service, FAQPage, Organization, BreadcrumbList.
const apiKey = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const ai = apiKey && apiKey !== "mock-gemini-key" ? new GoogleGenAI({ apiKey }) : null;

export async function generateContent(prompt: string): Promise<string> {
  if (!ai) {
    throw new Error("Gemini API client not initialized.");
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });
  return response.text || "";
}

export async function generateStructuredJson<T>(prompt: string, responseSchema?: Record<string, unknown>): Promise<T> {
  if (!ai) {
    throw new Error("Gemini API client not initialized.");
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const text = response.text || "{}";
  return JSON.parse(text) as T;
}
