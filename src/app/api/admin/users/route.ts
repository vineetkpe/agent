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
    const q = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: q
        ? {
            email: {
              contains: q,
            },
          }
        : {},
      include: {
        sites: {
          select: {
            id: true,
            audits: {
              select: {
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = users.map((u) => {
      let latestAuditDate: Date | null = null;
      u.sites.forEach((s) => {
        if (s.audits.length > 0) {
          const auditDate = s.audits[0].createdAt;
          if (!latestAuditDate || auditDate > latestAuditDate) {
            latestAuditDate = auditDate;
          }
        }
      });

      return {
        id: u.id,
        email: u.email,
        subscriptionActive: u.subscriptionActive,
        suspended: u.suspended,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        siteCount: u.sites.length,
        latestAuditDate,
      };
    });

    return NextResponse.json({ users: result });
  } catch (error: any) {
    console.error("[Admin Users List Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users." }, { status: 500 });
  }
}
