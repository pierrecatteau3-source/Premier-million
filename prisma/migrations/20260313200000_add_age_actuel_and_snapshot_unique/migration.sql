-- AlterTable: add ageActuel to User
ALTER TABLE "User" ADD COLUMN "ageActuel" INTEGER;

-- CreateIndex: unique constraint on Snapshot(assetId, date)
CREATE UNIQUE INDEX "Snapshot_assetId_date_key" ON "Snapshot"("assetId", "date");
