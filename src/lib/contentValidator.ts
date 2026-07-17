function countWords(html: string): number {
  // Strip HTML tags and split by spaces to count words accurately
  const text = html.replace(/<[^>]*>/g, " ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface ValidationResult {
  passed: boolean;
  failures: string[];
  checks: {
    titleLengthPassed: boolean;
    metaLengthPassed: boolean;
    wordCountPassed: boolean;
    internalLinksPassed: boolean;
  };
}

export function validateSeoContent(post: {
  title: string;
  content: string;
  metaDescription: string;
  targetKeyword: string;
  intent?: string;
}, siteUrl: string): ValidationResult {
  const failures: string[] = [];

  // 1. Title tag length: 50-60 characters
  const titleLen = post.title?.length || 0;
  const titleLengthPassed = titleLen >= 50 && titleLen <= 60;
  if (!titleLengthPassed) {
    failures.push(
      `Title must be between 50 and 60 characters (currently ${titleLen} characters: "${post.title}").`
    );
  }

  // 2. Meta description length: 150-160 characters
  const metaLen = post.metaDescription?.length || 0;
  const metaLengthPassed = metaLen >= 150 && metaLen <= 160;
  if (!metaLengthPassed) {
    failures.push(
      `Meta description must be between 150 and 160 characters (currently ${metaLen} characters).`
    );
  }

  // 3. Word count: min 1200 for local-service/transactional keywords, min 600 for simple informational/FAQ pages
  const wordCount = countWords(post.content || "");
  const isTransactional =
    post.intent === "transactional" ||
    /near me|service|repair|pricing|cost|plumber|electrician|salon|dental|dentist/i.test(
      post.targetKeyword || ""
    );
  const minWords = isTransactional ? 1200 : 600;
  const wordCountPassed = wordCount >= minWords;
  if (!wordCountPassed) {
    failures.push(
      `Word count is ${wordCount}, which is below the minimum of ${minWords} words for a ${
        isTransactional ? "transactional/local service" : "simple informational"
      } page.`
    );
  }

  // 4. H1 tag: exactly one H1 per page, contains target keyword, distinct from title tag
  const h1Matches = post.content?.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length !== 1) {
    failures.push(`Page must contain exactly one H1 heading (found ${h1Matches.length}).`);
  } else {
    const h1Text = h1Matches[0].replace(/<[^>]*>/g, "").trim().toLowerCase();
    const keyword = post.targetKeyword?.toLowerCase() || "";
    if (keyword && !h1Text.includes(keyword)) {
      failures.push(`H1 heading must contain the primary keyword "${post.targetKeyword}".`);
    }
    if (post.title && h1Text === post.title.toLowerCase().trim()) {
      failures.push("H1 heading must be distinct from the title tag wording.");
    }
  }

  // Extract all hrefs from the content
  const hrefs: string[] = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(post.content || "")) !== null) {
    hrefs.push(match[1]);
  }

  const origin = new URL(siteUrl).origin.toLowerCase();

  // 5. Internal links: minimum 2
  const internalLinks = hrefs.filter((link) => {
    const l = link.toLowerCase();
    return l.startsWith("/") || l.startsWith(origin);
  });
  const internalLinksPassed = internalLinks.length >= 2;
  if (!internalLinksPassed) {
    failures.push(`Must have at least 2 internal links (found ${internalLinks.length}).`);
  }

  // 6. External links: minimum 1
  const externalLinks = hrefs.filter((link) => {
    const l = link.toLowerCase();
    return l.startsWith("http") && !l.startsWith(origin);
  });
  if (externalLinks.length < 1) {
    failures.push(`Must have at least 1 outbound authority link (found ${externalLinks.length}).`);
  }

  return {
    passed: failures.length === 0,
    failures,
    checks: {
      titleLengthPassed,
      metaLengthPassed,
      wordCountPassed,
      internalLinksPassed,
    },
  };
}
