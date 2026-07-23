import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { paymentProvider } from "@/lib/paymentProvider";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!currentUser.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const invoices = await paymentProvider.listInvoices(currentUser.stripeCustomerId);

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("[User Invoices API Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch invoices." },
      { status: 500 }
    );
  }
}
