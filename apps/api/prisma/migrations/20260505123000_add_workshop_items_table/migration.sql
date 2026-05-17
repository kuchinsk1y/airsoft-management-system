-- CreateEnum
CREATE TYPE "WorkshopItemCategory" AS ENUM ('SERVICES', 'SUPPORT');

-- CreateTable
CREATE TABLE "WorkshopItems" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "category" "WorkshopItemCategory" NOT NULL DEFAULT 'SERVICES',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" INTEGER NOT NULL,
    "updatedById" INTEGER,

    CONSTRAINT "WorkshopItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopItems_slug_key" ON "WorkshopItems"("slug");

-- CreateIndex
CREATE INDEX "WorkshopItems_slug_idx" ON "WorkshopItems"("slug");

-- CreateIndex
CREATE INDEX "WorkshopItems_published_idx" ON "WorkshopItems"("published");

-- CreateIndex
CREATE INDEX "WorkshopItems_category_idx" ON "WorkshopItems"("category");

-- CreateIndex
CREATE INDEX "WorkshopItems_published_category_publishedAt_idx" ON "WorkshopItems"("published", "category", "publishedAt");

-- CreateIndex
CREATE INDEX "WorkshopItems_publishedAt_idx" ON "WorkshopItems"("publishedAt");

-- CreateIndex
CREATE INDEX "WorkshopItems_authorId_idx" ON "WorkshopItems"("authorId");

-- AddForeignKey
ALTER TABLE "WorkshopItems" ADD CONSTRAINT "WorkshopItems_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorkshopItems" ADD CONSTRAINT "WorkshopItems_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
