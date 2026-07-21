import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch user's sites
    const sites = await prisma.site.findMany({
      where: { userId: currentUser.id, deletedAt: null },
      select: { id: true, url: true, wpUrl: true, wpConnectedAt: true },
    });

    const siteIds = sites.map((s) => s.id);

    // Fetch audits (completed)
    const audits = await prisma.audit.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        status: true,
        site: { select: { url: true } },
      },
    });

    // Fetch audit items (approved, applied, rejected)
    const auditItems = await prisma.auditItem.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    interface NotificationEvent {
      id: string;
      type: string;
      timestamp: Date;
      title: string;
      detail: string;
      tabLink?: string;
    }

    const events: NotificationEvent[] = [];

    // Map audits
    for (const aud of audits) {
      if (aud.status === "completed") {
        events.push({
          id: `audit-${aud.id}`,
          type: "audit_completed",
          timestamp: aud.createdAt,
          title: "Audit Completed",
          detail: `Scan finished for ${aud.site.url.replace(/^https?:\/\//i, "")}`,
          tabLink: "crawler",
        });
      }
    }

    // Map audit items
    for (const item of auditItems) {
      if (item.status === "applied") {
        let postTitle = "";
        if (item.type === "blog_post" && item.suggestedValue) {
          try {
            const parsed = JSON.parse(item.suggestedValue);
            postTitle = parsed.title || "";
          } catch {}
        }
        events.push({
          id: `apply-${item.id}`,
          type: "item_applied",
          timestamp: item.appliedAt || item.updatedAt,
          title: item.type === "blog_post" ? "Blog Published" : "SEO Fix Applied",
          detail: item.type === "blog_post"
            ? `Published "${postTitle || "Blog Post"}" to CMS`
            : `Applied auto-fix for ${item.type.replace("_", " ")}`,
          tabLink: item.type === "blog_post" ? "content" : "recommendations",
        });
      } else if (item.status === "approved") {
        events.push({
          id: `approve-${item.id}`,
          type: "item_approved",
          timestamp: item.updatedAt,
          title: "SEO Fix Approved",
          detail: `Approved suggestion for ${item.type.replace("_", " ")}`,
          tabLink: "recommendations",
        });
      }
    }

    // Map site WP connections
    for (const site of sites) {
      if (site.wpConnectedAt) {
        events.push({
          id: `wp-conn-${site.id}`,
          type: "wp_connected",
          timestamp: site.wpConnectedAt,
          title: "CMS Connected",
          detail: `WordPress connection established at ${site.wpUrl}`,
          tabLink: "connections",
        });
      }
    }

    // Sort events
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return the top 10 recent notifications
    const recentEvents = events.slice(0, 10);

    return NextResponse.json({
      notifications: recentEvents,
      lastNotificationCheckAt: currentUser.lastNotificationCheckAt,
    });
  } catch (error) {
    console.error("[Notifications API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        lastNotificationCheckAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      lastNotificationCheckAt: user.lastNotificationCheckAt,
    });
  } catch (error) {
    console.error("[Notifications Check API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

