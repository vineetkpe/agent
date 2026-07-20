import { prisma } from "./prisma";
import { headers } from "next/headers";

export async function logActivity(
  userId: string,
  action: string,
  metadata?: any,
  req?: Request
) {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (req) {
      ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
      userAgent = req.headers.get("user-agent");
    } else {
      try {
        const nextHeaders = await headers();
        ipAddress = nextHeaders.get("x-forwarded-for") || nextHeaders.get("x-real-ip");
        userAgent = nextHeaders.get("user-agent");
      } catch (e) {
        // Quietly fail when invoked outside request boundary (e.g. cron triggers)
      }
    }

    if (ipAddress && ipAddress.includes(",")) {
      ipAddress = ipAddress.split(",")[0].trim();
    }

    await prisma.userActivityLog.create({
      data: {
        userId,
        action,
        metadata: metadata || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[logActivity Failure]:", err);
  }
}
