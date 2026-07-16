import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const isMock = !stripeSecret || stripeSecret === "mock-stripe-key";

// Initialize Stripe if a valid key is provided
const stripe = !isMock ? new Stripe(stripeSecret!, { apiVersion: "2025-01-27.accredited-preview" as any }) : null;

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let plan: string;
    try {
      const body = await req.json();
      plan = body.plan;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!plan || !["starter", "growth", "agency"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid or missing plan parameter. Must be 'starter', 'growth', or 'agency'." },
        { status: 400 }
      );
    }

    const PLAN_DETAILS: Record<string, { name: string; amount: number; description: string }> = {
      starter: {
        name: "Starter Plan",
        amount: 1900,
        description: "1 website, manual audits (24h cooldown), full AI fixes, WordPress one-click apply, AI chat assistant",
      },
      growth: {
        name: "Growth Plan",
        amount: 4900,
        description: "Up to 3 websites, everything in Starter, weekly automatic re-scan + email digest, downloadable PDF SEO reports",
      },
      agency: {
        name: "Agency Plan",
        amount: 9900,
        description: "Up to 10 websites, everything in Growth, white-label PDF reports (your logo, not ours), fastest audit cooldown",
      },
    };

    const selectedPlan = PLAN_DETAILS[plan];

    if (isMock || !stripe) {
      // SAFETY-1: Stripe mock-mode must fail loudly in production instead of granting free access
      if (process.env.NODE_ENV === "production") {
        console.error("[Stripe Checkout] Attempted to run mock billing subscription checkout in production mode!");
        return NextResponse.json(
          { error: "Stripe integration keys are misconfigured on this server." },
          { status: 500 }
        );
      }

      console.log(`[Stripe Checkout] Simulating Stripe Checkout subscription flow for dev user ${currentUser.email} (Mock Mode: Plan ${plan}).`);
      
      // Mock flow: immediately toggle subscriptionActive to true in local SQLite DB
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          subscriptionActive: true,
          plan: plan,
          planSource: "stripe",
          planActivatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        url: "/dashboard?mock_payment=success",
      });
    }

    // Live Stripe Integration Flow
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3050";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer_email: currentUser.email,
      success_url: `${appUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: {
        userId: currentUser.id,
        plan: plan,
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error: any) {
    console.error("[Stripe Checkout Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Could not create Stripe session" },
      { status: 500 }
    );
  }
}
