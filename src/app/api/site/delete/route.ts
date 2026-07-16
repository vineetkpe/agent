import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { siteId } = await req.json();
    if (!siteId) {
      return NextResponse.json({ error: "Missing siteId parameter" }, { status: 400 });
    }

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: currentUser.id,
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found or unauthorized" }, { status: 404 });
    }

    // SQLite cascade deletes will automatically purge related Audits & AuditItems
    await prisma.site.delete({
      where: {
        id: siteId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Site and all historical audits successfully deleted.",
    });
  } catch (error: any) {
    console.error("[Site Delete API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
