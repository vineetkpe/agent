import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await logActivity(currentUser.id, "login", { method: "web_session" }, req);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Login Event API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to log login event." }, { status: 500 });
  }
}
