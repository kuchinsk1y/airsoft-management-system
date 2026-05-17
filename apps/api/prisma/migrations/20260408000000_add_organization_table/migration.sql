-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "phone" TEXT,
    "socialLinks" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
