-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "aiProviderPriority" TEXT;

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN "crawlerUsed" TEXT;
ALTER TABLE "Audit" ADD COLUMN "crawlerWarning" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApiUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "callType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "wasFailover" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ApiUsageLog" ("callType", "createdAt", "id", "provider", "success", "userId") SELECT "callType", "createdAt", "id", "provider", "success", "userId" FROM "ApiUsageLog";
DROP TABLE "ApiUsageLog";
ALTER TABLE "new_ApiUsageLog" RENAME TO "ApiUsageLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
