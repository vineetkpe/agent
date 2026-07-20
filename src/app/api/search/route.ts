import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (query.trim().length < 2) {
      return NextResponse.json({ success: true, sites: [], auditItems: [] });
    }

    const lowercaseQuery = query.toLowerCase();

    // Find user owned sites matching url
    const sites = await prisma.site.findMany({
      where: {
        userId: currentUser.id,
        url: {
          contains: lowercaseQuery,
        },
      },
      select: {
        id: true,
        url: true,
      },
      take: 10,
    });

    // Find user owned audit items matching suggested value, target url, or type
    const auditItems = await prisma.auditItem.findMany({
      where: {
        site: {
          userId: currentUser.id,
        },
        OR: [
          {
            suggestedValue: {
              contains: lowercaseQuery,
            },
          },
          {
            targetUrl: {
              contains: lowercaseQuery,
            },
          },
          {
            type: {
              contains: lowercaseQuery,
            },
          },
        ],
      },
      include: {
        site: {
          select: {
            url: true,
          },
        },
      },
      take: 15,
    });

    return NextResponse.json({
      success: true,
      sites,
      auditItems,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to execute search query" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

