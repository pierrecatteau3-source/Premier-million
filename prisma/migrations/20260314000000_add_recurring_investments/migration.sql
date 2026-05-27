CREATE TABLE "RecurringInvestment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "frequency" TEXT NOT NULL,
  "dayOfWeek" INTEGER,
  "dayOfMonth" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringInvestment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RecurringInvestment" ADD CONSTRAINT "RecurringInvestment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringInvestment" ADD CONSTRAINT "RecurringInvestment_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
