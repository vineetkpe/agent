import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { paymentProvider } from "@/lib/paymentProvider";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let planSlug: string;
    let billingInterval: "monthly" | "annual" = "monthly";
    let promoCode: string | null = null;

    try {
      const body = await req.json();
      planSlug = (body.plan || "").trim().toLowerCase();
      if (body.billingInterval === "annual") {
        billingInterval = "annual";
      }
      if (body.promoCode) {
        promoCode = String(body.promoCode).trim();
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!planSlug) {
      return NextResponse.json({ error: "Missing plan slug parameter." }, { status: 400 });
    }

    // Dynamic DB Plan lookup
    const planRecord = await prisma.plan.findUnique({
      where: { slug: planSlug }
    });

    if (!planRecord) {
      return NextResponse.json({ error: `Selected plan '${planSlug}' was not found in the database.` }, { status: 404 });
    }

    if (!planRecord.isActive) {
      return NextResponse.json({ error: `Selected plan '${planRecord.name}' is archived and no longer offered.` }, { status: 400 });
    }

    // Call checkout session through the provider abstraction
    const session = await paymentProvider.createCheckoutSession({
      userId: currentUser.id,
      planSlug,
      billingInterval,
      promoCode,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("[Checkout Route Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Could not create checkout session" },
      { status: 500 }
    );
  }
}

