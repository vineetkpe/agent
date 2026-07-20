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

    const { industry, services, targetAudience, cityServiceArea, description } = await req.json();

    const manualContext = {
      industry: industry || "",
      services: services || [],
      targetAudience: targetAudience || "",
      cityServiceArea: cityServiceArea || "",
      description: description || "",
    };

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        manuallyEnteredContext: JSON.stringify(manualContext),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business profile context saved successfully!",
      site: updatedSite,
    });
  } catch (error) {
    console.error("[Save Site Context Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
