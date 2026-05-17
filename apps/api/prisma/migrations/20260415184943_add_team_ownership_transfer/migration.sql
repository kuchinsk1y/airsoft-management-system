-- CreateEnum
CREATE TYPE "TeamOwnershipTransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TRANSFER_OWNERSHIP';

-- CreateTable
CREATE TABLE "TeamOwnershipTransferRequests" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "currentOwnerId" INTEGER NOT NULL,
    "newOwnerId" INTEGER NOT NULL,
    "status" "TeamOwnershipTransferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TeamOwnershipTransferRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organizations" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT NOT NULL DEFAULT 'Strike Shop Action',
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "phone" TEXT,
    "socialLinks" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamOwnershipTransferRequests_teamId_idx" ON "TeamOwnershipTransferRequests"("teamId");

-- CreateIndex
CREATE INDEX "TeamOwnershipTransferRequests_newOwnerId_idx" ON "TeamOwnershipTransferRequests"("newOwnerId");

-- CreateIndex
CREATE INDEX "TeamOwnershipTransferRequests_currentOwnerId_idx" ON "TeamOwnershipTransferRequests"("currentOwnerId");

-- CreateIndex
CREATE INDEX "TeamOwnershipTransferRequests_status_idx" ON "TeamOwnershipTransferRequests"("status");

-- CreateIndex
CREATE INDEX "TeamOwnershipTransferRequests_expiresAt_idx" ON "TeamOwnershipTransferRequests"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamOwnershipTransferRequests_teamId_newOwnerId_key" ON "TeamOwnershipTransferRequests"("teamId", "newOwnerId");

-- AddForeignKey
ALTER TABLE "TeamOwnershipTransferRequests" ADD CONSTRAINT "TeamOwnershipTransferRequests_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamOwnershipTransferRequests" ADD CONSTRAINT "TeamOwnershipTransferRequests_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamOwnershipTransferRequests" ADD CONSTRAINT "TeamOwnershipTransferRequests_newOwnerId_fkey" FOREIGN KEY ("newOwnerId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
