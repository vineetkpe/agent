import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: currentUser.id },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found or unauthorized" }, { status: 404 });
    }

    const { goals } = await req.json();
    if (!Array.isArray(goals)) {
      return NextResponse.json({ error: "goals must be an array of strings" }, { status: 400 });
    }

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        businessGoals: JSON.stringify(goals),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business goals saved successfully!",
      site: updatedSite,
    });
  } catch (error) {
    console.error("[Save Site Goals Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
