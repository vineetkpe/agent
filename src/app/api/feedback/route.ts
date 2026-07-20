import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { logActivity } from "@/lib/activityLog";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { type, message, pageContext } = await req.json();

    if (!type || !["bug", "suggestion", "other"].includes(type)) {
      return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Feedback message cannot be empty." }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "Feedback message exceeds the 5000 character limit." }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: currentUser.id,
        type,
        message: message.trim(),
        pageContext: pageContext || null,
        status: "open",
      },
    });

    await logActivity(currentUser.id, "feedback_submitted", { type, feedbackId: feedback.id }, req);

    // Send warning email if bug type is submitted
    if (type === "bug") {
      const founderEmail = process.env.ADMIN_EMAILS?.split(",")[0] || "vineetkpe@gmail.com";
      await sendEmail({
        to: founderEmail,
        subject: `[HeyDrona Bug Alert] Urgent issue reported by ${currentUser.email}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
            <h2>Urgent Bug Report</h2>
            <p><strong>User:</strong> ${currentUser.email} (${currentUser.id})</p>
            <p><strong>Context Tab/Page:</strong> ${pageContext || "Unknown"}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f4f4f5; padding: 15px; border-left: 4px solid #7c3aed; margin: 0;">
              ${feedback.message.replace(/\n/g, "<br />")}
            </blockquote>
            <hr />
            <p>Please resolve this in the admin panel.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error("[Feedback POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to submit feedback." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const feedbackList = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Resolve user emails
    const userIds = Array.from(new Set(feedbackList.map(f => f.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(users.map(u => [u.id, u.email]));

    const enriched = feedbackList.map(f => ({
      ...f,
      userEmail: emailMap.get(f.userId) || "Unknown",
    }));

    return NextResponse.json({ success: true, feedback: enriched });
  } catch (error: any) {
    console.error("[Feedback GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load feedbacks." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { feedbackId, status } = await req.json();
    if (!feedbackId || !["open", "reviewed", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
    }

    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        status,
        resolvedAt: status === "resolved" ? new Date() : null,
      },
    });

    await logActivity(currentUser.id, "admin_action", { action: `feedback_status_${status}`, feedbackId }, req);

    return NextResponse.json({ success: true, feedback: updated });
  } catch (error: any) {
    console.error("[Feedback PATCH Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update feedback status." }, { status: 500 });
  }
}
