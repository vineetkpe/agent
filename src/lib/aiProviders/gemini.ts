import { GoogleGenAI } from "@google/genai";

// Gemini AI Provider
// Schema generation prompt targets schema types: Product, Service, FAQPage, Organization, BreadcrumbList.
const apiKey = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const ai = apiKey && apiKey !== "mock-gemini-key" ? new GoogleGenAI({ apiKey }) : null;

export interface ProviderResponse<T> {
  result: T;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export async function generateContent(prompt: string): Promise<ProviderResponse<string>> {
  if (!ai) {
    throw new Error("Gemini API client not initialized.");
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  const usage = response.usageMetadata;
  return {
    result: response.text || "",
    model: MODEL_NAME,
    inputTokens: usage?.promptTokenCount ?? undefined,
    outputTokens: usage?.candidatesTokenCount ?? undefined,
  };
}

export async function generateStructuredJson<T>(
  prompt: string,
  responseSchema?: Record<string, unknown>
): Promise<ProviderResponse<T>> {
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
  const usage = response.usageMetadata;
  return {
    result: JSON.parse(text) as T,
    model: MODEL_NAME,
    inputTokens: usage?.promptTokenCount ?? undefined,
    outputTokens: usage?.candidatesTokenCount ?? undefined,
  };
}
