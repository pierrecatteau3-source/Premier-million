ALTER TABLE "Asset" ADD COLUMN "ticker" TEXT;
ALTER TABLE "Asset" ADD COLUMN "pricingMode" TEXT NOT NULL DEFAULT 'manual';

CREATE TABLE "Transaction" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "assetId"        TEXT NOT NULL,
  "date"           TIMESTAMP(3) NOT NULL,
  "quantite"       DOUBLE PRECISION NOT NULL,
  "prixEntreeEur"  DOUBLE PRECISION NOT NULL,
  "montantInvesti" DOUBLE PRECISION NOT NULL,
  "source"         TEXT NOT NULL DEFAULT 'manuel',
  "note"           TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Transaction_assetId_idx" ON "Transaction"("assetId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
