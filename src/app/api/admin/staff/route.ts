import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireRole, logAdminAction } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 1. Role Authorization
    requireRole(currentUser, ["admin"]);

    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields: userId and role" }, { status: 400 });
    }

    // 2. Validate Target Role
    if (role !== "user" && role !== "support") {
      return NextResponse.json(
        { error: "Invalid role option. Promoting to admin is restricted at the API level." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Cannot modify role of an existing administrator." }, { status: 400 });
    }

    // 3. Update User Role
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        isAdmin: false, // Ensure isAdmin legacy field stays synchronized
      },
    });

    // 4. Write Audit Log
    await logAdminAction(
      currentUser,
      `Changed user role to ${role}`,
      "User",
      userId,
      { previousRole: targetUser.role, newRole: role }
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to update user role." }, { status: 500 });
  }
}
