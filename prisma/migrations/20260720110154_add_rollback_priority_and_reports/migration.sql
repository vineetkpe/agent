-- AlterTable
ALTER TABLE "AuditItem" ADD COLUMN "difficultyScore" INTEGER;
ALTER TABLE "AuditItem" ADD COLUMN "impactScore" INTEGER;
ALTER TABLE "AuditItem" ADD COLUMN "priority" TEXT;
ALTER TABLE "AuditItem" ADD COLUMN "rolledBackAt" DATETIME;

-- CreateTable
CREATE TABLE "ReportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ReportLog_userId_idx" ON "ReportLog"("userId");

-- CreateIndex
CREATE INDEX "ReportLog_siteId_idx" ON "ReportLog"("siteId");
