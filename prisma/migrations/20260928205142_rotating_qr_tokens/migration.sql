-- DropIndex
DROP INDEX "DailyQrToken_siteId_date_key";

-- CreateIndex
CREATE INDEX "DailyQrToken_siteId_createdAt_idx" ON "DailyQrToken"("siteId", "createdAt");
