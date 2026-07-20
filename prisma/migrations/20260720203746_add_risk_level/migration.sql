-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "currentValue" TEXT,
    "suggestedValue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" DATETIME,
    "rolledBackAt" DATETIME,
    "autoAppliedAt" DATETIME,
    "riskLevel" TEXT NOT NULL DEFAULT 'high',
    "errorMessage" TEXT,
    "wpPostId" TEXT,
    "source" TEXT,
    "contentQualityWarning" TEXT,
    "priority" TEXT,
    "impactScore" INTEGER,
    "difficultyScore" INTEGER,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuditItem" ("appliedAt", "auditId", "contentQualityWarning", "createdAt", "currentValue", "difficultyScore", "errorMessage", "id", "impactScore", "priority", "rolledBackAt", "siteId", "source", "status", "suggestedValue", "targetUrl", "type", "updatedAt", "wpPostId") SELECT "appliedAt", "auditId", "contentQualityWarning", "createdAt", "currentValue", "difficultyScore", "errorMessage", "id", "impactScore", "priority", "rolledBackAt", "siteId", "source", "status", "suggestedValue", "targetUrl", "type", "updatedAt", "wpPostId" FROM "AuditItem";
DROP TABLE "AuditItem";
ALTER TABLE "new_AuditItem" RENAME TO "AuditItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
