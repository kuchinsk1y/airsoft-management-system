-- Add event moderation status fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'EventStatus'
  ) THEN
    CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

ALTER TABLE "Events"
  ADD COLUMN IF NOT EXISTS "status" "EventStatus",
  ADD COLUMN IF NOT EXISTS "statusReason" TEXT;

-- For now keep all existing events pending moderation as requested.
UPDATE "Events"
SET "status" = 'PENDING';

ALTER TABLE "Events"
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS "Events_status_idx" ON "Events"("status");
