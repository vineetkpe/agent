import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireRole, logAdminAction } from "@/lib/permissions";
import { invalidatePlanLimitsCache } from "@/lib/planLimits";
import { Plan } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    requireRole(currentUser, ["admin"]);

    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        features: true,
      },
    });

    const features = await prisma.feature.findMany();

    return NextResponse.json({ plans, features });
  } catch (error) {
    if ((error as Error).name === "ForbiddenError") {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message || "Failed to load plans." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    requireRole(currentUser, ["admin"]);

    const body = await req.json();
    const { name, slug, monthlyPriceCents, annualPriceCents, isActive, isVisible, sortOrder, features } = body;

    if (!name || !slug || monthlyPriceCents === undefined) {
      return NextResponse.json({ error: "Missing required fields: name, slug, monthlyPriceCents" }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase();

    const existing = await prisma.plan.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return NextResponse.json({ error: "Plan slug must be unique. This slug is already in use." }, { status: 400 });
    }

    const createdPlan = await prisma.plan.create({
      data: {
        name,
        slug: cleanSlug,
        monthlyPriceCents: parseInt(monthlyPriceCents, 10),
        annualPriceCents: annualPriceCents ? parseInt(annualPriceCents, 10) : null,
        isActive: isActive !== undefined ? !!isActive : true,
        isVisible: isVisible !== undefined ? !!isVisible : true,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
      },
    });

    if (features && typeof features === "object") {
      for (const [featKey, featVal] of Object.entries(features)) {
        await prisma.planFeature.create({
          data: {
            planId: createdPlan.id,
            featureKey: featKey,
            value: JSON.stringify(featVal),
          },
        });
      }
    }

    invalidatePlanLimitsCache();

    await logAdminAction(
      currentUser,
      `Created plan ${cleanSlug}`,
      "Plan",
      createdPlan.id,
      { name, slug: cleanSlug, monthlyPriceCents }
    );

    return NextResponse.json({ success: true, plan: createdPlan });
  } catch (error) {
    if ((error as Error).name === "ForbiddenError") {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message || "Failed to create plan." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    requireRole(currentUser, ["admin"]);

    const body = await req.json();
    const { id, name, monthlyPriceCents, annualPriceCents, isActive, isVisible, sortOrder, features } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing plan ID" }, { status: 400 });
    }

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const updateData: Partial<Plan> = {};
    if (name !== undefined) updateData.name = name;
    if (monthlyPriceCents !== undefined) updateData.monthlyPriceCents = parseInt(monthlyPriceCents, 10);
    if (annualPriceCents !== undefined) updateData.annualPriceCents = annualPriceCents !== "" && annualPriceCents !== null ? parseInt(annualPriceCents, 10) : null;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (isVisible !== undefined) updateData.isVisible = !!isVisible;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    if (features && typeof features === "object") {
      for (const [featKey, featVal] of Object.entries(features)) {
        await prisma.planFeature.upsert({
          where: {
            planId_featureKey: {
              planId: id,
              featureKey: featKey,
            },
          },
          update: {
            value: JSON.stringify(featVal),
          },
          create: {
            planId: id,
            featureKey: featKey,
            value: JSON.stringify(featVal),
          },
        });
      }
    }

    invalidatePlanLimitsCache();

    await logAdminAction(
      currentUser,
      `Updated plan ${existingPlan.slug}`,
      "Plan",
      id,
      { changes: updateData }
    );

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error) {
    if ((error as Error).name === "ForbiddenError") {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message || "Failed to update plan." }, { status: 500 });
  }
}

