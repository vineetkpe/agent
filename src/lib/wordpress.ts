import { isSafeUrlToFetch } from "./urlSafety";
import { sanitizeHtml } from "./sanitizer";

export interface WordPressConfig {
  wpUrl: string;
  username: string;
  appPassword: string;
}

/**
 * Normalizes a WordPress URL to make sure it includes protocol and has no trailing slash.
 */
export function normalizeWpUrl(url: string): string {
  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = "https://" + cleanUrl;
  }
  return cleanUrl.replace(/\/+$/, "");
}

/**
 * Probes the target URL using redirects to resolve the final destination domain and protocol.
 * This prevents auth headers from being stripped on redirects.
 */
async function resolveWpRedirectUrl(wpUrl: string): Promise<string> {
  const normalized = normalizeWpUrl(wpUrl);
  if (!(await isSafeUrlToFetch(normalized))) {
    throw new Error("SSRF Verification Failed: Initial target URL is unsafe.");
  }
  let resolved = normalized;
  try {
    const probe = await fetch(normalized, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (probe.url) {
      console.log(`[WordPress Connection] Resolved pre-probe redirect: ${normalized} -> ${probe.url}`);
      resolved = probe.url.replace(/\/+$/, "");
    }
  } catch (e) {
    console.error("[WordPress Connection] Pre-probe redirect resolution failed:", e);
  }

  if (!(await isSafeUrlToFetch(resolved))) {
    throw new Error("SSRF Verification Failed: Resolved redirected URL is unsafe.");
  }
  return resolved;
}

/**
 * Verifies that the WordPress URL and Application Password are valid.
 * Calls /wp-json/wp/v2/users/me to check auth status.
 */
export async function verifyWpConnection(
  wpUrl: string,
  username: string,
  appPassword: string
): Promise<boolean> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/users/me`;
  
  const cleanUsername = username.trim();
  const cleanAppPassword = appPassword.trim();
  const credentials = Buffer.from(`${cleanUsername}:${cleanAppPassword}`).toString("base64");

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) {
      const data = await res.json();
      console.log(`[WordPress Client] Connected successfully as user: ${data.name || cleanUsername}`);
      return true;
    }
    
    console.warn(`[WordPress Client] Authentication failed, status code: ${res.status}`);
    const textBody = await res.text().catch(() => "");
    console.warn(`[WordPress Client] Error body text:`, textBody.substring(0, 300));
    return false;
  } catch (err) {
    console.error("[WordPress Client] Connection failed:", err);
    return false;
  }
}

/**
 * Pushes a draft blog post to the connected WordPress site.
 */
export async function publishWpPost(
  wpUrl: string,
  username: string,
  appPassword: string,
  title: string,
  content: string,
  slug?: string,
  featuredMediaId?: number,
  categoryIds?: number[],
  tagIds?: number[]
): Promise<{ success: boolean; url?: string; id?: number; error?: string }> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/posts`;
  
  const cleanUsername = username.trim();
  const cleanAppPassword = appPassword.trim();
  const credentials = Buffer.from(`${cleanUsername}:${cleanAppPassword}`).toString("base64");

  try {
    const sanitizedContent = sanitizeHtml(content);
    const payload: any = {
      title,
      content: sanitizedContent,
      status: "draft", // V1 requires review, so we publish as draft
      slug: slug || undefined,
    };

    if (typeof featuredMediaId === "number") {
      payload.featured_media = featuredMediaId;
    }
    if (categoryIds && categoryIds.length > 0) {
      payload.categories = categoryIds;
    }
    if (tagIds && tagIds.length > 0) {
      payload.tags = tagIds;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 201) {
      const data = await res.json();
      return {
        success: true,
        url: data.link,
        id: data.id,
      };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.message || `WordPress API returned status ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error connection failed",
    };
  }
}

/**
 * Normalizes a URL for trailing slash and case comparison.
 */
function normalizeTrailingSlash(url: string): string {
  const clean = url.trim().replace(/\/+$/, "");
  return clean.toLowerCase();
}

/**
 * Detects whether Yoast SEO or RankMath is active on the site by parsing the wp-json index routes.
 */
export async function detectSeoPlugin(wpUrl: string): Promise<"yoast" | "rankmath" | "none"> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const endpoint = `${resolvedBaseUrl}/wp-json/`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) {
      const data = await res.json();
      const routes = data?.routes || {};
      const routeKeys = Object.keys(routes);
      const hasYoast = routeKeys.some((k) => k.includes("/yoast/v1"));
      const hasRankMath = routeKeys.some((k) => k.includes("/rankmath/v1"));

      if (hasYoast) return "yoast";
      if (hasRankMath) return "rankmath";
    }
  } catch (err) {
    console.error("[WordPress Client] detectSeoPlugin failed:", err);
  }
  return "none";
}

/**
 * Searches for a WordPress page or post ID that matches the targetUrl.
 * Queries pages and posts (up to 50 items each) and returns id and postType ('post' | 'page') if a match is found.
 */
export async function resolveWpPostIdFromUrl(
  wpUrl: string,
  username: string,
  appPassword: string,
  targetUrl: string
): Promise<{ id: number; type: "post" | "page" } | null> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const credentials = Buffer.from(`${username.trim()}:${appPassword.trim()}`).toString("base64");
  const normalizedTarget = normalizeTrailingSlash(targetUrl);

  const fetchItems = async (type: "post" | "page"): Promise<{ id: number; link: string }[]> => {
    const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/${type}s?per_page=50`;
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.status === 200) {
        const items = await res.json();
        if (Array.isArray(items)) {
          return items.map((item) => ({
            id: item.id,
            link: item.link || "",
          }));
        }
      }
    } catch (err) {
      console.error(`[WordPress Client] resolveWpPostIdFromUrl failed to fetch ${type}s:`, err);
    }
    return [];
  };

  // Check posts
  const posts = await fetchItems("post");
  for (const p of posts) {
    if (normalizeTrailingSlash(p.link) === normalizedTarget) {
      return { id: p.id, type: "post" };
    }
  }

  // Check pages
  const pages = await fetchItems("page");
  for (const p of pages) {
    if (normalizeTrailingSlash(p.link) === normalizedTarget) {
      return { id: p.id, type: "page" };
    }
  }

  return null;
}

/**
 * Updates a WordPress page/post title field via the REST API.
 */
export async function updateWpTitle(
  wpUrl: string,
  username: string,
  appPassword: string,
  postId: number,
  postType: "post" | "page",
  newTitle: string
): Promise<{ success: boolean; error?: string }> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/${postType}s/${postId}`;
  const credentials = Buffer.from(`${username.trim()}:${appPassword.trim()}`).toString("base64");

  try {
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      body: JSON.stringify({ title: newTitle }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) {
      return { success: true };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.message || `WordPress API returned status ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error or connection timeout",
    };
  }
}

/**
 * Updates a WordPress page/post meta description field (via Yoast or RankMath custom meta fields) via the REST API.
 */
export async function updateWpMetaDescription(
  wpUrl: string,
  username: string,
  appPassword: string,
  postId: number,
  postType: "post" | "page",
  plugin: "yoast" | "rankmath",
  newDesc: string
): Promise<{ success: boolean; error?: string }> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/${postType}s/${postId}`;
  const credentials = Buffer.from(`${username.trim()}:${appPassword.trim()}`).toString("base64");

  const metaKey = plugin === "yoast" ? "_yoast_wpseo_metadesc" : "rank_math_description";
  const payload = {
    meta: {
      [metaKey]: newDesc,
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) {
      const data = await res.json();
      const returnedMeta = data?.meta || {};
      if (returnedMeta[metaKey] === newDesc) {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Detected ${plugin === "yoast" ? "Yoast SEO" : "RankMath"} but automatic meta description update was not accepted by your site. Custom meta fields might not be registered to allow REST updates on your WordPress configuration.`,
        };
      }
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.message || `WordPress API returned status ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error or connection timeout",
    };
  }
}

export async function getWpPost(
  wpUrl: string,
  username: string,
  appPassword: string,
  postId: number,
  postType: "post" | "page"
): Promise<{ success: boolean; title?: string; metaDescription?: string; error?: string }> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/${postType}s/${postId}`;
  const credentials = Buffer.from(`${username.trim()}:${appPassword.trim()}`).toString("base64");

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) {
      const data = await res.json();
      const meta = data?.meta || {};
      return {
        success: true,
        title: data.title?.rendered || "",
        metaDescription: meta._yoast_wpseo_metadesc || meta.rank_math_description || "",
      };
    }
    return { success: false, error: `WordPress API returned status ${res.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function deleteWpPost(
  wpUrl: string,
  username: string,
  appPassword: string,
  postId: number,
  postType: "post" | "page"
): Promise<{ success: boolean; error?: string }> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/${postType}s/${postId}?force=true`;
  const credentials = Buffer.from(`${username.trim()}:${appPassword.trim()}`).toString("base64");

  try {
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) {
      return { success: true };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.message || `WordPress API returned status ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error or connection timeout",
    };
  }
}

/**
 * Downloads a remote image and uploads it to the WordPress media library.
 */
export async function uploadWpMedia(
  wpUrl: string,
  username: string,
  appPassword: string,
  imageUrl: string,
  filename: string,
  altText?: string
): Promise<number | null> {
  try {
    // 1. Fetch/download the image
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch remote image: ${imgRes.statusText}`);
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Resolve target URL
    const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
    const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/media`;

    const cleanUsername = username.trim();
    const cleanAppPassword = appPassword.trim();
    const credentials = Buffer.from(`${cleanUsername}:${cleanAppPassword}`).toString("base64");

    // Guess content type from filename or default to image/jpeg
    let contentType = "image/jpeg";
    if (filename.endsWith(".png")) contentType = "image/png";
    else if (filename.endsWith(".gif")) contentType = "image/gif";
    else if (filename.endsWith(".webp")) contentType = "image/webp";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": contentType,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      body: buffer,
      signal: AbortSignal.timeout(20000),
    });

    if (res.status === 201) {
      const data = await res.json();
      const mediaId = data.id;

      // Update alt_text if provided
      if (altText && mediaId) {
        try {
          await fetch(`${endpoint}/${mediaId}`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${credentials}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
            },
            body: JSON.stringify({ alt_text: altText }),
            signal: AbortSignal.timeout(5000),
          });
        } catch (altErr) {
          console.warn(`[WordPress Client] Failed to update media alt text for ID ${mediaId}:`, altErr);
        }
      }

      return mediaId;
    } else {
      const errText = await res.text().catch(() => "");
      console.warn(`[WordPress Client] Media upload returned status ${res.status}:`, errText);
      return null;
    }
  } catch (err) {
    console.error("[WordPress Client] uploadWpMedia failed:", err);
    return null;
  }
}

/**
 * Resolves an existing category/tag term by name, or creates it if missing.
 */
export async function resolveOrCreateWpTerm(
  wpUrl: string,
  username: string,
  appPassword: string,
  taxonomy: "categories" | "tags",
  name: string
): Promise<number | null> {
  const cleanName = name.trim();
  if (!cleanName) return null;

  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const route = taxonomy === "categories" ? "categories" : "tags";
  const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/${route}`;

  const cleanUsername = username.trim();
  const cleanAppPassword = appPassword.trim();
  const credentials = Buffer.from(`${cleanUsername}:${cleanAppPassword}`).toString("base64");

  try {
    // 1. Search for existing term
    const searchUrl = `${endpoint}?search=${encodeURIComponent(cleanName)}`;
    const searchRes = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results)) {
        // Find exact match case-insensitive
        const matched = results.find(
          (t: any) => t.name.toLowerCase().trim() === cleanName.toLowerCase()
        );
        if (matched && typeof matched.id === "number") {
          console.log(`[WordPress Client] Found existing ${taxonomy} term "${cleanName}" with ID ${matched.id}`);
          return matched.id;
        }
      }
    }

    // 2. Create the term if it doesn't exist
    console.log(`[WordPress Client] Term "${cleanName}" not found. Creating new ${taxonomy}...`);
    const createRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AntigravityGrowthAgent/1.0",
      },
      body: JSON.stringify({ name: cleanName }),
      signal: AbortSignal.timeout(8000),
    });

    if (createRes.status === 201) {
      const data = await createRes.json();
      console.log(`[WordPress Client] Created ${taxonomy} term "${cleanName}" with ID ${data.id}`);
      return data.id;
    } else {
      const errData = await createRes.json().catch(() => ({}));
      if (errData.code === "term_exists" && errData.data?.term_id) {
        return errData.data.term_id;
      }
      console.warn(`[WordPress Client] Failed to create ${taxonomy} term "${cleanName}":`, errData.message || createRes.status);
      return null;
    }
  } catch (err) {
    console.error(`[WordPress Client] resolveOrCreateWpTerm failed for ${taxonomy} "${cleanName}":`, err);
    return null;
  }
}


