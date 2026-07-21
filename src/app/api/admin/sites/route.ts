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

    const sites = await prisma.site.findMany({
      where: q
        ? {
            url: {
              contains: q,
            },
            deletedAt: null,
          }
        : {
            deletedAt: null,
          },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        audits: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = sites.map((s) => {
      const auditCount = s.audits.length;
      const latestAuditDate = auditCount > 0 ? s.audits[0].createdAt : null;

      return {
        id: s.id,
        url: s.url,
        wpUrl: s.wpUrl,
        wpUsername: s.wpUsername,
        createdAt: s.createdAt,
        ownerEmail: s.user?.email || "Unknown",
        auditCount,
        latestAuditDate,
      };
    });

    return NextResponse.json({ sites: result });
  } catch (error) {
    console.error("[Admin Sites List Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to fetch sites." }, { status: 500 });
  }
}

