import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    // 1. Basic Stats
    const totalUsers = await prisma.user.count();
    const activeSubscriptions = await prisma.user.count({
      where: { subscriptionActive: true },
    });
    const estimatedMrr = activeSubscriptions * 19;
    const totalSites = await prisma.site.count();
    const totalAudits = await prisma.audit.count();

    // 2. Audit items grouped by status
    const auditItemsGroup = await prisma.auditItem.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    const auditItemsBreakdown = {
      pending: 0,
      approved: 0,
      applied: 0,
      rejected: 0,
    };

    for (const group of auditItemsGroup) {
      const status = group.status as keyof typeof auditItemsBreakdown;
      if (status in auditItemsBreakdown) {
        auditItemsBreakdown[status] = group._count._all;
      }
    }

    // 3. WordPress Connected Sites
    const wordpressConnectedSites = await prisma.site.count({
      where: {
        wpUrl: {
          not: null,
        },
      },
    });

    // 4. Signups over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by YYYY-MM-DD in JS
    const signupsMap: { [date: string]: number } = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      signupsMap[dateStr] = 0;
    }

    recentUsers.forEach((u) => {
      const dateStr = u.createdAt.toISOString().split("T")[0];
      if (dateStr in signupsMap) {
        signupsMap[dateStr]++;
      }
    });

    const signupsLast30Days = Object.entries(signupsMap).map(([date, count]) => ({
      date,
      count,
    }));

    // 5. API Usage logs over the last 30 days
    const apiLogs = await prisma.apiUsageLog.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        provider: true,
        success: true,
      },
    });

    const apiUsageMap: { [provider: string]: { success: number; failure: number } } = {};
    apiLogs.forEach((log) => {
      const providerKey = log.provider || "unknown";
      if (!apiUsageMap[providerKey]) {
        apiUsageMap[providerKey] = { success: 0, failure: 0 };
      }
      if (log.success) {
        apiUsageMap[providerKey].success++;
      } else {
        apiUsageMap[providerKey].failure++;
      }
    });

    const apiUsageLast30Days = Object.entries(apiUsageMap).map(([provider, counts]) => ({
      provider,
      success: counts.success,
      failure: counts.failure,
      total: counts.success + counts.failure,
    }));

    // 6. Recent activities (20 most recent AuditItem rows)
    const recentAuditItems = await prisma.auditItem.findMany({
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        status: true,
        targetUrl: true,
        createdAt: true,
        site: {
          select: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    const recentActivity = recentAuditItems.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      targetUrl: item.targetUrl,
      createdAt: item.createdAt,
      email: item.site.user.email,
    }));

    // 7. Users details list for table view
    const allUsers = await prisma.user.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        subscriptionActive: true,
        createdAt: true,
        sites: {
          select: {
            id: true,
            audits: {
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
              select: {
                createdAt: true,
              },
            },
          },
        },
      },
    });

    const usersList = allUsers.map((user) => {
      let lastAuditDate: Date | null = null;
      user.sites.forEach((site) => {
        const auditDate = site.audits[0]?.createdAt;
        if (auditDate) {
          if (!lastAuditDate || auditDate > lastAuditDate) {
            lastAuditDate = auditDate;
          }
        }
      });

      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        subscriptionActive: user.subscriptionActive,
        siteCount: user.sites.length,
        lastAuditDate,
      };
    });

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      estimatedMrr,
      totalSites,
      totalAudits,
      wordpressConnectedSites,
      auditItemsBreakdown,
      signupsLast30Days,
      apiUsageLast30Days,
      recentActivity,
      usersList,
    });
  } catch (error: any) {
    console.error("[Admin Stats Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
