import { NextResponse } from "next/server";
import { paymentProvider } from "@/lib/paymentProvider";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = (await paymentProvider.verifyWebhookSignature(body, signature)) as Stripe.Event;
  } catch (err) {
    console.error("[Webhook Error] Signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  // Handle events
  try {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (event.type === "checkout.session.completed") {
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      const customerId = typeof session.customer === "string" ? session.customer : (session.customer ? session.customer.id : null);

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
          paymentFailedAt: null,
          subscriptionStatus: "active",
        },
      });
      await logActivity(userId, "plan_upgrade", { plan, customerId });
      console.log(`[Webhook] Activated plan ${plan} for user ${userId} (Customer: ${customerId})`);
    } else if (event.type === "invoice.payment_failed") {
      const customerId = typeof session.customer === "string" ? session.customer : (session.customer ? session.customer.id : null);
      if (customerId) {
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              paymentFailedAt: new Date(),
              subscriptionStatus: "past_due",
            },
          });

          await logActivity(user.id, "plan_payment_failed", { customerId });

          // Send warning email via Resend
          await sendEmail({
            to: user.email,
            subject: "[Action Required] Your payment for HeyDrona failed",
            html: `
              <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
                <h2>Payment Failed</h2>
                <p>Hello,</p>
                <p>We were unable to process your recurring payment for your HeyDrona SEO subscription.</p>
                <p>To prevent any service interruption, we have initiated a <strong>7-day grace period</strong>. Your account access will continue normally during this window while our billing provider retries the payment.</p>
                <p>Please log in and update your payment details as soon as possible.</p>
                <br />
                <p>Best regards,</p>
                <p>The HeyDrona Team</p>
              </div>
            `,
          });
          console.log(`[Webhook] Handle invoice.payment_failed grace period for customer ${customerId}`);
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      const customerId = typeof session.customer === "string" ? session.customer : (session.customer ? session.customer.id : null);
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
              subscriptionStatus: "canceled",
            },
          });

          await logActivity(user.id, "plan_cancel", { customerId });

          // Send subscription end email
          await sendEmail({
            to: user.email,
            subject: "Your HeyDrona subscription has ended",
            html: `
              <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
                <h2>Subscription Ended</h2>
                <p>Hello,</p>
                <p>Your HeyDrona subscription has ended and your workspace accounts have been reverted to the free level.</p>
                <p>We are sorry to see you go. If you ever want to resume optimization recommendations or visual flow pipelines, you can upgrade your plan at any time.</p>
                <br />
                <p>Best regards,</p>
                <p>The HeyDrona Team</p>
              </div>
            `,
          });
          console.log(`[Webhook] Deactivated subscription for user ${user.id} due to event ${event.type}`);
        }
      }
    }
  } catch (dbErr) {
    console.error("[Webhook Database Error]:", dbErr);
    return NextResponse.json({ error: "Internal processing error", message: (dbErr as Error).message }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}

