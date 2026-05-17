-- Allow company-level comments and keep event comments.
-- Add CommentScope enum, make eventId nullable, and add partial uniqueness guards.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommentScope') THEN
    CREATE TYPE "CommentScope" AS ENUM ('EVENT', 'COMPANY');
  END IF;
END $$;

ALTER TABLE "Comments"
  ADD COLUMN IF NOT EXISTS "scope" "CommentScope" NOT NULL DEFAULT 'EVENT';

ALTER TABLE "Comments"
  ALTER COLUMN "eventId" DROP NOT NULL;

UPDATE "Comments"
SET "scope" = CASE
  WHEN "eventId" IS NULL THEN 'COMPANY'::"CommentScope"
  ELSE 'EVENT'::"CommentScope"
END;

-- Keep one company comment per user and one comment per event per user.
CREATE UNIQUE INDEX IF NOT EXISTS "Comments_event_user_unique"
  ON "Comments" ("eventId", "userId")
  WHERE "eventId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Comments_company_user_unique"
  ON "Comments" ("userId")
  WHERE "eventId" IS NULL;
