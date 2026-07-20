import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { findMatchingGaProperty } from "@/lib/googleAnalytics";

function getPossibleGscProperties(siteUrl: string): string[] {
  let url = siteUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const cleanHost = host.startsWith("www.") ? host.substring(4) : host;
    
    return [
      `sc-domain:${host}`,
      `sc-domain:${cleanHost}`,
      `${parsed.protocol}//${host}/`,
      `${parsed.protocol}//${host}`,
      `https://${host}/`,
      `https://${host}`,
      `http://${host}/`,
      `http://${host}`,
      `https://www.${cleanHost}/`,
      `https://www.${cleanHost}`,
      `http://www.${cleanHost}/`,
      `http://www.${cleanHost}`
    ];
  } catch {
    return [siteUrl];
  }
}

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oAuthError = searchParams.get("error");

    if (oAuthError) {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=connections&error=OAuth Error: ${oAuthError}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=connections&error=Missing code or state parameter.`);
    }

    // Decrypt the state parameter to get siteId and userId
    let statePayload: { siteId: string; userId: string };
    try {
      const decrypted = decrypt(state);
      statePayload = JSON.parse(decrypted);
    } catch {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=connections&error=Invalid OAuth state parameter.`);
    }

    // Verify site belongs to the currently authenticated user (retrieved via encrypted state)
    const site = await prisma.site.findFirst({
      where: {
        id: statePayload.siteId,
        userId: statePayload.userId,
      },
    });

    if (!site) {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=connections&error=Site not found or unauthorized.`);
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      return NextResponse.redirect(
        `${appUrl}/dashboard?tab=connections&error=Failed to exchange code: ${errText}`
      );
    }

    const tokenData = await tokenResponse.json();
    const refreshToken = tokenData.refresh_token;
    const accessToken = tokenData.access_token;

    const googleRefreshTokenEncrypted = refreshToken
      ? encrypt(refreshToken)
      : site.googleRefreshTokenEncrypted;

    if (!googleRefreshTokenEncrypted) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?tab=connections&error=Failed to retrieve Google refresh token. Please try again.`
      );
    }

    // Call the Search Console sites.list API to find verified properties
    const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!sitesRes.ok) {
      const errText = await sitesRes.text();
      return NextResponse.redirect(
        `${appUrl}/dashboard?tab=connections&error=Failed to retrieve Search Console properties: ${errText}`
      );
    }

    const sitesData = await sitesRes.json();
    const siteEntry = sitesData.siteEntry || [];

    const candidates = getPossibleGscProperties(site.url);
    const matchedProperty = siteEntry.find((entry: { siteUrl: string; permissionLevel: string }) => {
      const entryUrl = entry.siteUrl.toLowerCase().replace(/\/$/, "");
      return candidates.some((cand) => cand.toLowerCase().replace(/\/$/, "") === entryUrl) &&
             entry.permissionLevel !== "siteUnverified";
    });

    if (!matchedProperty) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?tab=connections&error=This site isn't verified in your Google Search Console account yet`
      );
    }

    // Look up and find matching Google Analytics 4 property
    let gaPropertyId: string | null = null;
    try {
      gaPropertyId = await findMatchingGaProperty(accessToken, site.url);
    } catch (gaErr) {
      console.error("[GA Match Callback Error]:", gaErr);
    }

    // Save the encrypted refresh token + verified property url + GA properties
    await prisma.site.update({
      where: { id: site.id },
      data: {
        gscConnected: true,
        gscUrl: matchedProperty.siteUrl,
        gscVerifiedPropertyUrl: matchedProperty.siteUrl,
        googleRefreshTokenEncrypted: googleRefreshTokenEncrypted,
        gscLastSyncedAt: new Date(),
        gaPropertyId: gaPropertyId,
        gaConnected: !!gaPropertyId,
      },
    });

    const successMsg = gaPropertyId
      ? "Google Search Console and Google Analytics 4 connected successfully!"
      : "Google Search Console connected successfully! (No matching Google Analytics 4 property found)";

    return NextResponse.redirect(
      `${appUrl}/dashboard?tab=connections&success=${encodeURIComponent(successMsg)}`
    );
  } catch (error) {
    console.error("[GSC Callback Error]:", error);
    return NextResponse.redirect(
      `${appUrl}/dashboard?tab=connections&error=${encodeURIComponent((error as Error).message || "An unexpected callback error occurred.")}`
    );
  }
}

