-- AlterTable
ALTER TABLE "Site" ADD COLUMN "businessGoals" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "subscriptionActive" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT,
    "planSource" TEXT,
    "planActivatedAt" DATETIME,
    "onboardingCompletedAt" DATETIME,
    "lastNotificationCheckAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'user',
    "paymentFailedAt" DATETIME,
    "subscriptionStatus" TEXT,
    "name" TEXT,
    "reportEmailDay" INTEGER DEFAULT 1,
    "reportEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionEndsAt" DATETIME,
    "cancellationReason" TEXT
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isAdmin", "lastNotificationCheckAt", "onboardingCompletedAt", "paymentFailedAt", "plan", "planActivatedAt", "planSource", "role", "stripeCustomerId", "subscriptionActive", "subscriptionStatus", "suspended") SELECT "createdAt", "email", "id", "isAdmin", "lastNotificationCheckAt", "onboardingCompletedAt", "paymentFailedAt", "plan", "planActivatedAt", "planSource", "role", "stripeCustomerId", "subscriptionActive", "subscriptionStatus", "suspended" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
