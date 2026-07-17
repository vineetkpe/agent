-- AlterTable
ALTER TABLE "Audit" ADD COLUMN "gscSnapshot" TEXT;

-- AlterTable
ALTER TABLE "AuditItem" ADD COLUMN "contentQualityWarning" TEXT;
ALTER TABLE "AuditItem" ADD COLUMN "source" TEXT;

-- AlterTable
ALTER TABLE "Site" ADD COLUMN "googleRefreshTokenEncrypted" TEXT;
ALTER TABLE "Site" ADD COLUMN "gscLastSyncedAt" DATETIME;
ALTER TABLE "Site" ADD COLUMN "gscVerifiedPropertyUrl" TEXT;
