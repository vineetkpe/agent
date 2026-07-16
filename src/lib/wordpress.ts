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
      return probe.url.replace(/\/+$/, "");
    }
  } catch (e) {
    console.error("[WordPress Connection] Pre-probe redirect resolution failed:", e);
  }
  return normalized;
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
  slug?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const resolvedBaseUrl = await resolveWpRedirectUrl(wpUrl);
  const endpoint = `${resolvedBaseUrl}/wp-json/wp/v2/posts`;
  
  const cleanUsername = username.trim();
  const cleanAppPassword = appPassword.trim();
  const credentials = Buffer.from(`${cleanUsername}:${cleanAppPassword}`).toString("base64");

  try {
    const payload = {
      title,
      content,
      status: "draft", // V1 requires review, so we publish as draft
      slug: slug || undefined,
    };

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
      };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.message || `WordPress API returned status ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error connection failed",
    };
  }
}
