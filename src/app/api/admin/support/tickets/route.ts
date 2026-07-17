import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireRole, logAdminAction, SUPPORT_SAFE_USER_FIELDS } from "@/lib/permissions";
import { sanitizeHtml } from "@/lib/sanitizer";

async function sendAlertEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "mock-resend-key") {
    console.warn(`[Support Alert Mock] Skip real email to ${to}: ${subject}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "HeyDrona Support <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[Support Alert] Email failed: ${txt}`);
    }
  } catch (err) {
    console.error("[Support Alert] Net error sending email:", err);
  }
}

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Gated to both Admin and Support roles
    requireRole(currentUser, ["admin", "support"]);

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const assignmentFilter = searchParams.get("assignment"); // 'me' | 'unassigned' | 'all'

    const whereClause: any = {};
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    if (assignmentFilter === "me") {
      whereClause.assignedToUserId = currentUser.id;
    } else if (assignmentFilter === "unassigned") {
      whereClause.assignedToUserId = null;
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: SUPPORT_SAFE_USER_FIELDS, // Strict database-level select override
        },
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
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to load tickets." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    requireRole(currentUser, ["admin", "support"]);

    const body = await req.json();
    const { ticketId, message, isInternalNote } = body;

    if (!ticketId || !message) {
      return NextResponse.json({ error: "Missing required fields: ticketId and message" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const sanitizedBody = sanitizeHtml(message);
    const internal = !!isInternalNote;

    const savedMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.supportTicketMessage.create({
        data: {
          ticketId,
          authorUserId: currentUser.id,
          body: sanitizedBody,
          isInternalNote: internal,
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    // Email customer if a public reply is posted
    if (!internal && ticket.user?.email) {
      const customerEmail = ticket.user.email;
      const emailSubject = `[HeyDrona Support] Re: ${ticket.subject}`;
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
          <h3>Update on your Support Ticket</h3>
          <p>Hello,</p>
          <p>A support representative has replied to your ticket: <strong>"${ticket.subject}"</strong></p>
          <hr style="border: 0; border-top: 1px border-zinc-200; margin: 15px 0;" />
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${sanitizedBody}
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            Please log in to your dashboard to view the full conversation thread.
          </p>
        </div>
      `;
      await sendAlertEmail(customerEmail, emailSubject, emailHtml);
    }

    await logAdminAction(
      currentUser,
      `Posted reply to ticket ${ticketId}`,
      "SupportTicket",
      ticketId,
      { isInternalNote: internal }
    );

    return NextResponse.json({ success: true, message: savedMessage });
  } catch (error: any) {
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to post message." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    requireRole(currentUser, ["admin", "support"]);

    const body = await req.json();
    const { ticketId, status, assignedToUserId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Missing required field: ticketId" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = status;
    }

    if (assignedToUserId !== undefined) {
      // Security: Support role can only self-assign or unassign. Assigning to others requires Admin role.
      if (assignedToUserId !== null && assignedToUserId !== currentUser.id) {
        if (currentUser.role !== "admin") {
          return NextResponse.json(
            { error: "Forbidden: Assigning tickets to other staff members is an Administrator-only action." },
            { status: 403 }
          );
        }
      }
      updateData.assignedToUserId = assignedToUserId;
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Email assigned staff member if assignment changed
    if (assignedToUserId && assignedToUserId !== ticket.assignedToUserId) {
      const staffUser = await prisma.user.findUnique({
        where: { id: assignedToUserId },
      });
      if (staffUser?.email) {
        const staffEmail = staffUser.email;
        const emailSubject = `[Support Desk] Assigned: Ticket #${updatedTicket.id}`;
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
            <h3>Support Ticket Assigned</h3>
            <p>You have been assigned to support ticket #${updatedTicket.id}:</p>
            <ul>
              <li><strong>Subject:</strong> ${updatedTicket.subject}</li>
              <li><strong>Priority:</strong> ${updatedTicket.priority}</li>
              <li><strong>Client Email:</strong> ${ticket.user?.email || "Unknown"}</li>
            </ul>
            <p>Please open the support console to view the thread.</p>
          </div>
        `;
        await sendAlertEmail(staffEmail, emailSubject, emailHtml);
      }
    }

    await logAdminAction(
      currentUser,
      `Updated ticket parameters (status=${status || "no-change"}, assignedTo=${assignedToUserId || "no-change"})`,
      "SupportTicket",
      ticketId,
      updateData
    );

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to update ticket parameters." }, { status: 500 });
  }
}
