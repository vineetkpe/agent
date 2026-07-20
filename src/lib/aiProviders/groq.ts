// Groq AI Provider
// Schema generation prompt targets schema types: Product, Service, FAQPage, Organization, BreadcrumbList.
const apiKey = process.env.GROQ_API_KEY;
const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function generateContent(prompt: string): Promise<string> {
  if (!apiKey || apiKey === "mock-groq-key") {
    throw new Error("Groq API key not configured.");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    const lowerError = errorText.toLowerCase();
    if (lowerError.includes("model") && (lowerError.includes("not found") || lowerError.includes("does not exist") || lowerError.includes("unknown model") || lowerError.includes("invalid"))) {
      throw new Error(`Configured model "${MODEL_NAME}" was rejected by Groq. Check GROQ_MODEL env var against the provider's current model list.`);
    }
    throw new Error(`Groq API returned status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

export async function generateStructuredJson<T>(prompt: string, responseSchema?: Record<string, unknown>): Promise<T> {
  if (!apiKey || apiKey === "mock-groq-key") {
    throw new Error("Groq API key not configured.");
  }

  const schemaStr = responseSchema ? JSON.stringify(responseSchema) : "";
  const modifiedPrompt = `${prompt}

IMPORTANT: You must respond with a JSON object that matches this JSON schema exactly:
${schemaStr}

Respond with ONLY valid JSON. Do NOT include markdown code blocks (e.g. \`\`\`json) or any other conversational text.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: "user", content: modifiedPrompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    const lowerError = errorText.toLowerCase();
    if (lowerError.includes("model") && (lowerError.includes("not found") || lowerError.includes("does not exist") || lowerError.includes("unknown model") || lowerError.includes("invalid"))) {
      throw new Error(`Configured model "${MODEL_NAME}" was rejected by Groq. Check GROQ_MODEL env var against the provider's current model list.`);
    }
    throw new Error(`Groq JSON API returned status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const rawText = (data?.choices?.[0]?.message?.content || "").trim();

  // Strip code block markers if the model included them anyway
  const cleanText = rawText
    .replace(/^```json\s*/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleanText) as T;
}
