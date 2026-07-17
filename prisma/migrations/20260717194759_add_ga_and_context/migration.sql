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
    "gaPropertyId" TEXT,
    "gaConnected" BOOLEAN NOT NULL DEFAULT false,
    "manuallyEnteredContext" TEXT,
    "competitorsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crawlScheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "crawlScheduleHourUtc" INTEGER,
    "lastScheduledCrawlAt" DATETIME,
    CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Site" ("businessProfile", "crawlScheduleEnabled", "crawlScheduleHourUtc", "createdAt", "currentUptimeStatus", "customInstructions", "detectedSeoPlugin", "googleRefreshTokenEncrypted", "gscCachedData", "gscConnected", "gscLastSyncedAt", "gscUrl", "gscVerifiedPropertyUrl", "id", "lastScheduledCrawlAt", "lastUptimeCheckAt", "uptimeMonitoringEnabled", "url", "userId", "wpAppPasswordEncrypted", "wpConnectedAt", "wpUrl", "wpUsername") SELECT "businessProfile", "crawlScheduleEnabled", "crawlScheduleHourUtc", "createdAt", "currentUptimeStatus", "customInstructions", "detectedSeoPlugin", "googleRefreshTokenEncrypted", "gscCachedData", "gscConnected", "gscLastSyncedAt", "gscUrl", "gscVerifiedPropertyUrl", "id", "lastScheduledCrawlAt", "lastUptimeCheckAt", "uptimeMonitoringEnabled", "url", "userId", "wpAppPasswordEncrypted", "wpConnectedAt", "wpUrl", "wpUsername" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
