import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { encrypt } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { targetUserId, reason } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing parameter: targetUserId is required." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const log = await prisma.impersonationLog.create({
      data: {
        adminUserId: currentUser.id,
        targetUserId: targetUser.id,
        reason: reason || "Technical support debug session",
      },
    });

    const expiresAt = Date.now() + 30 * 60 * 1000;
    const tokenPayload = {
      adminUserId: currentUser.id,
      targetUserId: targetUser.id,
      expiresAt,
      logId: log.id,
    };

    const token = encrypt(JSON.stringify(tokenPayload));

    console.log(`[AUDIT TRAIL] Admin ${currentUser.email} initiated impersonation session of User ${targetUser.email} (ID: ${targetUser.id}). Log ID: ${log.id}`);

    return NextResponse.json({
      success: true,
      token,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error("[Admin Impersonate Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to start impersonation session." }, { status: 500 });
  }
}

