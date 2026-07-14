import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrCreateDefaultUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const isMock = !stripeSecret || stripeSecret === "mock-stripe-key";

// Initialize Stripe if a valid key is provided
const stripe = !isMock ? new Stripe(stripeSecret!, { apiVersion: "2025-01-27.accredited-preview" as any }) : null;

export async function POST(req: Request) {
  try {
    const defaultUser = await getOrCreateDefaultUser();

    if (isMock || !stripe) {
      console.log("[Stripe Checkout] Simulating Stripe Checkout subscription flow (Mock Mode).");
      
      // Mock flow: immediately toggle subscriptionActive to true in local SQLite DB
      await prisma.user.update({
        where: { id: defaultUser.id },
        data: { subscriptionActive: true },
      });

      return NextResponse.json({
        success: true,
        url: "/dashboard?mock_payment=success",
      });
    }

    // Live Stripe Integration Flow
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
      customer_email: defaultUser.email,
      success_url: `${appUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: {
        userId: defaultUser.id,
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
