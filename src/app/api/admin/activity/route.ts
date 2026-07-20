import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const action = searchParams.get("action")?.trim() || "";
    const dateFrom = searchParams.get("dateFrom")?.trim() || "";
    const dateTo = searchParams.get("dateTo")?.trim() || "";

    // 1. Resolve user IDs matching search if searching by email
    let userIdsFilter: string[] | undefined = undefined;
    if (search) {
      const matchedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { id: { contains: search } },
            { email: { contains: search } },
          ],
        },
        select: { id: true },
      });
      userIdsFilter = matchedUsers.map(u => u.id);
    }

    // 2. Build where filter
    const whereClause: Prisma.UserActivityLogWhereInput = {};

    if (userIdsFilter !== undefined) {
      whereClause.userId = { in: userIdsFilter };
    }

    if (action) {
      whereClause.action = action;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo);
      }
    }

    // Fetch activity logs
    const logs = await prisma.userActivityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 200, // Reasonable cap for speed
    });

    // Fetch user emails for display
    const userIds = Array.from(new Set(logs.map(l => l.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(users.map(u => [u.id, u.email]));

    const enrichedLogs = logs.map(log => {
      let parsedMeta = null;
      if (log.metadata) {
        try {
          parsedMeta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
        } catch {
          parsedMeta = log.metadata;
        }
      }
      return {
        ...log,
        userEmail: emailMap.get(log.userId) || "Unknown",
        metadata: parsedMeta,
      };
    });

    // 3. Compile Suspicious chat logs statistics per user using raw SQL (SQLite stores Json as text)
    const suspiciousLogs = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT "userId" FROM "UserActivityLog"
      WHERE action = 'chat_message'
        AND metadata LIKE '%"flaggedAsSuspicious":true%'
    `;

    const suspiciousCountMap: Record<string, number> = {};
    suspiciousLogs.forEach(l => {
      suspiciousCountMap[l.userId] = (suspiciousCountMap[l.userId] || 0) + 1;
    });

    // Enrich users list with emails & counts
    const suspiciousUsersList = await Promise.all(
      Object.keys(suspiciousCountMap).map(async (uid) => {
        const u = await prisma.user.findUnique({
          where: { id: uid },
          select: { email: true },
        });
        return {
          userId: uid,
          email: u?.email || "Unknown",
          suspiciousCount: suspiciousCountMap[uid],
        };
      })
    );

    return NextResponse.json({
      success: true,
      logs: enrichedLogs,
      suspiciousUsers: suspiciousUsersList,
    });
  } catch (error) {
    console.error("[Admin Activity Log GET Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to load activity logs." }, { status: 500 });
  }
}

