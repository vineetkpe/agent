-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "monthlyPriceCents" INTEGER NOT NULL,
    "annualPriceCents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Feature" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanFeature_featureKey_fkey" FOREIGN KEY ("featureKey") REFERENCES "Feature" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assignedToUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternalNote" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupportTicketMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "role" TEXT NOT NULL DEFAULT 'user'
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isAdmin", "lastNotificationCheckAt", "onboardingCompletedAt", "plan", "planActivatedAt", "planSource", "stripeCustomerId", "subscriptionActive", "suspended") SELECT "createdAt", "email", "id", "isAdmin", "lastNotificationCheckAt", "onboardingCompletedAt", "plan", "planActivatedAt", "planSource", "stripeCustomerId", "subscriptionActive", "suspended" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFeature_planId_featureKey_key" ON "PlanFeature"("planId", "featureKey");
