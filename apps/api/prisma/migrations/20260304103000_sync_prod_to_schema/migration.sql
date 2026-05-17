-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventResultStatus') THEN
        CREATE TYPE "EventResultStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventPlacement') THEN
        CREATE TYPE "EventPlacement" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'PARTICIPATED');
    END IF;
END $$;

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_ON_SITE';

-- AlterTable
ALTER TABLE "Events"
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PlayerStats"
ADD COLUMN IF NOT EXISTS "averagePoints" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "draws" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "previousRank" INTEGER,
ADD COLUMN IF NOT EXISTS "totalPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "winRate" DECIMAL(5,2);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EventResults" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER,
    "teamId" INTEGER,
    "placement" "EventPlacement" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "kills" INTEGER DEFAULT 0,
    "deaths" INTEGER DEFAULT 0,
    "accuracy" DECIMAL(5,2),
    "status" "EventResultStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventResults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventResults_eventId_idx" ON "EventResults"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventResults_userId_idx" ON "EventResults"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventResults_teamId_idx" ON "EventResults"("teamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventResults_placement_idx" ON "EventResults"("placement");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventResults_points_idx" ON "EventResults"("points");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventResults_status_idx" ON "EventResults"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TeamStats_totalPoints_idx" ON "TeamStats"("totalPoints");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TeamStats_rank_idx" ON "TeamStats"("rank");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TeamStats_winRate_idx" ON "TeamStats"("winRate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comments_eventId_idx" ON "Comments"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comments_userId_idx" ON "Comments"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comments_status_idx" ON "Comments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comments_createdAt_idx" ON "Comments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Comments_eventId_userId_createdAt_key" ON "Comments"("eventId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlayerStats_totalPoints_idx" ON "PlayerStats"("totalPoints");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlayerStats_winRate_idx" ON "PlayerStats"("winRate");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EventResults_eventId_fkey') THEN
        ALTER TABLE "EventResults" ADD CONSTRAINT "EventResults_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EventResults_userId_fkey') THEN
        ALTER TABLE "EventResults" ADD CONSTRAINT "EventResults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EventResults_teamId_fkey') THEN
        ALTER TABLE "EventResults" ADD CONSTRAINT "EventResults_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EventResults_confirmedBy_fkey') THEN
        ALTER TABLE "EventResults" ADD CONSTRAINT "EventResults_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeamStats_teamId_fkey') THEN
        ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

