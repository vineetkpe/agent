import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    // 1. Basic Stats
    const totalUsers = await prisma.user.count();
    
    // Calculate MRR strictly from users where planSource='stripe'
    const stripeUsers = await prisma.user.findMany({
      where: {
        subscriptionActive: true,
        planSource: "stripe",
      },
      select: {
        plan: true,
      },
    });

    let estimatedMrr = 0;
    stripeUsers.forEach((u) => {
      const p = (u.plan || "").toLowerCase();
      if (p === "starter") estimatedMrr += 19;
      else if (p === "growth") estimatedMrr += 49;
      else if (p === "agency") estimatedMrr += 99;
    });

    const estimatedArr = estimatedMrr * 12;

    // Add a separate stat: 'Comped users' count (planSource='admin_grant')
    const compedUsersCount = await prisma.user.count({
      where: {
        planSource: "admin_grant",
      },
    });

    const activeSubscriptions = await prisma.user.count({
      where: { subscriptionActive: true },
    });

    const arpu = activeSubscriptions > 0 ? Math.round((estimatedMrr / activeSubscriptions) * 100) / 100 : 0;

    const allUsersForPlan = await prisma.user.findMany({
      select: {
        plan: true,
      },
    });

    const planDistribution: Record<string, number> = {
      free: 0,
      starter: 0,
      growth: 0,
      agency: 0,
    };

    allUsersForPlan.forEach((u) => {
      const slug = (u.plan || "free").toLowerCase();
      planDistribution[slug] = (planDistribution[slug] || 0) + 1;
    });

    const canceledInLast30Days = await prisma.user.count({
      where: {
        subscriptionStatus: "canceled",
      },
    });

    const baseSubscribers = activeSubscriptions + canceledInLast30Days;
    const churnRate = baseSubscribers > 0 ? Math.round((canceledInLast30Days / baseSubscribers) * 10000) / 100 : 0;

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
        callType: true,
        success: true,
        wasFailover: true,
        userId: true,
      },
    });

    const apiProviderMap: { [provider: string]: { success: number; failure: number; failovers: number } } = {};
    const apiFeatureMap: { [callType: string]: { success: number; failure: number; failovers: number } } = {};
    const apiUserMap: { [userId: string]: number } = {};

    apiLogs.forEach((log) => {
      const providerKey = log.provider || "unknown";
      if (!apiProviderMap[providerKey]) {
        apiProviderMap[providerKey] = { success: 0, failure: 0, failovers: 0 };
      }
      if (log.success) {
        apiProviderMap[providerKey].success++;
      } else {
        apiProviderMap[providerKey].failure++;
      }
      if (log.wasFailover) {
        apiProviderMap[providerKey].failovers++;
      }

      const featureKey = log.callType || "general";
      if (!apiFeatureMap[featureKey]) {
        apiFeatureMap[featureKey] = { success: 0, failure: 0, failovers: 0 };
      }
      if (log.success) {
        apiFeatureMap[featureKey].success++;
      } else {
        apiFeatureMap[featureKey].failure++;
      }
      if (log.wasFailover) {
        apiFeatureMap[featureKey].failovers++;
      }

      if (log.userId) {
        apiUserMap[log.userId] = (apiUserMap[log.userId] || 0) + 1;
      }
    });

    const apiUsageLast30Days = Object.entries(apiProviderMap).map(([provider, counts]) => ({
      provider,
      success: counts.success,
      failure: counts.failure,
      failovers: counts.failovers,
      total: counts.success + counts.failure,
    }));

    const apiUsageByFeature = Object.entries(apiFeatureMap).map(([callType, counts]) => ({
      callType,
      success: counts.success,
      failure: counts.failure,
      failovers: counts.failovers,
      total: counts.success + counts.failure,
    }));

    const topApiUsers = Object.entries(apiUserMap)
      .map(([userId, totalCalls]) => ({ userId, totalCalls }))
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, 10);

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
        plan: true,
        planSource: true,
        suspended: true,
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
        plan: user.plan,
        planSource: user.planSource,
        suspended: user.suspended,
        siteCount: user.sites.length,
        lastAuditDate,
      };
    });

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const failoverCallsLast24h = await prisma.apiUsageLog.count({
      where: {
        wasFailover: true,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      estimatedMrr,
      estimatedArr,
      arpu,
      planDistribution,
      churnRate,
      compedUsersCount,
      totalSites,
      totalAudits,
      wordpressConnectedSites,
      auditItemsBreakdown,
      signupsLast30Days,
      apiUsageLast30Days,
      apiUsageByFeature,
      topApiUsers,
      recentActivity,
      usersList,
      failoverCallsLast24h,
      currentUser: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      },
    });
  } catch (error) {
    console.error("[Admin Stats Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

