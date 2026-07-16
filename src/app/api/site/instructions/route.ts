import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { siteId, customInstructions } = await req.json();
    if (!siteId) {
      return NextResponse.json({ error: "Missing site ID" }, { status: 400 });
    }

    const updatedSite = await prisma.site.update({
      where: { id: siteId, userId: currentUser.id },
      data: { customInstructions },
    });

    return NextResponse.json({ success: true, site: updatedSite });
  } catch (error: any) {
    console.error("[Save Instructions Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to save instructions." }, { status: 500 });
  }
}
