import { prisma } from "./prisma";

/**
 * Fetches the first user in the database or creates a default user "user@example.com"
 * to simplify local development and direct dashboard testing.
 */
export async function getOrCreateDefaultUser() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "user@example.com",
          subscriptionActive: true, // Make active for full dashboard testing
        },
      });
      console.log(`[User Service] Created default user: ${user.email}`);
    }
    return user;
  } catch (error) {
    console.error("[User Service] Failed to get or create default user:", error);
    throw error;
  }
}
