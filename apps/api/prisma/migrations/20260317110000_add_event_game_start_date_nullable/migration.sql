-- AlterTable
ALTER TABLE "Events"
ADD COLUMN IF NOT EXISTS "gameStartDate" TIMESTAMP(3);

-- Backfill historical events so the new field has a meaningful value.
UPDATE "Events"
SET "gameStartDate" = "startDate"
WHERE "gameStartDate" IS NULL;