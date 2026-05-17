-- AlterTable
ALTER TABLE "Regions" ADD COLUMN "seoText" TEXT, ADD COLUMN "seoFaq" JSONB;

-- AlterTable
ALTER TABLE "Cities" ADD COLUMN "seoText" TEXT, ADD COLUMN "seoFaq" JSONB;
