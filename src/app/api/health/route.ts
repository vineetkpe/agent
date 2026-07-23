import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Perform a lightweight database connectivity check
    await prisma.user.findFirst({
      select: { id: true },
    });

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Health Check Failed]:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Database connectivity check failed.",
      },
      { status: 500 }
    );
  }
}
