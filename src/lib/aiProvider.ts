import * as geminiProvider from "./aiProviders/gemini";
import * as groqProvider from "./aiProviders/groq";
import * as openrouterProvider from "./aiProviders/openrouter";
import { prisma } from "./prisma";

interface CachedConfig {
  provider: string;
  isMock: boolean;
  resolvedAt: number;
}

let cachedConfig: CachedConfig | null = null;
const CACHE_TTL_MS = 30 * 1000;

export async function getActiveProviderConfig(): Promise<{ provider: string; isMock: boolean }> {
  const now = Date.now();
  if (cachedConfig && (now - cachedConfig.resolvedAt) < CACHE_TTL_MS) {
    return cachedConfig;
  }

  let resolvedProvider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  try {
    const settings = await prisma.appSettings.findFirst({
      where: { id: "singleton" },
    });
    if (settings?.aiProvider) {
      resolvedProvider = settings.aiProvider.toLowerCase();
    }
  } catch (err) {
    console.error("[AI Provider Cache] Failed to load settings from database:", err);
  }

  let resolvedIsMock = false;
  if (resolvedProvider === "groq") {
    const key = process.env.GROQ_API_KEY;
    resolvedIsMock = !key || key === "mock-groq-key";
  } else if (resolvedProvider === "openrouter") {
    const key = process.env.OPENROUTER_API_KEY;
    resolvedIsMock = !key || key === "mock-openrouter-key";
  } else {
    const key = process.env.GEMINI_API_KEY;
    resolvedIsMock = !key || key === "mock-gemini-key";
  }

  cachedConfig = {
    provider: resolvedProvider,
    isMock: resolvedIsMock,
    resolvedAt: now,
  };

  return cachedConfig;
}

// Async fire-and-forget logger helper
function logApiUsage(callType: string, success: boolean, provider: string, userId?: string) {
  prisma.apiUsageLog
    .create({
      data: {
        provider,
        callType,
        success,
        userId: userId || null,
      },
    })
    .catch((err) => {
      console.error("[AI Provider] Failed to log API usage:", err);
    });
}

/**
 * Basic text generation function wrapper.
 */
export async function generateContent(prompt: string, userId?: string): Promise<string> {
  const { provider, isMock } = await getActiveProviderConfig();

  if (isMock) {
    console.log(`[AI Provider] Using mock text generation (Provider: ${provider}).`);
    const result = generateMockText(prompt);
    logApiUsage("generateContent", false, provider, userId);
    return result;
  }

  try {
    let result = "";
    if (provider === "groq") {
      result = await groqProvider.generateContent(prompt);
    } else if (provider === "openrouter") {
      result = await openrouterProvider.generateContent(prompt);
    } else {
      result = await geminiProvider.generateContent(prompt);
    }

    logApiUsage("generateContent", true, provider, userId);
    return result;
  } catch (error: any) {
    console.error(`[AI Provider] REAL API FAILURE for ${provider} at generateContent:`, error);
    logApiUsage("generateContent", false, provider, userId);
    throw new Error(`AI provider '${provider}' call failed: ${error?.message || error}`);
  }
}

/**
 * Structured JSON generation wrapper.
 * Uses native JSON output mode or appends schema instructions.
 */
export async function generateStructuredJson<T>(
  prompt: string,
  responseSchema?: any,
  userId?: string
): Promise<T> {
  const { provider, isMock } = await getActiveProviderConfig();

  if (isMock) {
    console.log(`[AI Provider] Using mock JSON generation (Provider: ${provider}).`);
    const result = generateMockJson<T>(prompt);
    logApiUsage("generateStructuredJson", false, provider, userId);
    return result;
  }

  try {
    let result: T;
    if (provider === "groq") {
      result = await groqProvider.generateStructuredJson<T>(prompt, responseSchema);
    } else if (provider === "openrouter") {
      result = await openrouterProvider.generateStructuredJson<T>(prompt, responseSchema);
    } else {
      result = await geminiProvider.generateStructuredJson<T>(prompt, responseSchema);
    }

    logApiUsage("generateStructuredJson", true, provider, userId);
    return result;
  } catch (error: any) {
    console.error(`[AI Provider] REAL API FAILURE for ${provider} at generateStructuredJson:`, error);
    logApiUsage("generateStructuredJson", false, provider, userId);
    throw new Error(`AI provider '${provider}' call failed: ${error?.message || error}`);
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
  targetKeyword: string;
}

interface MockKeywordOpportunity {
  keyword: string;
  rationale: string;
  intent: string;
}

interface MockAuditResult {
  keywordOpportunities: MockKeywordOpportunity[];
  fixes: MockSeoFix[];
  blogPosts: MockBlogPost[];
}

function generateMockJson<T>(prompt: string): T {
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract target domain url from prompt to prevent example.com leak on fallback!
  let targetUrl = "https://example.com/";
  const match = prompt.match(/we audited the website:\s*(https?:\/\/[^\s]+)/i) || 
                prompt.match(/audited\s*(https?:\/\/[^\s]+)/i);
  if (match && match[1]) {
    targetUrl = match[1].replace(/[\.,;\s]+$/, "").replace(/\/+$/, "") + "/";
  }

  // Handle business profile requests
  if (lowerPrompt.includes("business profile") || lowerPrompt.includes("business intelligence")) {
    return {
      summary: `A leading hosting provider and domain registrar specialized in residential and commercial shared cloud hosting servers, offering robust DNS performance and 24/7 technical support.`,
      industry: "Technology",
      category: "Web Hosting & Cloud Services Provider",
      products: ["Shared SSD Cloud Hosting", "Dedicated Virtual Private Servers (VPS)", "Custom Domain Names"],
      services: ["24/7 Managed Server Support", "Free Website Migration Support", "Domain DNS Routing Setups"],
      targetAudience: "Small business owners, developers, and agency owners seeking reliable and fast web hosting services.",
      brandVoice: "Professional, authoritative, and friendly",
      usps: ["99.9% Server Uptime Guarantee", "Free Secure SSL Certificates Included", "Superfast NVMe SSD Storage"],
      competitors: ["GoDaddy", "Hostinger", "Bluehost"],
      confidenceScore: 0.92,
    } as unknown as T;
  }

  // Check if we are auditing a site
  if (lowerPrompt.includes("audit") || lowerPrompt.includes("issues") || lowerPrompt.includes("crawled")) {
    // Extract Business Profile details from prompt text if available
    let summary = "";
    let category = "";
    let industry = "";
    let services: string[] = [];

    const summaryMatch = prompt.match(/- Summary:\s*(.+)/i);
    if (summaryMatch && summaryMatch[1]) summary = summaryMatch[1].trim();

    const categoryMatch = prompt.match(/- Category:\s*(.+)/i);
    if (categoryMatch && categoryMatch[1]) category = categoryMatch[1].trim();

    const industryMatch = prompt.match(/- Industry:\s*(.+)/i);
    if (industryMatch && industryMatch[1]) industry = industryMatch[1].trim();

    const servicesMatch = prompt.match(/- Services:\s*(.+)/i) || prompt.match(/- Services Offered:\s*(.+)/i);
    if (servicesMatch && servicesMatch[1]) {
      services = servicesMatch[1].split(",").map(s => s.trim()).filter(Boolean);
    }

    const siteDomain = targetUrl.replace("https://", "").replace("http://", "").replace("www.", "").replace(/\/$/, "");
    const capitalizedName = siteDomain.split(".")[0].charAt(0).toUpperCase() + siteDomain.split(".")[0].slice(1);

    const isHosting = lowerPrompt.includes("hostamble") || category.toLowerCase().includes("host") || summary.toLowerCase().includes("host");

    // Dynamically build suggestions using business profile details
    let mockTitle = `Premium ${category || "Professional Solutions"} | ${capitalizedName}`;
    if (isHosting) {
      mockTitle = `Premium NVMe Web Hosting & VPS Servers | ${capitalizedName}`;
    }

    let mockDesc = `Looking for top-tier ${services.slice(0, 2).join(" or ") || "services"}? Connect with ${capitalizedName} today. ${summary ? summary.slice(0, 110) + "..." : "We deliver reliable, high-performance results."}`;
    if (isHosting) {
      mockDesc = `Empower your website with ${capitalizedName}'s premium NVMe SSD cloud hosting and secure VPS servers. Experience 99.9% uptime and 24/7 technical support.`;
    }

    let mockAlt = `Professional team delivering ${services[0] || "specialized services"} for our customers`;
    if (isHosting) {
      mockAlt = `Fast cloud servers dashboard running high performance websites`;
    }

    const kw1 = isHosting ? "nvme ssd cloud hosting advantages" : `local ${category || "service"} provider`;
    const kw2 = isHosting ? "managed vps servers for small business" : `best ${category || "services"} near me`;

    const mockResponse: MockAuditResult = {
      keywordOpportunities: [
        {
          keyword: kw1,
          rationale: "High local search volume with low initial content competition.",
          intent: "informational"
        },
        {
          keyword: kw2,
          rationale: "Highly transactional intent, matches commercial customer queries.",
          intent: "transactional"
        }
      ],
      fixes: [
        {
          targetUrl: targetUrl,
          type: "meta_title",
          suggestedValue: mockTitle,
        },
        {
          targetUrl: targetUrl,
          type: "meta_description",
          suggestedValue: mockDesc,
        },
        {
          targetUrl: targetUrl,
          type: "schema_markup",
          suggestedValue: JSON.stringify(
            {
              "@context": "https://schema.org",
              "@type": isHosting ? "Organization" : "LocalBusiness",
              "name": capitalizedName,
              "url": targetUrl,
              "logo": `${targetUrl}logo.png`,
              "description": summary || `${capitalizedName} provides premium service solutions and customer support.`,
            },
            null,
            2
          ),
        },
        {
          targetUrl: targetUrl,
          type: "missing_alt",
          suggestedValue: mockAlt,
        },
        {
          targetUrl: targetUrl,
          type: "broken_link",
          suggestedValue: `Update broken link endpoint to target ${targetUrl}contact-us`,
        },
      ],
      blogPosts: [
        {
          title: isHosting 
            ? "How Premium NVMe Web Hosting Boosts Your Site Speed & Core Web Vitals"
            : `How to Choose the Best ${category || "Professional Service"} for Your Business`,
          content: isHosting 
            ? "<!-- wp:paragraph -->\n<p>Uptime and page speeds are essential ranking elements on search results. Investing in SSD server storage makes a massive difference...</p>\n<!-- /wp:paragraph -->\n<!-- wp:heading {\"level\":2} -->\n<h2>1. Switch to NVMe SSD Storage Hosting</h2>\n<!-- /wp:heading -->\n<!-- wp:paragraph -->\n<p>Older server systems use mechanical HDDs, which drag load speeds down. NVMe options retrieve files instantly...</p>\n<!-- /wp:paragraph -->"
            : `<!-- wp:paragraph -->\n<p>Choosing a reliable contractor or partner is crucial for long term success. Here are key criteria to look for...</p>\n<!-- /wp:paragraph -->`,
          suggestedSlug: isHosting ? "hosting-speed-core-web-vitals" : "choose-best-service-provider",
          targetKeyword: kw1,
        },
        {
          title: isHosting
            ? `5 Security Standards to Protect Your Cloud Server from Vulnerabilities`
            : `Top Service and Maintenance Checklists You Need to Know`,
          content: isHosting
            ? "<!-- wp:paragraph -->\n<p>Server exploits can destroy your reputation. Lock down your website with free SSL credentials, strong credentials, and isolated profiles...</p>\n<!-- /wp:paragraph -->"
            : "<!-- wp:paragraph -->\n<p>Regular inspections prevent costly emergency fixes down the road. Set up scheduled checkups at least twice a year...</p>\n<!-- /wp:paragraph -->",
          suggestedSlug: isHosting ? "protect-server-security" : "essential-maintenance-checklist",
          targetKeyword: kw2,
        },
      ],
    };
    return mockResponse as unknown as T;
  }

  return {} as T;
}
