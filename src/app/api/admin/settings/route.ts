import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { clearCachedConfig } from "@/lib/aiProvider";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const settings = await prisma.appSettings.findFirst({
      where: { id: "singleton" },
    });

    const envProvider = process.env.AI_PROVIDER || "gemini";
    const envCooldown = process.env.AUDIT_COOLDOWN_MINUTES || "5";

    const aiProvider = settings?.aiProvider || envProvider;
    const aiProviderSource = settings?.aiProvider ? "database" : "env-default";

    const auditCooldownMinutes = settings?.auditCooldownMinutes !== null && settings?.auditCooldownMinutes !== undefined
      ? settings.auditCooldownMinutes
      : parseInt(envCooldown, 10);
    const auditCooldownMinutesSource = settings?.auditCooldownMinutes !== null && settings?.auditCooldownMinutes !== undefined
      ? "database"
      : "env-default";

    return NextResponse.json({
      settings: {
        aiProvider,
        aiProviderSource,
        auditCooldownMinutes,
        auditCooldownMinutesSource,
        envAiProvider: envProvider,
        envAuditCooldownMinutes: parseInt(envCooldown, 10),
        rawDbSettings: settings || null,
      },
    });
  } catch (error: any) {
    console.error("[Admin Settings GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load admin settings." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const aiProvider = body.aiProvider;
    const auditCooldownMinutes = body.auditCooldownMinutes;

    // Upsert singleton row
    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        aiProvider: aiProvider || null,
        auditCooldownMinutes: auditCooldownMinutes !== undefined && auditCooldownMinutes !== "" && auditCooldownMinutes !== null
          ? parseInt(auditCooldownMinutes, 10)
          : null,
      },
      update: {
        aiProvider: aiProvider || null,
        auditCooldownMinutes: auditCooldownMinutes !== undefined && auditCooldownMinutes !== "" && auditCooldownMinutes !== null
          ? parseInt(auditCooldownMinutes, 10)
          : null,
      },
    });

    // Clear server cache so setting takes effect instantly
    clearCachedConfig();

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("[Admin Settings PATCH Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to save settings." }, { status: 500 });
  }
}
