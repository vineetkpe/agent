import { prisma } from "./prisma";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret && stripeSecret !== "mock-stripe-key" ? new Stripe(stripeSecret) : null;

export interface CheckoutSessionParams {
  userId: string;
  planSlug: string;
  billingInterval: "monthly" | "annual";
  promoCode?: string | null;
}

export interface BillingPortalSessionParams {
  userId: string;
}

export interface CancelSubscriptionParams {
  userId: string;
}

export interface PaymentProvider {
  createCheckoutSession(params: CheckoutSessionParams): Promise<{ url: string }>;
  createBillingPortalSession(params: BillingPortalSessionParams): Promise<{ url: string }>;
  cancelSubscription(params: CancelSubscriptionParams): Promise<{ success: boolean }>;
  verifyWebhookSignature(rawBody: string, signature: string): Promise<any>;
}

const mockProvider: PaymentProvider = {
  async createCheckoutSession({ userId, planSlug, billingInterval }) {
    const planRecord = await prisma.plan.findUnique({
      where: { slug: planSlug }
    });
    if (!planRecord) {
      throw new Error(`Plan not found: ${planSlug}`);
    }

    const amount = billingInterval === "annual" 
      ? (planRecord.annualPriceCents || planRecord.monthlyPriceCents * 10) 
      : planRecord.monthlyPriceCents;
    const interval = billingInterval === "annual" ? "year" : "month";

    console.log(`[Mock Payment] Simulating checkout for user ${userId}, plan ${planSlug}, amount ${amount}, interval ${interval}`);
    
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionActive: true,
        plan: planSlug,
        planSource: "stripe",
        planActivatedAt: new Date(),
        subscriptionStatus: "active",
        subscriptionEndsAt: endsAt,
      },
    });

    return {
      url: "/dashboard?mock_payment=success",
    };
  },

  async createBillingPortalSession({ userId }) {
    console.log(`[Mock Payment] Simulating billing portal for user ${userId}`);
    return {
      url: "/dashboard/billing",
    };
  },

  async cancelSubscription({ userId }) {
    console.log(`[Mock Payment] Simulating cancel subscription for user ${userId}`);
    // Directly sets plan:null/subscriptionActive:false in the DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: null,
        subscriptionActive: false,
        subscriptionStatus: "canceled",
        subscriptionEndsAt: new Date(), // Expires immediately for mock cancellation to see it take effect
      },
    });
    return { success: true };
  },

  async verifyWebhookSignature(rawBody, signature) {
    console.log("[Mock Payment] Verifying webhook signature (bypass)");
    try {
      return JSON.parse(rawBody);
    } catch (err: any) {
      throw new Error("Invalid payload JSON: " + err.message);
    }
  }
};

const stripeProvider: PaymentProvider = {
  async createCheckoutSession({ userId, planSlug, billingInterval, promoCode }) {
    if (!stripe) {
      throw new Error("Stripe client is not configured");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const planRecord = await prisma.plan.findUnique({
      where: { slug: planSlug }
    });
    if (!planRecord) {
      throw new Error(`Selected plan '${planSlug}' was not found in the database.`);
    }

    let amount = planRecord.monthlyPriceCents;
    let interval: "month" | "year" = "month";

    if (billingInterval === "annual") {
      if (!planRecord.annualPriceCents) {
        throw new Error(`Annual billing is not supported for plan: ${planRecord.name}`);
      }
      amount = planRecord.annualPriceCents;
      interval = "year";
    }

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
      customer_email: user.email,
      success_url: `${appUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: {
        userId: user.id,
        plan: planRecord.slug,
      },
    };

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
    return { url: session.url! };
  },

  async createBillingPortalSession({ userId }) {
    if (!stripe) {
      throw new Error("Stripe client is not configured");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      throw new Error("Stripe customer ID not found for user. Please subscribe first.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return { url: portalSession.url };
  },

  async cancelSubscription({ userId }) {
    if (!stripe) {
      throw new Error("Stripe client is not configured");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      throw new Error("No Stripe customer associated with this user.");
    }

    // Retrieve active subscription in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active Stripe subscription found to cancel.");
    }

    const sub = subscriptions.data[0];
    const updatedSub = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    });

    // Update user record locally
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "canceled",
        subscriptionEndsAt: new Date((updatedSub as any).current_period_end * 1000),
      },
    });

    return { success: true };
  },

  async verifyWebhookSignature(rawBody, signature) {
    if (!stripe) {
      throw new Error("Stripe client is not configured");
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
};

const providerType = process.env.PAYMENT_PROVIDER || "mock";
const providers: Record<string, PaymentProvider> = {
  mock: mockProvider,
  stripe: stripeProvider,
};

export const paymentProvider = providers[providerType] || mockProvider;
