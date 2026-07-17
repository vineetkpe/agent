import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { sanitizeHtml } from "@/lib/sanitizer";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: currentUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("[Tickets GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load tickets." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate Limit ticket creation (max 10/day per user)
    const allowed = await checkRateLimit(currentUser.id, "create_ticket", 10, 24 * 60);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can open at most 10 support tickets per day." },
        { status: 429 }
      );
    }

    const { subject, message, priority } = await req.json();
    if (!subject || !message) {
      return NextResponse.json({ error: "Missing required fields: subject and message" }, { status: 400 });
    }

    const sanitizedMessage = sanitizeHtml(message);

    // Create ticket and first message in a transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.create({
        data: {
          userId: currentUser.id,
          subject: subject.trim(),
          priority: priority || "normal",
        },
      });

      await tx.supportTicketMessage.create({
        data: {
          ticketId: t.id,
          authorUserId: currentUser.id,
          body: sanitizedMessage,
          isInternalNote: false,
        },
      });

      return t;
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("[Tickets POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create support ticket." }, { status: 500 });
  }
}
