-- Safety backfill for any rows inserted between migrations.
UPDATE "Events"
SET "gameStartDate" = "startDate"
WHERE "gameStartDate" IS NULL;

-- AlterTable
ALTER TABLE "Events"
ALTER COLUMN "gameStartDate" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Events_gameStartDate_idx" ON "Events"("gameStartDate");