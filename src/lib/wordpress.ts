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
 * Verifies that the WordPress URL and Application Password are valid.
 * Calls /wp-json/wp/v2/users/me to check auth status.
 */
export async function verifyWpConnection(
  wpUrl: string,
  username: string,
  appPassword: string
): Promise<boolean> {
  const normalized = normalizeWpUrl(wpUrl);
  const endpoint = `${normalized}/wp-json/wp/v2/users/me`;
  const credentials = Buffer.from(`${username}:${appPassword}`).toString("base64");

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) {
      const data = await res.json();
      console.log(`[WordPress Client] Connected successfully as user: ${data.name || username}`);
      return true;
    }
    
    console.log(`[WordPress Client] Authentication failed, status code: ${res.status}`);
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
  const normalized = normalizeWpUrl(wpUrl);
  const endpoint = `${normalized}/wp-json/wp/v2/posts`;
  const credentials = Buffer.from(`${username}:${appPassword}`).toString("base64");

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
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 201) {
      const data = await res.json();
      return {
        success: true,
        url: data.link, // Returns link to the WordPress preview / edit page
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
