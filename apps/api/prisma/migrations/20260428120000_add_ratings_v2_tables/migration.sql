-- ratings v2: additive migration, safe for existing production data

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RatingOutcome') THEN
    CREATE TYPE "RatingOutcome" AS ENUM ('WIN', 'PARTICIPATED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RatingEntrySubjectType') THEN
    CREATE TYPE "RatingEntrySubjectType" AS ENUM ('PLAYER', 'TEAM', 'ORGANIZER');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "RatingGameTypes" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "playerPoints" INTEGER NOT NULL DEFAULT 0,
  "teamWinPoints" INTEGER NOT NULL DEFAULT 0,
  "teamParticipatedPoints" INTEGER NOT NULL DEFAULT 0,
  "organizerPointsPerParticipant" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RatingGameTypes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RatingGameTypes_name_key" UNIQUE ("name")
);

CREATE TABLE IF NOT EXISTS "EventRatingConfigs" (
  "id" SERIAL NOT NULL,
  "eventId" INTEGER NOT NULL,
  "gameTypeId" INTEGER NOT NULL,
  "actualParticipants" INTEGER NOT NULL DEFAULT 0,
  "isApplied" BOOLEAN NOT NULL DEFAULT false,
  "appliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventRatingConfigs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventRatingConfigs_eventId_key" UNIQUE ("eventId")
);

CREATE TABLE IF NOT EXISTS "EventRatingOutcomes" (
  "id" SERIAL NOT NULL,
  "ratingConfigId" INTEGER NOT NULL,
  "sideId" INTEGER,
  "teamId" INTEGER,
  "outcome" "RatingOutcome" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventRatingOutcomes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventRatingOutcomes_ratingConfigId_sideId_teamId_key" UNIQUE ("ratingConfigId", "sideId", "teamId")
);

CREATE TABLE IF NOT EXISTS "RatingEntries" (
  "id" SERIAL NOT NULL,
  "eventId" INTEGER NOT NULL,
  "subjectType" "RatingEntrySubjectType" NOT NULL,
  "userId" INTEGER,
  "teamId" INTEGER,
  "organizerUserId" INTEGER,
  "points" INTEGER NOT NULL,
  "gamesDelta" INTEGER NOT NULL DEFAULT 0,
  "winsDelta" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RatingEntries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TeamStats" (
  "teamId" INTEGER NOT NULL,
  "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "averagePoints" DECIMAL(10,2),
  "winRate" DECIMAL(5,2),
  "rank" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamStats_pkey" PRIMARY KEY ("teamId")
);

CREATE TABLE IF NOT EXISTS "OrganizerStats" (
  "userId" INTEGER NOT NULL,
  "gamesOrganized" INTEGER NOT NULL DEFAULT 0,
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "averagePoints" DECIMAL(10,2),
  "rank" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizerStats_pkey" PRIMARY KEY ("userId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "RatingGameTypes_isActive_idx" ON "RatingGameTypes"("isActive");

CREATE INDEX IF NOT EXISTS "EventRatingConfigs_gameTypeId_idx" ON "EventRatingConfigs"("gameTypeId");
CREATE INDEX IF NOT EXISTS "EventRatingConfigs_isApplied_idx" ON "EventRatingConfigs"("isApplied");

CREATE INDEX IF NOT EXISTS "EventRatingOutcomes_ratingConfigId_idx" ON "EventRatingOutcomes"("ratingConfigId");
CREATE INDEX IF NOT EXISTS "EventRatingOutcomes_sideId_idx" ON "EventRatingOutcomes"("sideId");
CREATE INDEX IF NOT EXISTS "EventRatingOutcomes_teamId_idx" ON "EventRatingOutcomes"("teamId");

CREATE INDEX IF NOT EXISTS "RatingEntries_eventId_idx" ON "RatingEntries"("eventId");
CREATE INDEX IF NOT EXISTS "RatingEntries_subjectType_idx" ON "RatingEntries"("subjectType");
CREATE INDEX IF NOT EXISTS "RatingEntries_userId_idx" ON "RatingEntries"("userId");
CREATE INDEX IF NOT EXISTS "RatingEntries_teamId_idx" ON "RatingEntries"("teamId");
CREATE INDEX IF NOT EXISTS "RatingEntries_organizerUserId_idx" ON "RatingEntries"("organizerUserId");

CREATE INDEX IF NOT EXISTS "TeamStats_totalPoints_idx" ON "TeamStats"("totalPoints");
CREATE INDEX IF NOT EXISTS "TeamStats_rank_idx" ON "TeamStats"("rank");
CREATE INDEX IF NOT EXISTS "TeamStats_winRate_idx" ON "TeamStats"("winRate");

CREATE INDEX IF NOT EXISTS "OrganizerStats_totalPoints_idx" ON "OrganizerStats"("totalPoints");
CREATE INDEX IF NOT EXISTS "OrganizerStats_rank_idx" ON "OrganizerStats"("rank");

-- Add Events.ratingGameTypeId column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Events'
      AND column_name = 'ratingGameTypeId'
  ) THEN
    ALTER TABLE "Events" ADD COLUMN "ratingGameTypeId" INTEGER;
  END IF;
END $$;

-- Seed fallback game type only if table is empty
INSERT INTO "RatingGameTypes" (
  "name",
  "playerPoints",
  "teamWinPoints",
  "teamParticipatedPoints",
  "organizerPointsPerParticipant",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  'Стандарт',
  5,
  50,
  25,
  5,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "RatingGameTypes");

-- Backfill all existing events to a valid game type id
UPDATE "Events"
SET "ratingGameTypeId" = (
  SELECT "id" FROM "RatingGameTypes" ORDER BY "id" ASC LIMIT 1
)
WHERE "ratingGameTypeId" IS NULL;

-- Set not null and FK only after backfill
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Events'
      AND column_name = 'ratingGameTypeId'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Events" ALTER COLUMN "ratingGameTypeId" SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Events_ratingGameTypeId_fkey'
  ) THEN
    ALTER TABLE "Events"
    ADD CONSTRAINT "Events_ratingGameTypeId_fkey"
    FOREIGN KEY ("ratingGameTypeId") REFERENCES "RatingGameTypes"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

-- Foreign keys for rating tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventRatingConfigs_eventId_fkey'
  ) THEN
    ALTER TABLE "EventRatingConfigs"
    ADD CONSTRAINT "EventRatingConfigs_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Events"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventRatingConfigs_gameTypeId_fkey'
  ) THEN
    ALTER TABLE "EventRatingConfigs"
    ADD CONSTRAINT "EventRatingConfigs_gameTypeId_fkey"
    FOREIGN KEY ("gameTypeId") REFERENCES "RatingGameTypes"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventRatingOutcomes_ratingConfigId_fkey'
  ) THEN
    ALTER TABLE "EventRatingOutcomes"
    ADD CONSTRAINT "EventRatingOutcomes_ratingConfigId_fkey"
    FOREIGN KEY ("ratingConfigId") REFERENCES "EventRatingConfigs"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventRatingOutcomes_sideId_fkey'
  ) THEN
    ALTER TABLE "EventRatingOutcomes"
    ADD CONSTRAINT "EventRatingOutcomes_sideId_fkey"
    FOREIGN KEY ("sideId") REFERENCES "EventSides"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventRatingOutcomes_teamId_fkey'
  ) THEN
    ALTER TABLE "EventRatingOutcomes"
    ADD CONSTRAINT "EventRatingOutcomes_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Teams"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RatingEntries_eventId_fkey'
  ) THEN
    ALTER TABLE "RatingEntries"
    ADD CONSTRAINT "RatingEntries_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Events"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RatingEntries_userId_fkey'
  ) THEN
    ALTER TABLE "RatingEntries"
    ADD CONSTRAINT "RatingEntries_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "Users"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RatingEntries_teamId_fkey'
  ) THEN
    ALTER TABLE "RatingEntries"
    ADD CONSTRAINT "RatingEntries_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Teams"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RatingEntries_organizerUserId_fkey'
  ) THEN
    ALTER TABLE "RatingEntries"
    ADD CONSTRAINT "RatingEntries_organizerUserId_fkey"
    FOREIGN KEY ("organizerUserId") REFERENCES "Users"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TeamStats_teamId_fkey'
  ) THEN
    ALTER TABLE "TeamStats"
    ADD CONSTRAINT "TeamStats_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Teams"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrganizerStats_userId_fkey'
  ) THEN
    ALTER TABLE "OrganizerStats"
    ADD CONSTRAINT "OrganizerStats_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "Users"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;