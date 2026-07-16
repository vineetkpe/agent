import { generateStructuredJson } from "./aiProvider";
import { CrawledPage } from "./crawler";

export interface BusinessProfile {
  summary: string;
  industry: string;
  category: string;
  products: string[];
  services: string[];
  targetAudience: string;
  brandVoice: string;
  usps: string[];
  competitors: string[];
  confidenceScore: number;
}

const businessProfileSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    industry: { type: "STRING" },
    category: { type: "STRING" },
    products: { type: "ARRAY", items: { type: "STRING" } },
    services: { type: "ARRAY", items: { type: "STRING" } },
    targetAudience: { type: "STRING" },
    brandVoice: { type: "STRING" },
    usps: { type: "ARRAY", items: { type: "STRING" } },
    competitors: { type: "ARRAY", items: { type: "STRING" } },
    confidenceScore: { type: "NUMBER" },
  },
  required: [
    "summary",
    "industry",
    "category",
    "products",
    "services",
    "targetAudience",
    "brandVoice",
    "usps",
    "competitors",
    "confidenceScore",
  ],
};

export async function analyzeBusinessProfile(
  crawledPages: CrawledPage[],
  siteUrl: string,
  userId?: string
): Promise<BusinessProfile> {
  // 1. Build a token-efficient summary of the crawled site content
  // We prioritize the home page, about page, and services/products pages.
  const pagesSummary = crawledPages.map((page) => {
    // Check if it's likely home page, about, services, contact, pricing, etc.
    const isHome = page.url === siteUrl || page.url === siteUrl + "/";
    const path = new URL(page.url).pathname.toLowerCase();
    const pageType = isHome
      ? "Home/Landing Page"
      : path.includes("about")
      ? "About Us Page"
      : path.includes("service") || path.includes("product")
      ? "Services/Products Page"
      : path.includes("contact")
      ? "Contact Page"
      : path.includes("pricing")
      ? "Pricing Page"
      : "Subpage";

    return {
      url: page.url,
      type: pageType,
      title: page.title,
      metaDescription: page.metaDescription,
      headings: page.headings.slice(0, 8).map((h) => h.text),
      visibleText: page.visibleText || "",
      schemas: page.schemas.slice(0, 2),
    };
  });

  const prompt = `
You are an expert Business Intelligence Agent.
We have crawled and analyzed the website: ${siteUrl}.
Here is a structured, token-efficient digest of the website's top pages, their titles, headings, structural markup schema, and visible body copy:
${JSON.stringify(pagesSummary, null, 2)}

Your task is to analyze this website and extract complete Business Intelligence info to build a profile of the company behind this site.
Be extremely specific, accurate, and insightful. Avoid generic boilerplate descriptions.

Extract and return exactly a JSON object matching this schema:
{
  "summary": "Concise company summary including who they are, what they do, and where they operate if visible",
  "industry": "Broad industry classification (e.g. Technology, Construction, Retail, Hospitality, Legal, Professional Services)",
  "category": "Specific business category/niche (e.g. Local Plumbing Contractor, B2B SaaS for HR, Boutique Coffee Shop)",
  "products": ["List of physical or digital products sold by the business. Leave empty if they only offer services"],
  "services": ["List of services provided by the business. Leave empty if they only sell products"],
  "targetAudience": "Description of the target customers (demographics, job roles, or user needs)",
  "brandVoice": "Tone of voice and branding style (e.g. Professional, authoritative, friendly, high-tech, corporate)",
  "usps": ["List of 2-4 Unique Selling Points that make this business stand out from competitors based on the copy"],
  "competitors": ["Confidently inferred direct or indirect competitors based on text or market position (e.g. local plumbers in area, similar SaaS services). Leave empty if not confidently known"],
  "confidenceScore": 0.0 to 1.0 (Decimal score reflecting your analysis confidence level based on page data depth)
}
`;

  try {
    const profile = await generateStructuredJson<BusinessProfile>(
      prompt,
      businessProfileSchema,
      userId
    );
    return profile;
  } catch (error) {
    console.error("[Business Intelligence API Error]:", error);
    // Return a default structural fallback rather than crashing
    return {
      summary: `Business profile for ${siteUrl}`,
      industry: "Unknown",
      category: "Website Owner",
      products: [],
      services: [],
      targetAudience: "General visitors",
      brandVoice: "Neutral",
      usps: [],
      competitors: [],
      confidenceScore: 0.1,
    };
  }
}
