import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { requireRole, logAdminAction } from "@/lib/permissions";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const isMock = !stripeSecret || stripeSecret === "mock-stripe-key";
const stripe = !isMock ? new Stripe(stripeSecret!, { apiVersion: "2025-01-27.accredited-preview" as any }) : null;

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 1. Role Authorization
    requireRole(currentUser, ["admin"]);

    const body = await req.json();
    const { code, percentOff, amountOff, redeemBy } = body;

    if (!code) {
      return NextResponse.json({ error: "Missing required promotion code parameter." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // 2. Mock mode execution
    if (isMock || !stripe) {
      console.log(`[Stripe Promotions] [MOCK MODE] Simulating coupon creation: Code=${cleanCode}, percentOff=${percentOff}, amountOff=${amountOff}`);
      
      await logAdminAction(
        currentUser,
        `Created mock promotion code ${cleanCode}`,
        "StripePromotion",
        cleanCode,
        { percentOff, amountOff, redeemBy }
      );

      return NextResponse.json({ 
        success: true, 
        message: `Mock Promotion Code ${cleanCode} created successfully.` 
      });
    }

    // 3. Live Stripe Promotion Code Creation
    const couponParams: Stripe.CouponCreateParams = {
      duration: "once",
    };

    if (percentOff !== undefined && percentOff !== "") {
      couponParams.percent_off = parseFloat(percentOff);
    } else if (amountOff !== undefined && amountOff !== "") {
      couponParams.amount_off = parseInt(amountOff, 10);
      couponParams.currency = "usd";
    } else {
      return NextResponse.json({ error: "Must specify either percentOff or amountOff." }, { status: 400 });
    }

    if (redeemBy) {
      const ts = Math.floor(new Date(redeemBy).getTime() / 1000);
      if (ts > Math.floor(Date.now() / 1000)) {
        couponParams.redeem_by = ts;
      }
    }

    console.log(`[Stripe Promotions] Creating Coupon...`);
    const stripeCoupon = await stripe.coupons.create(couponParams);

    console.log(`[Stripe Promotions] Creating PromotionCode: ${cleanCode}`);
    const stripePromoCode = await stripe.promotionCodes.create({
      coupon: stripeCoupon.id,
      code: cleanCode,
    } as any);

    // 4. Write Audit Log
    await logAdminAction(
      currentUser,
      `Created promotion code ${cleanCode}`,
      "StripePromotion",
      stripePromoCode.id,
      { stripeCouponId: stripeCoupon.id, percentOff, amountOff, redeemBy }
    );

    return NextResponse.json({ success: true, promotionCode: stripePromoCode });
  } catch (error: any) {
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[Stripe Promotions Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create Stripe promotion." }, { status: 500 });
  }
}
