import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { paymentProvider } from "@/lib/paymentProvider";
import { logAdminAction } from "@/lib/permissions";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let reason = "other";
    try {
      const body = await req.json();
      if (body.reason) {
        reason = String(body.reason).trim();
      }
    } catch {
      // Body might be empty or invalid, fallback to default
    }

    // Save cancellation reason
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { cancellationReason: reason },
    });

    // Call payment provider cancel subscription
    await paymentProvider.cancelSubscription({ userId: currentUser.id });

    // Fetch updated user to get accurate subscriptionEndsAt
    const updatedUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    const endDateStr = updatedUser?.subscriptionEndsAt 
      ? new Date(updatedUser.subscriptionEndsAt).toLocaleDateString() 
      : "the end of your current billing period";

    // Log action to AdminActionLog with actorRole: 'user'
    await logAdminAction(
      { id: currentUser.id, role: "user" },
      "cancel_subscription",
      "user",
      currentUser.id,
      { reason }
    );

    // Send confirmation email via Resend
    await sendEmail({
      to: currentUser.email,
      subject: "Your subscription cancellation confirmation",
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
          <h2>Subscription Cancelled</h2>
          <p>Hello,</p>
          <p>This email confirms that you have cancelled your HeyDrona subscription.</p>
          <p>Your workspace premium access will continue normally until <strong>${endDateStr}</strong>, which is the end of the period you have already paid for. After this date, your plan will revert to the Free tier and you will not be charged again.</p>
          <p>We are sorry to see you go. If you have any feedback or would like to share why you cancelled, please reply directly to this email.</p>
          <br />
          <p>Best regards,</p>
          <p>The HeyDrona Team</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Billing Cancel Route Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Could not process subscription cancellation" },
      { status: 500 }
    );
  }
}

