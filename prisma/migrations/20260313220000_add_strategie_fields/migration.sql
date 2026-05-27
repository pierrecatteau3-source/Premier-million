-- AlterTable: add strategy fields to User
ALTER TABLE "User" ADD COLUMN "risqueMaxPerte"     DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "niveauConnaissance" TEXT;
ALTER TABLE "User" ADD COLUMN "objectifCroissance" DOUBLE PRECISION;
