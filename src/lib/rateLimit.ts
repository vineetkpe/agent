import { prisma } from "./prisma";

/**
 * DB-backed rate limiter counting requests for a user on a specific route within a sliding window.
 * Returns true if the request is allowed, or false if the rate limit is exceeded.
 */
export async function checkRateLimit(
  userId: string,
  routeKey: string,
  maxRequests: number,
  windowMinutes: number
): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const count = await prisma.rateLimitLog.count({
    where: {
      userId,
      routeKey,
      createdAt: {
        gte: cutoff,
      },
    },
  });

  if (count >= maxRequests) {
    return false;
  }

  // Log the attempt
  await prisma.rateLimitLog.create({
    data: {
      userId,
      routeKey,
    },
  });

  return true;
}
