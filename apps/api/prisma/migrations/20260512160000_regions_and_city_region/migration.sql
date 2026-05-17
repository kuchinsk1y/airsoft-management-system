-- CreateTable
CREATE TABLE "Regions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Regions_name_key" ON "Regions"("name");

CREATE UNIQUE INDEX "Regions_slug_key" ON "Regions"("slug");

INSERT INTO "Regions" ("name", "slug") VALUES
('Вінницька область', 'vinnicka-oblast'),
('Волинська область', 'volinska-oblast'),
('Дніпропетровська область', 'dnipropetrovska-oblast'),
('Донецька область', 'donecka-oblast'),
('Житомирська область', 'zhitomirska-oblast'),
('Закарпатська область', 'zakarpatska-oblast'),
('Запорізька область', 'zaporizka-oblast'),
('Івано-Франківська область', 'ivano-frankivska-oblast'),
('Київська область', 'kiivska-oblast'),
('Кіровоградська область', 'kirovogradska-oblast'),
('Луганська область', 'luganska-oblast'),
('Львівська область', 'lvivska-oblast'),
('Миколаївська область', 'mikolaivska-oblast'),
('Одеська область', 'odeska-oblast'),
('Полтавська область', 'poltavska-oblast'),
('Рівненська область', 'rivnenska-oblast'),
('Сумська область', 'sumska-oblast'),
('Тернопільська область', 'ternopilska-oblast'),
('Харківська область', 'harkivska-oblast'),
('Херсонська область', 'hersonska-oblast'),
('Хмельницька область', 'hmelnicka-oblast'),
('Черкаська область', 'cherkaska-oblast'),
('Чернівецька область', 'chernivecka-oblast'),
('Чернігівська область', 'chernigivska-oblast'),
('м. Київ', 'kyiv-city'),
('Автономна Республіка Крим', 'avtonomna-respublika-krim');

-- AlterTable
ALTER TABLE "Cities" ADD COLUMN     "regionId" INTEGER;

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'kyiv-city'
  AND (LOWER(c.name) IN ('київ', 'kyiv', 'kiev'));

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'lvivska-oblast'
  AND LOWER(c.name) IN ('львів', 'lviv');

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'odeska-oblast'
  AND LOWER(c.name) IN ('одеса', 'odesa', 'odessa');

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'ivano-frankivska-oblast'
  AND LOWER(c.name) IN ('івано-франківськ', 'ivano-frankivsk');

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'harkivska-oblast'
  AND LOWER(c.name) IN ('харків', 'kharkiv');

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'dnipropetrovska-oblast'
  AND LOWER(c.name) IN ('дніпро', 'dnipro', 'дніпропетровськ');

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'zaporizka-oblast'
  AND LOWER(c.name) IN ('запоріжжя', 'zaporizhzhia');

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'poltavska-oblast'
  AND LOWER(c.name) IN ('полтава', 'poltava');

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'ternopilska-oblast'
  AND LOWER(c.name) IN ('тернопіль', 'ternopil');

UPDATE "Cities" c
SET "regionId" = r.id
FROM "Regions" r
WHERE c."regionId" IS NULL
  AND r.slug = 'kiivska-oblast'
  AND LOWER(c.name) IN ('буча', 'ірпінь', 'бориспіль', 'бровари');

UPDATE "Cities" SET "regionId" = (SELECT id FROM "Regions" WHERE slug = 'vinnicka-oblast' LIMIT 1) WHERE "regionId" IS NULL;

ALTER TABLE "Cities" ALTER COLUMN "regionId" SET NOT NULL;

ALTER TABLE "Cities" ADD CONSTRAINT "Cities_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Regions"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

CREATE INDEX "Cities_regionId_idx" ON "Cities"("regionId");

ALTER TABLE "Events" DROP COLUMN IF EXISTS "region";
