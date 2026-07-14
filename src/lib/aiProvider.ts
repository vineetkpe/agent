import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const isMock = !apiKey || apiKey === "mock-gemini-key";

// Initialize Gemini client if a real key is present
const ai = !isMock ? new GoogleGenAI({ apiKey }) : null;
const MODEL_NAME = "gemini-2.5-flash";

/**
 * Basic text generation function wrapper.
 */
export async function generateContent(prompt: string): Promise<string> {
  if (isMock || !ai) {
    console.log("[AI Provider] Using mock text generation.");
    return generateMockText(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("[AI Provider] Gemini API error:", error);
    // Fallback to mock on error to maintain app usability
    return generateMockText(prompt);
  }
}

/**
 * Structured JSON generation wrapper.
 * Uses Gemini's native JSON output mode.
 */
export async function generateStructuredJson<T>(prompt: string, responseSchema?: any): Promise<T> {
  if (isMock || !ai) {
    console.log("[AI Provider] Using mock JSON generation.");
    return generateMockJson<T>(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[AI Provider] Gemini JSON generation error:", error);
    return generateMockJson<T>(prompt);
  }
}

// ==========================================
// MOCK GENERATORS FOR OFFLINE / KEYLESS USE
// ==========================================

function generateMockText(prompt: string): string {
  if (prompt.toLowerCase().includes("blog post") || prompt.toLowerCase().includes("article")) {
    return `<h1>5 Smart Ways to Grow Your Local Business in 2026</h1>
<p>Marketing a local service business like a salon, plumbing service, or dental clinic doesn't have to cost thousands. Here are 5 practical strategies you can start today:</p>
<h2>1. Claim and Optimize Your Google Business Profile</h2>
<p>Make sure your name, address, and phone number (NAP) are identical across the web. Post photos weekly.</p>
<h2>2. Collect Reviews Constantly</h2>
<p>Send a quick text follow-up to every happy client. High star ratings drive local SEO rankings.</p>
<h2>3. Write Location-Specific Content</h2>
<p>Instead of general posts, write about "Top Plumbing Fixes in [City Name]".</p>`;
  }
  return "Mock generated response from AI Website Growth Agent.";
}

interface MockSeoFix {
  targetUrl: string;
  type: string;
  suggestedValue: string;
}

interface MockBlogPost {
  title: string;
  content: string;
  suggestedSlug: string;
}

interface MockAuditResult {
  fixes: MockSeoFix[];
  blogPosts: MockBlogPost[];
}

function generateMockJson<T>(prompt: string): T {
  const lowerPrompt = prompt.toLowerCase();
  // Check if we are auditing a site
  if (lowerPrompt.includes("audit") || lowerPrompt.includes("issues") || lowerPrompt.includes("crawled")) {
    const mockResponse: MockAuditResult = {
      fixes: [
        {
          targetUrl: "https://example.com/",
          type: "meta_title",
          suggestedValue: "Local Professional Services & Maintenance Specialists | Contact Us"
        },
        {
          targetUrl: "https://example.com/",
          type: "meta_description",
          suggestedValue: "Looking for trusted local maintenance and professional services? Connect with our experienced team today for reliable solutions, quick response times, and premium results."
        },
        {
          targetUrl: "https://example.com/",
          type: "schema_markup",
          suggestedValue: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Local Maintenance Specialists",
            "url": "https://example.com/",
            "logo": "https://example.com/logo.png",
            "description": "Premium local maintenance and support services for residential and commercial spaces."
          }, null, 2)
        },
        {
          targetUrl: "https://example.com/",
          type: "missing_alt",
          suggestedValue: "Team of local maintenance professionals repairing a residential pipeline system"
        },
        {
          targetUrl: "https://example.com/",
          type: "broken_link",
          suggestedValue: "Update broken link endpoint to target https://example.com/contact-us"
        }
      ],
      blogPosts: [
        {
          title: "How to Prevent Common Household Plumbing Emergencies",
          content: "<!-- wp:paragraph -->\n<p>Plumbing emergencies are stressful and costly. Here are key preventative steps...</p>\n<!-- /wp:paragraph -->\n<!-- wp:heading {\"level\":2} -->\n<h2>1. Regularly Inspect Valves</h2>\n<!-- /wp:heading -->\n<!-- wp:paragraph -->\n<p>Check the shutoff valves under your sinks and toilet at least twice a year...</p>\n<!-- /wp:paragraph -->",
          suggestedSlug: "prevent-common-plumbing-emergencies"
        },
        {
          title: "The Ultimate Local Business SEO Checklist for 2026",
          content: "<!-- wp:paragraph -->\n<p>Struggling to get local customers? In 2026, local SEO is more critical than ever. Follow these simple steps...</p>\n<!-- /wp:paragraph -->\n<!-- wp:heading {\"level\":2} -->\n<h2>Optimize Google Maps Listing</h2>\n<!-- /wp:heading -->\n<!-- wp:paragraph -->\n<p>Make sure your operational hours are current and respond to every client review...</p>\n<!-- /wp:paragraph -->",
          suggestedSlug: "local-seo-checklist-2026"
        }
      ]
    };
    return mockResponse as unknown as T;
  }

  return {} as T;
}
