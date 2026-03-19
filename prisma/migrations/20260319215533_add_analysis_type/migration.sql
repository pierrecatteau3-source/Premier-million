-- AlterTable: add type column to Analysis with default "PORTFOLIO"
ALTER TABLE "Analysis" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PORTFOLIO';

-- DropIndex
DROP INDEX "Analysis_userId_horizon_createdAt_idx";

-- CreateIndex
CREATE INDEX "Analysis_userId_type_horizon_createdAt_idx" ON "Analysis"("userId", "type", "horizon", "createdAt");
