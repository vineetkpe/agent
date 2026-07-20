import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message = "Forbidden: Access denied.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Validates that the active user possesses one of the required authorization roles.
 * Throws a ForbiddenError (403) if validation fails.
 */
export function requireRole(user: { role?: string } | null | undefined, allowedRoles: string[]) {
  const role = user?.role || "user";
  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(`Forbidden: Access denied. Requires one of the roles: ${allowedRoles.join(", ")}`);
  }
}

/**
 * Immutable audit logger recording administrative actions into the database.
 */
export async function logAdminAction(
  actorUser: { id: string; role: string },
  action: string,
  targetType: string,
  targetId?: string | null,
  metadata?: Prisma.InputJsonValue
) {
  try {
    await prisma.adminActionLog.create({
      data: {
        actorUserId: actorUser.id,
        actorRole: actorUser.role,
        action,
        targetType,
        targetId: targetId || null,
        metadata: (metadata !== undefined && metadata !== null) ? metadata : Prisma.JsonNull,
      },
    });
  } catch (err) {
    console.error("[logAdminAction] Error writing audit log:", err);
  }
}

/**
 * Prisma select mask for support console queries.
 * Excludes secure keys, WP passwords, and customer tokens.
 */
export const SUPPORT_SAFE_USER_FIELDS = {
  id: true,
  email: true,
  plan: true,
  subscriptionActive: true,
  suspended: true,
  role: true,
  createdAt: true,
  _count: {
    select: {
      sites: true,
    },
  },
};
