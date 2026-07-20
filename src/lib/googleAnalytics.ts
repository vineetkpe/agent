import { decrypt } from "./crypto";
import { Site } from "@prisma/client";

async function getGaAccessToken(site: Site): Promise<string> {
  if (!site.googleRefreshTokenEncrypted) {
    throw new Error("Google refresh token is missing. Please connect Google first.");
  }
  const refreshToken = decrypt(site.googleRefreshTokenEncrypted);

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET environment variables.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh Google GA access token: ${response.statusText}. Details: ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function findMatchingGaProperty(accessToken: string, siteUrl: string): Promise<string | null> {
  try {
    const cleanUrl = siteUrl.toLowerCase().trim();
    const siteDomain = new URL(cleanUrl).hostname.replace(/^www\./, "");

    // 1. Get accounts
    const accRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!accRes.ok) {
      console.warn(`[GA findMatchingGaProperty] Failed to list accounts: ${accRes.status}`);
      return null;
    }
    const accData = await accRes.json();
    const accounts = accData.accounts || [];

    for (const acc of accounts) {
      // 2. Get properties
      const propRes = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${acc.name}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!propRes.ok) continue;
      const propData = await propRes.json();
      const properties = propData.properties || [];

      for (const prop of properties) {
        const propId = prop.name.split("/")[1];

        // 3. Get streams
        const streamRes = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties/${propId}/dataStreams`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!streamRes.ok) continue;
        const streamData = await streamRes.json();
        const streams = streamData.dataStreams || [];

        for (const stream of streams) {
          if (stream.type === "WEB_DATA_STREAM" && stream.webStreamData?.defaultUri) {
            const streamUri = stream.webStreamData.defaultUri.toLowerCase();
            if (streamUri.includes(siteDomain)) {
              return propId; // Found match!
            }
          }
        }

        // Fallback match on property display name
        if (prop.displayName?.toLowerCase().includes(siteDomain)) {
          return propId;
        }
      }
    }
  } catch (err) {
    console.error("[GA Match Error]:", err);
  }
  return null;
}

export async function fetchAnalyticsData(site: Site) {
  if (!site.gaPropertyId) {
    throw new Error("Google Analytics property ID is missing.");
  }

  const accessToken = await getGaAccessToken(site);

  // 1. Fetch aggregate stats
  const overviewRes = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${site.gaPropertyId}:runReport`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "bounceRate" },
        ],
      }),
    }
  );

  if (!overviewRes.ok) {
    throw new Error(`GA4 API aggregate report failed: ${await overviewRes.text()}`);
  }

  const overviewData = await overviewRes.json();
  const overviewRow = overviewData.rows?.[0];

  let organicSessions = 0;
  try {
    const organicRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${site.gaPropertyId}:runReport`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
          metrics: [{ name: "sessions" }],
          dimensionFilter: {
            filter: {
              fieldName: "sessionMedium",
              stringFilter: {
                matchType: "EXACT",
                value: "organic",
              },
            },
          },
        }),
      }
    );
    if (organicRes.ok) {
      const orgData = await organicRes.json();
      organicSessions = parseInt(orgData.rows?.[0]?.metricValues?.[0]?.value || "0", 10);
    }
  } catch (err) {
    console.error("[GA4 Organic Sessions Error]:", err);
  }

  const overview = {
    sessions: parseInt(overviewRow?.metricValues?.[0]?.value || "0", 10),
    users: parseInt(overviewRow?.metricValues?.[1]?.value || "0", 10),
    bounceRate: parseFloat(overviewRow?.metricValues?.[2]?.value || "0"),
    organicSessions,
  };

  // 2. Fetch landing pages
  const landingPagesRes = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${site.gaPropertyId}:runReport`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "landingPage" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "bounceRate" },
        ],
        limit: 10,
      }),
    }
  );

  if (!landingPagesRes.ok) {
    throw new Error(`GA4 API landing pages report failed: ${await landingPagesRes.text()}`);
  }

  const landingPagesData = await landingPagesRes.json();
  const landingPages = (landingPagesData.rows || []).map((row: {
    dimensionValues?: { value?: string }[] | null;
    metricValues?: { value?: string }[] | null;
  }) => ({
    path: row.dimensionValues?.[0]?.value || "/",
    sessions: parseInt(row.metricValues?.[0]?.value || "0", 10),
    users: parseInt(row.metricValues?.[1]?.value || "0", 10),
    bounceRate: parseFloat(row.metricValues?.[2]?.value || "0"),
  }));

  return {
    overview,
    landingPages,
  };
}

export async function fetchDailySessions(site: Site, startDate: Date, endDate: Date): Promise<Record<string, number>> {
  if (!site.gaPropertyId) {
    return {};
  }

  const accessToken = await getGaAccessToken(site);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${site.gaPropertyId}:runReport`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: startStr, endDate: endStr }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`GA4 Daily Sessions failed: ${await res.text()}`);
  }

  const data = await res.json();
  const rows = data.rows || [];
  const dateMap: Record<string, number> = {};

  for (const r of rows) {
    const rawDate = r.dimensionValues?.[0]?.value; // e.g. "20260718"
    const sessions = parseInt(r.metricValues?.[0]?.value || "0", 10);
    if (rawDate) {
      dateMap[rawDate] = sessions;
    }
  }

  return dateMap;
}
