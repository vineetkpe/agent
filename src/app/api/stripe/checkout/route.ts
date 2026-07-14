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

    if (isMock || !stripe) {
      // SAFETY-1: Stripe mock-mode must fail loudly in production instead of granting free access
      if (process.env.NODE_ENV === "production") {
        console.error("[Stripe Checkout] Attempted to run mock billing subscription checkout in production mode!");
        return NextResponse.json(
          { error: "Stripe integration keys are misconfigured on this server." },
          { status: 500 }
        );
      }

      console.log(`[Stripe Checkout] Simulating Stripe Checkout subscription flow for dev user ${currentUser.email} (Mock Mode).`);
      
      // Mock flow: immediately toggle subscriptionActive to true in local SQLite DB
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { subscriptionActive: true },
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
              name: "AI Website Growth Agent Partner",
              description: "Recurring monthly subscription for SEO audits and blog drafts updates.",
            },
            unit_amount: 1900, // $19.00
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
