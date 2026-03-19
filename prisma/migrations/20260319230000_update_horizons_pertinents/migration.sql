-- Migration: update_horizons_pertinents
-- Replace short-term horizons (MONTH_1, MONTH_3, MONTH_6) with long-term investor-oriented horizons.
-- YEAR_1 is kept as-is. Old analyses with MONTH_1/MONTH_3/MONTH_6 are migrated to YEAR_1
-- (the closest relevant long-term horizon) to preserve data without loss.

-- Step 1: Add new enum values to the existing Horizon enum
ALTER TYPE "Horizon" ADD VALUE IF NOT EXISTS 'YEAR_3';
ALTER TYPE "Horizon" ADD VALUE IF NOT EXISTS 'YEAR_5';
ALTER TYPE "Horizon" ADD VALUE IF NOT EXISTS 'YEAR_10';

-- Step 2: Migrate existing Analysis rows using old horizon values to YEAR_1
-- MONTH_1 → YEAR_1 (short-term analyses kept as closest long-term equivalent)
-- MONTH_3 → YEAR_1
-- MONTH_6 → YEAR_1
UPDATE "Analysis"
SET "horizon" = 'YEAR_1'
WHERE "horizon" IN ('MONTH_1', 'MONTH_3', 'MONTH_6');

-- Step 3: Remove old enum values
-- PostgreSQL does not support DROP VALUE directly; we rename the type and recreate it.
ALTER TYPE "Horizon" RENAME TO "Horizon_old";

CREATE TYPE "Horizon" AS ENUM ('YEAR_1', 'YEAR_3', 'YEAR_5', 'YEAR_10');

-- Step 4: Alter the Analysis table to use the new enum type
ALTER TABLE "Analysis"
  ALTER COLUMN "horizon" TYPE "Horizon"
  USING "horizon"::text::"Horizon";

-- Step 5: Drop the old enum type
DROP TYPE "Horizon_old";
