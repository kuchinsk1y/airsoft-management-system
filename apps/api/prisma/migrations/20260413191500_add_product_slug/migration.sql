-- Add slug column for SEO-friendly product URLs
ALTER TABLE "Products"
ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Backfill slug for existing rows where it is missing
UPDATE "Products"
SET "slug" = CONCAT(
  COALESCE(
    NULLIF(regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'), ''),
    'product'
  ),
  '-',
  "id"::text
)
WHERE "slug" IS NULL OR btrim("slug") = '';

-- Keep schema compatible with Prisma model
ALTER TABLE "Products"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Products_slug_key"
ON "Products"("slug");

CREATE INDEX IF NOT EXISTS "Products_slug_idx"
ON "Products"("slug");
