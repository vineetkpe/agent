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

    const settings: any = await prisma.appSettings.findFirst({
      where: { id: "singleton" },
    });

    const envProvider = process.env.AI_PROVIDER || "gemini";
    const envPriority = process.env.AI_PROVIDER_PRIORITY || "gemini,groq,openrouter";
    const envCooldown = process.env.AUDIT_COOLDOWN_MINUTES || "5";

    const aiProvider = settings?.aiProvider || envProvider;
    const aiProviderSource = settings?.aiProvider ? "database" : "env-default";

    const aiProviderPriority = settings?.aiProviderPriority || envPriority;
    const aiProviderPrioritySource = settings?.aiProviderPriority ? "database" : "env-default";

    const auditCooldownMinutes = settings?.auditCooldownMinutes !== null && settings?.auditCooldownMinutes !== undefined
      ? settings.auditCooldownMinutes
      : parseInt(envCooldown, 10);
    const auditCooldownMinutesSource = settings?.auditCooldownMinutes !== null && settings?.auditCooldownMinutes !== undefined
      ? "database"
      : "env-default";

    const autoPublishEnabled = settings?.autoPublishEnabled !== undefined ? settings.autoPublishEnabled : true;

    return NextResponse.json({
      settings: {
        aiProvider,
        aiProviderSource,
        aiProviderPriority,
        aiProviderPrioritySource,
        auditCooldownMinutes,
        auditCooldownMinutesSource,
        autoPublishEnabled,
        geminiInputRate: settings?.geminiInputRate ?? 0.15,
        geminiOutputRate: settings?.geminiOutputRate ?? 0.60,
        groqInputRate: settings?.groqInputRate ?? 0.59,
        groqOutputRate: settings?.groqOutputRate ?? 0.79,
        openrouterInputRate: settings?.openrouterInputRate ?? 0.80,
        openrouterOutputRate: settings?.openrouterOutputRate ?? 0.80,
        envAiProvider: envProvider,
        envAiProviderPriority: envPriority,
        envAuditCooldownMinutes: parseInt(envCooldown, 10),
        rawDbSettings: settings || null,
      },
    });
  } catch (error) {
    console.error("[Admin Settings GET Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to load admin settings." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      aiProvider,
      aiProviderPriority,
      auditCooldownMinutes,
      autoPublishEnabled,
      geminiInputRate,
      geminiOutputRate,
      groqInputRate,
      groqOutputRate,
      openrouterInputRate,
      openrouterOutputRate,
    } = body;

    const parseRate = (val: any) => (val !== undefined && val !== null && val !== "" ? parseFloat(val) : null);

    // Upsert singleton row
    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        aiProvider: aiProvider || null,
        aiProviderPriority: aiProviderPriority || null,
        auditCooldownMinutes: auditCooldownMinutes !== undefined && auditCooldownMinutes !== "" && auditCooldownMinutes !== null
          ? parseInt(auditCooldownMinutes, 10)
          : null,
        autoPublishEnabled: autoPublishEnabled !== undefined ? Boolean(autoPublishEnabled) : true,
        geminiInputRate: parseRate(geminiInputRate),
        geminiOutputRate: parseRate(geminiOutputRate),
        groqInputRate: parseRate(groqInputRate),
        groqOutputRate: parseRate(groqOutputRate),
        openrouterInputRate: parseRate(openrouterInputRate),
        openrouterOutputRate: parseRate(openrouterOutputRate),
      } as any,
      update: {
        aiProvider: aiProvider || null,
        aiProviderPriority: aiProviderPriority || null,
        auditCooldownMinutes: auditCooldownMinutes !== undefined && auditCooldownMinutes !== "" && auditCooldownMinutes !== null
          ? parseInt(auditCooldownMinutes, 10)
          : null,
        autoPublishEnabled: autoPublishEnabled !== undefined ? Boolean(autoPublishEnabled) : true,
        geminiInputRate: parseRate(geminiInputRate),
        geminiOutputRate: parseRate(geminiOutputRate),
        groqInputRate: parseRate(groqInputRate),
        groqOutputRate: parseRate(groqOutputRate),
        openrouterInputRate: parseRate(openrouterInputRate),
        openrouterOutputRate: parseRate(openrouterOutputRate),
      } as any,
    });

    // Clear server cache so setting takes effect instantly
    clearCachedConfig();

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("[Admin Settings PATCH Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to save settings." }, { status: 500 });
  }
}
