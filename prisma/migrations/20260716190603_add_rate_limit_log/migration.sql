-- CreateTable
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "RateLimitLog_userId_routeKey_createdAt_idx" ON "RateLimitLog"("userId", "routeKey", "createdAt");
