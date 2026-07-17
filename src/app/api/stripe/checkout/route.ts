import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const isMock = !stripeSecret || stripeSecret === "mock-stripe-key";

const stripe = !isMock ? new Stripe(stripeSecret!) : null;

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

    // 1. Dynamic DB Plan lookup
    const planRecord = await prisma.plan.findUnique({
      where: { slug: planSlug }
    });

    if (!planRecord) {
      return NextResponse.json({ error: `Selected plan '${planSlug}' was not found in the database.` }, { status: 404 });
    }

    if (!planRecord.isActive) {
      return NextResponse.json({ error: `Selected plan '${planRecord.name}' is archived and no longer offered.` }, { status: 400 });
    }

    // Resolve amount and interval
    let amount = planRecord.monthlyPriceCents;
    let interval: "month" | "year" = "month";

    if (billingInterval === "annual") {
      if (!planRecord.annualPriceCents) {
        return NextResponse.json({ error: `Annual billing is not supported for plan: ${planRecord.name}` }, { status: 400 });
      }
      amount = planRecord.annualPriceCents;
      interval = "year";
    }

    // CRITICAL: Changing a plan's price in the database only affects NEW checkout sessions.
    // Existing active subscribers keep their original price point until they cancel or resubscribe.
    // This is intentional behavior to respect customer subscriptions and lock-in rates.

    // 2. Mock mode handling for local development
    if (isMock || !stripe) {
      if (process.env.NODE_ENV === "production") {
        console.error("[Stripe Checkout] Attempted to run mock billing subscription checkout in production mode!");
        return NextResponse.json(
          { error: "Stripe integration keys are misconfigured on this server." },
          { status: 500 }
        );
      }

      console.log(`[Stripe Checkout] [MOCK MODE] Simulating checkout: User=${currentUser.email}, Plan=${planRecord.slug}, Price=${amount} cents, Interval=${interval}, PromoCode=${promoCode || "none"}`);

      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          subscriptionActive: true,
          plan: planRecord.slug,
          planSource: "stripe",
          planActivatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        url: "/dashboard?mock_payment=success",
      });
    }

    // 3. Live Stripe Checkout Session creation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planRecord.name,
              description: `${planRecord.name} - ${billingInterval === "annual" ? "Annual" : "Monthly"} Billing`,
            },
            unit_amount: amount,
            recurring: {
              interval: interval,
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
        plan: planRecord.slug,
      },
    };

    // Apply promotion code discount if active
    if (promoCode) {
      try {
        console.log(`[Stripe Checkout] Querying active promotion code for: ${promoCode}`);
        const promoCodesList = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          limit: 1,
        });

        if (promoCodesList.data.length > 0) {
          const matchedPromo = promoCodesList.data[0];
          console.log(`[Stripe Checkout] Applied promotion code ${matchedPromo.id} (${promoCode})`);
          sessionOptions.discounts = [{ promotion_code: matchedPromo.id }];
        } else {
          console.warn(`[Stripe Checkout] Promotion code '${promoCode}' was not found or is inactive on Stripe.`);
        }
      } catch (promoErr) {
        console.error("[Stripe Checkout] Error checking Stripe promotion code:", promoErr);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

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
