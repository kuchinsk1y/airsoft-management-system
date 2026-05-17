-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('AIRSOFT', 'STRIKESHOP');

-- AlterTable
ALTER TABLE "News"
ADD COLUMN "category" "NewsCategory" NOT NULL DEFAULT 'AIRSOFT';

-- CreateIndex
CREATE INDEX "News_category_idx" ON "News"("category");

-- CreateIndex
CREATE INDEX "News_published_category_publishedAt_idx" ON "News"("published", "category", "publishedAt");
