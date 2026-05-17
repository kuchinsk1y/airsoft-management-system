-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('NEW', 'PENDING', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "Services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "company" TEXT,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Services_topic_idx" ON "Services"("topic");

-- CreateIndex
CREATE INDEX "Services_createdAt_idx" ON "Services"("createdAt");

-- CreateIndex
CREATE INDEX "Services_email_idx" ON "Services"("email");

-- CreateIndex
CREATE INDEX "Services_phoneNumber_idx" ON "Services"("phoneNumber");
