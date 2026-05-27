-- AlterTable: add epargnePrecaution and evolutionEpargne to User
ALTER TABLE "User" ADD COLUMN "epargnePrecaution" INTEGER;
ALTER TABLE "User" ADD COLUMN "evolutionEpargne"  DOUBLE PRECISION;
