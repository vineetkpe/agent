import { prisma } from "./prisma";

async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET environment variables.");
  }
  
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh Google access token: ${response.statusText}. Details: ${errorBody}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

export async function fetchSearchConsoleData(site: any): Promise<any[]> {
  // Check 24-hour cache first
  const cacheAgeMs = Date.now() - (site.gscLastSyncedAt ? new Date(site.gscLastSyncedAt).getTime() : 0);
  if (site.gscCachedData && cacheAgeMs < 24 * 60 * 60 * 1000) {
    try {
      console.log(`[GSC Client] Returning cached query analytics data for site URL: ${site.url}`);
      return JSON.parse(site.gscCachedData);
    } catch (e) {
      console.error("[GSC Client] Failed to parse cached GSC data, re-fetching...", e);
    }
  }

  if (!site.googleRefreshTokenEncrypted) {
    throw new Error("Search Console refresh token is missing.");
  }
  
  const { decrypt } = await import("./crypto");
  const refreshToken = decrypt(site.googleRefreshTokenEncrypted);
  
  let accessToken: string;
  try {
    accessToken = await getAccessToken(refreshToken);
  } catch (error: any) {
    const isInvalidTokenError = error.message && (
      error.message.includes("invalid_grant") || 
      error.message.includes("invalid_request") ||
      error.message.includes("400") ||
      error.message.includes("401")
    );
    if (isInvalidTokenError) {
      await prisma.site.update({
        where: { id: site.id },
        data: {
          gscConnected: false,
          gscVerifiedPropertyUrl: null,
          googleRefreshTokenEncrypted: null,
          gscCachedData: null,
        },
      });
      throw new Error("Google Search Console session is expired or revoked. Please re-connect Search Console.");
    }
    throw error;
  }
  
  const propertyUrl = site.gscVerifiedPropertyUrl || site.url;
  const encodedPropertyUrl = encodeURIComponent(propertyUrl);
  
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date();
  start.setDate(start.getDate() - 31);
  
  const startDate = start.toISOString().split("T")[0];
  const endDate = end.toISOString().split("T")[0];
  
  const queryUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodedPropertyUrl}/searchAnalytics/query`;
  
  console.log(`[GSC Client] Fetching GSC analytics data from Google API for: ${propertyUrl}`);
  const res = await fetch(queryUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 100,
    }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Search Console query failed with status ${res.status}: ${errorText}`);
  }
  
  const data = await res.json();
  const rows = data.rows || [];
  
  // Format rows
  const queries = rows.map((r: any) => ({
    query: r.keys[0],
    page: r.keys[1],
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: r.ctr || 0,
    position: r.position || 0,
  }));
  
  // Sort by impressions descending and return top 50
  queries.sort((a: any, b: any) => b.impressions - a.impressions);
  const top50 = queries.slice(0, 50);

  // Update GSC Cache and synced time
  await prisma.site.update({
    where: { id: site.id },
    data: {
      gscCachedData: JSON.stringify(top50),
      gscLastSyncedAt: new Date(),
    },
  });
  
  return top50;
}
