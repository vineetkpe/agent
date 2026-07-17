import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  const isMock = !webhookSecret || webhookSecret === "mock-webhook-secret";

  if (isMock) {
    console.warn("[Webhook] running in mock mode. Signature verification bypassed.");
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err: any) {
      console.error("[Webhook Error] Mock parse failed:", err.message);
      return NextResponse.json({ error: "Invalid payload json" }, { status: 400 });
    }
  } else {
    if (!stripe) {
      console.error("[Webhook Error] Stripe client not initialized");
      return NextResponse.json({ error: "Stripe client not initialized" }, { status: 500 });
    }
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
    } catch (err: any) {
      console.error("[Webhook Error] Signature verification failed:", err.message);
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }
  }

  // Handle events
  try {
    const session = event.data.object as any;
    
    if (event.type === "checkout.session.completed") {
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      const customerId = session.customer;

      if (!userId || !plan) {
        console.error("[Webhook Error] Missing userId or plan in session metadata:", session.metadata);
        return NextResponse.json({ received: true });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          subscriptionActive: true,
          planSource: "stripe",
          planActivatedAt: new Date(),
          stripeCustomerId: customerId,
        },
      });
      console.log(`[Webhook] Activated plan ${plan} for user ${userId} (Customer: ${customerId})`);
    } else if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
      const customerId = session.customer;

      if (customerId) {
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: null,
              subscriptionActive: false,
            },
          });
          console.log(`[Webhook] Deactivated subscription for user ${user.id} due to event ${event.type}`);
        } else {
          console.warn(`[Webhook] No user found with stripeCustomerId ${customerId} for event ${event.type}`);
        }
      }
    }
  } catch (dbErr: any) {
    console.error("[Webhook Database Error]:", dbErr);
    // Wrap all DB writes in try/catch, return 200 to Stripe even on internal processing errors
    // so Stripe doesn't endlessly retry, but make the error loud in server logs.
    return NextResponse.json({ error: "Internal processing error", message: dbErr.message }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
