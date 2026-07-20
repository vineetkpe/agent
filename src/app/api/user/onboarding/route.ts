import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        onboardingCompletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      onboardingCompletedAt: user.onboardingCompletedAt,
    });
  } catch (error) {
    console.error("[Onboarding API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

