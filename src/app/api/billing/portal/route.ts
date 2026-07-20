import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { paymentProvider } from "@/lib/paymentProvider";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = await paymentProvider.createBillingPortalSession({
      userId: currentUser.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Billing Portal Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Could not retrieve billing portal URL" },
      { status: 500 }
    );
  }
}
