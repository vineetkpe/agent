import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const logType = searchParams.get("logType") || "all"; // "admin" | "user" | "all"
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    let adminLogs: any[] = [];
    let userLogs: any[] = [];
    let totalAdmin = 0;
    let totalUser = 0;

    if (logType === "admin" || logType === "all") {
      const where: any = {};
      if (userId) where.actorUserId = userId;
      if (action) where.action = { contains: action };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }
      if (search) {
        where.OR = [
          { action: { contains: search } },
          { targetType: { contains: search } },
          { targetId: { contains: search } },
          { actorUserId: { contains: search } },
        ];
      }

      totalAdmin = await prisma.adminActionLog.count({ where });
      adminLogs = await prisma.adminActionLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: logType === "admin" ? limit : limit * 2,
        skip: logType === "admin" ? skip : 0,
      });
    }

    if (logType === "user" || logType === "all") {
      const where: any = {};
      if (userId) where.userId = userId;
      if (action) where.action = { contains: action };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }
      if (search) {
        where.OR = [
          { action: { contains: search } },
          { userId: { contains: search } },
          { ipAddress: { contains: search } },
        ];
      }

      totalUser = await prisma.userActivityLog.count({ where });
      userLogs = await prisma.userActivityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: logType === "user" ? limit : limit * 2,
        skip: logType === "user" ? skip : 0,
      });
    }

    let combinedLogs: any[] = [];

    if (logType === "admin") {
      combinedLogs = adminLogs.map(l => ({ ...l, logSource: "admin" }));
    } else if (logType === "user") {
      combinedLogs = userLogs.map(l => ({ ...l, logSource: "user" }));
    } else {
      const taggedAdmin = adminLogs.map(l => ({ ...l, logSource: "admin", userId: l.actorUserId }));
      const taggedUser = userLogs.map(l => ({ ...l, logSource: "user" }));
      combinedLogs = [...taggedAdmin, ...taggedUser]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(skip, skip + limit);
    }

    const totalCount = logType === "admin" ? totalAdmin : logType === "user" ? totalUser : totalAdmin + totalUser;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      logs: combinedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[Admin Logs API Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch admin logs." },
      { status: 500 }
    );
  }
}
