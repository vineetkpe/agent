-- CreateTable
CREATE TABLE "UptimeCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "checkedAt" DATETIME NOT NULL,
    "isUp" BOOLEAN NOT NULL,
    "responseTimeMs" INTEGER,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    CONSTRAINT "UptimeCheck_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "wpUrl" TEXT,
    "wpUsername" TEXT,
    "wpAppPasswordEncrypted" TEXT,
    "customInstructions" TEXT,
    "gscConnected" BOOLEAN NOT NULL DEFAULT false,
    "gscUrl" TEXT,
    "googleRefreshTokenEncrypted" TEXT,
    "gscVerifiedPropertyUrl" TEXT,
    "gscLastSyncedAt" DATETIME,
    "gscCachedData" TEXT,
    "businessProfile" TEXT,
    "detectedSeoPlugin" TEXT,
    "wpConnectedAt" DATETIME,
    "uptimeMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "currentUptimeStatus" TEXT,
    "lastUptimeCheckAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Site" ("businessProfile", "createdAt", "customInstructions", "detectedSeoPlugin", "googleRefreshTokenEncrypted", "gscCachedData", "gscConnected", "gscLastSyncedAt", "gscUrl", "gscVerifiedPropertyUrl", "id", "url", "userId", "wpAppPasswordEncrypted", "wpConnectedAt", "wpUrl", "wpUsername") SELECT "businessProfile", "createdAt", "customInstructions", "detectedSeoPlugin", "googleRefreshTokenEncrypted", "gscCachedData", "gscConnected", "gscLastSyncedAt", "gscUrl", "gscVerifiedPropertyUrl", "id", "url", "userId", "wpAppPasswordEncrypted", "wpConnectedAt", "wpUrl", "wpUsername" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "UptimeCheck_siteId_checkedAt_idx" ON "UptimeCheck"("siteId", "checkedAt");
