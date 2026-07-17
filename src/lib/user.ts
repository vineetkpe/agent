import { createClient } from "@supabase/supabase-js";
import { prisma } from "./prisma";

// Mock global WebSocket for Node.js < 22 environments to satisfy Supabase Realtime checks
if (typeof global.WebSocket === "undefined") {
  (global as any).WebSocket = class {};
}

// Fallback to valid mock URL string format to prevent build evaluation crash
const supabaseUrl = process.env.SUPABASE_URL || "https://mock-supabase-url.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "mock-anon-key";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * DEV-ONLY / Local-Testing Helper.
 * Fetches the first user in the database or creates a default user "user@example.com"
 * to simplify local development and direct dashboard testing when Supabase Auth is not configured.
 */
export async function getOrCreateDefaultUser() {
  try {
    let user = await prisma.user.findFirst({
      where: { email: "vineetkpe@gmail.com" }
    });
    if (!user) {
      // Check if any other default user exists to migrate, otherwise create fresh
      const fallback = await prisma.user.findFirst();
      if (fallback) {
        user = await prisma.user.update({
          where: { id: fallback.id },
          data: {
            email: "vineetkpe@gmail.com",
            role: "admin",
            isAdmin: true
          }
        });
        console.log(`[User Service] [DEV-ONLY] Migrated local user account to admin: ${user.email}`);
      } else {
        user = await prisma.user.create({
          data: {
            email: "vineetkpe@gmail.com",
            subscriptionActive: true,
            role: "admin",
            isAdmin: true
          },
        });
        console.log(`[User Service] [DEV-ONLY] Created default admin user: ${user.email}`);
      }
    }
    return user;
  } catch (error) {
    console.error("[User Service] [DEV-ONLY] Failed to get or create default user:", error);
    throw error;
  }
}

/**
 * Returns the authenticated User row from Prisma by reading the Supabase session token
 * from the request's Authorization header or Cookies.
 * Creates a database User row on first login if it does not exist.
 */
export async function getCurrentUser(req: Request) {
  // A. Check Impersonation Token
  const impersonationToken = req.headers.get("x-impersonation-token");
  if (impersonationToken) {
    try {
      const { decrypt } = await import("./crypto");
      const decrypted = decrypt(impersonationToken);
      const payload = JSON.parse(decrypted);

      if (payload && payload.expiresAt > Date.now()) {
        const targetUser = await prisma.user.findUnique({
          where: { id: payload.targetUserId },
        });

        const adminUser = await prisma.user.findUnique({
          where: { id: payload.adminUserId },
        });

        if (targetUser && adminUser && adminUser.role === "admin") {
          console.log(`[Auth] Impersonation Session: Admin ${adminUser.email} is viewing ${targetUser.email}`);
          if (targetUser.suspended) {
            console.warn(`[Auth] Impersonation failed: Target user ${targetUser.email} is suspended.`);
            return null;
          }
          const mappedTarget = {
            ...targetUser,
            __impersonatedBy: adminUser.id,
          };
          mappedTarget.isAdmin = mappedTarget.role === "admin";
          return mappedTarget;
        }
      }
    } catch (impersonateErr) {
      console.error("[Auth] Impersonation token validation failed:", impersonateErr);
    }
  }

  let token = "";

  // 1. Check Authorization Header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7);
  }

  // 2. Fallback for Local Dev / Testing if no token is found and in non-production
  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[Auth] [DEV-ONLY] No session token found. Using dev-only default user fallback.");
      const devUser = await getOrCreateDefaultUser();
      if (devUser && devUser.suspended) {
        console.warn(`[Auth] Dev user ${devUser.email} is suspended.`);
        return null;
      }
      if (devUser) {
        devUser.role = "admin";
        devUser.isAdmin = true;
      }
      return devUser;
    }
    return null;
  }

  try {
    // 3. Validate session with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error("[Auth] Supabase session validation failed:", error);
      return null;
    }

    const email = user.email;
    const userId = user.id;

    if (!email) {
      console.error("[Auth] Supabase user has no email.");
      return null;
    }

    // 4. Look up or register the User in the local database
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: email }
        ]
      }
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          subscriptionActive: false,
        }
      });
      console.log(`[Auth] Registered new user in database: ${email}`);
    } else if (dbUser.id !== userId) {
      // If user exists with the same email but has a different ID (e.g. from local seed), align it
      dbUser = await prisma.user.update({
        where: { email: email },
        data: { id: userId }
      });
    }

    // 5. Grant admin access via ADMIN_EMAILS if configured
    const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsEnv.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    if (dbUser.email && adminEmails.includes(dbUser.email.toLowerCase())) {
      if (!dbUser.isAdmin || dbUser.role !== "admin") {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { isAdmin: true, role: "admin" }
        });
        console.log(`[Auth] Granted admin access to: ${dbUser.email}`);
      }
    }

    if (dbUser.suspended) {
      console.warn(`[Auth] User ${dbUser.email} is suspended. Access denied.`);
      return null;
    }

    dbUser.isAdmin = dbUser.role === "admin";
    return dbUser;
  } catch (err) {
    console.error("[Auth] Error fetching current user session:", err);
    return null;
  }
}


