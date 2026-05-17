-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('RENT', 'SALE');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'LEFT');

-- CreateEnum
CREATE TYPE "TeamsJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EventRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AclPermission" AS ENUM ('read', 'write');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('google', 'facebook');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PENDING', 'PAID', 'PAYMENT_FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK', 'CASH');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('TEAM', 'INDIVIDUAL', 'TRAINING');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TEAM_APPLICATION', 'TEAM_INVITATION', 'TEAM_MODERATION', 'EVENT_REGISTRATION', 'EVENT_REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "fullName" TEXT,
    "nickName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "dateOfBirth" DATE,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccounts" (
    "id" SERIAL NOT NULL,
    "provider" "Provider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dealType" "DealType" NOT NULL DEFAULT 'RENT',
    "cityId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "paymentMethod" "PaymentMethod" DEFAULT 'BANK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderProducts" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderProducts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "cityId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "region" TEXT,
    "applicationId" INTEGER NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 0,
    "competitionType" "CompetitionType" NOT NULL,
    "paymentMethods" "PaymentMethod"[] DEFAULT ARRAY['BANK', 'CASH']::"PaymentMethod"[],
    "price" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSides" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "teamId" INTEGER,

    CONSTRAINT "EventSides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGallery" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembers" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "memberStatus" "TeamMemberStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "teamContribution" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamsJoinRequest" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "TeamsJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,

    CONSTRAINT "TeamsJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "userId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DECIMAL(5,2),
    "kdRatio" DECIMAL(5,2),
    "rank" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "EventRegistrations" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER,
    "eventSideId" INTEGER,
    "orderId" INTEGER,
    "status" "EventRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acls" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permission" "AclPermission" NOT NULL,
    "resource" TEXT NOT NULL,
    "applicationId" INTEGER,

    CONSTRAINT "Acls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitations" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "inviterId" INTEGER NOT NULL,
    "inviteeId" INTEGER NOT NULL,
    "status" "TeamInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TeamInvitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applications" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comments" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedAt" TIMESTAMP(3),
    "moderatedBy" INTEGER,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_nickName_key" ON "Users"("nickName");

-- CreateIndex
CREATE INDEX "OAuthAccounts_userId_idx" ON "OAuthAccounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccounts_provider_providerId_key" ON "OAuthAccounts"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccounts_userId_provider_key" ON "OAuthAccounts"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Cities_name_key" ON "Cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Cities_slug_key" ON "Cities"("slug");

-- CreateIndex
CREATE INDEX "Products_cityId_idx" ON "Products"("cityId");

-- CreateIndex
CREATE INDEX "Events_startDate_idx" ON "Events"("startDate");

-- CreateIndex
CREATE INDEX "Events_isActive_idx" ON "Events"("isActive");

-- CreateIndex
CREATE INDEX "Events_competitionType_idx" ON "Events"("competitionType");

-- CreateIndex
CREATE INDEX "Events_cityId_idx" ON "Events"("cityId");

-- CreateIndex
CREATE INDEX "Events_applicationId_idx" ON "Events"("applicationId");

-- CreateIndex
CREATE INDEX "EventSides_eventId_idx" ON "EventSides"("eventId");

-- CreateIndex
CREATE INDEX "EventSides_teamId_idx" ON "EventSides"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSides_eventId_orderIndex_key" ON "EventSides"("eventId", "orderIndex");

-- CreateIndex
CREATE INDEX "EventGallery_eventId_idx" ON "EventGallery"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Teams_name_key" ON "Teams"("name");

-- CreateIndex
CREATE INDEX "TeamMembers_teamId_idx" ON "TeamMembers"("teamId");

-- CreateIndex
CREATE INDEX "TeamMembers_userId_idx" ON "TeamMembers"("userId");

-- CreateIndex
CREATE INDEX "TeamMembers_memberStatus_idx" ON "TeamMembers"("memberStatus");

-- CreateIndex
CREATE INDEX "TeamMembers_leftAt_idx" ON "TeamMembers"("leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembers_teamId_userId_key" ON "TeamMembers"("teamId", "userId");

-- CreateIndex
CREATE INDEX "TeamsJoinRequest_teamId_idx" ON "TeamsJoinRequest"("teamId");

-- CreateIndex
CREATE INDEX "TeamsJoinRequest_userId_idx" ON "TeamsJoinRequest"("userId");

-- CreateIndex
CREATE INDEX "TeamsJoinRequest_status_idx" ON "TeamsJoinRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamsJoinRequest_teamId_userId_key" ON "TeamsJoinRequest"("teamId", "userId");

-- CreateIndex
CREATE INDEX "Notifications_userId_idx" ON "Notifications"("userId");

-- CreateIndex
CREATE INDEX "Notifications_isRead_idx" ON "Notifications"("isRead");

-- CreateIndex
CREATE INDEX "Notifications_type_idx" ON "Notifications"("type");

-- CreateIndex
CREATE INDEX "PlayerStats_points_idx" ON "PlayerStats"("points");

-- CreateIndex
CREATE INDEX "PlayerStats_rank_idx" ON "PlayerStats"("rank");

-- CreateIndex
CREATE INDEX "EventRegistrations_eventId_status_idx" ON "EventRegistrations"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventRegistrations_userId_idx" ON "EventRegistrations"("userId");

-- CreateIndex
CREATE INDEX "EventRegistrations_teamId_idx" ON "EventRegistrations"("teamId");

-- CreateIndex
CREATE INDEX "EventRegistrations_eventSideId_idx" ON "EventRegistrations"("eventSideId");

-- CreateIndex
CREATE INDEX "EventRegistrations_orderId_idx" ON "EventRegistrations"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistrations_eventId_userId_key" ON "EventRegistrations"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Acls_userId_resource_idx" ON "Acls"("userId", "resource");

-- CreateIndex
CREATE INDEX "Acls_applicationId_idx" ON "Acls"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Acls_userId_permission_resource_applicationId_key" ON "Acls"("userId", "permission", "resource", "applicationId");

-- CreateIndex
CREATE INDEX "TeamInvitations_teamId_idx" ON "TeamInvitations"("teamId");

-- CreateIndex
CREATE INDEX "TeamInvitations_inviteeId_idx" ON "TeamInvitations"("inviteeId");

-- CreateIndex
CREATE INDEX "TeamInvitations_inviterId_idx" ON "TeamInvitations"("inviterId");

-- CreateIndex
CREATE INDEX "TeamInvitations_status_idx" ON "TeamInvitations"("status");

-- CreateIndex
CREATE INDEX "TeamInvitations_expiresAt_idx" ON "TeamInvitations"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitations_teamId_inviteeId_key" ON "TeamInvitations"("teamId", "inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "Applications_uid_key" ON "Applications"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Applications_ownerId_key" ON "Applications"("ownerId");

-- CreateIndex
CREATE INDEX "Applications_uid_idx" ON "Applications"("uid");

-- CreateIndex
CREATE INDEX "Applications_ownerId_idx" ON "Applications"("ownerId");

-- AddForeignKey
ALTER TABLE "OAuthAccounts" ADD CONSTRAINT "OAuthAccounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Cities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrderProducts" ADD CONSTRAINT "OrderProducts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrderProducts" ADD CONSTRAINT "OrderProducts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Cities"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventSides" ADD CONSTRAINT "EventSides_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventSides" ADD CONSTRAINT "EventSides_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventGallery" ADD CONSTRAINT "EventGallery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamMembers" ADD CONSTRAINT "TeamMembers_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamMembers" ADD CONSTRAINT "TeamMembers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamsJoinRequest" ADD CONSTRAINT "TeamsJoinRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamsJoinRequest" ADD CONSTRAINT "TeamsJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventRegistrations" ADD CONSTRAINT "EventRegistrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventRegistrations" ADD CONSTRAINT "EventRegistrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventRegistrations" ADD CONSTRAINT "EventRegistrations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventRegistrations" ADD CONSTRAINT "EventRegistrations_eventSideId_fkey" FOREIGN KEY ("eventSideId") REFERENCES "EventSides"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventRegistrations" ADD CONSTRAINT "EventRegistrations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Acls" ADD CONSTRAINT "Acls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Acls" ADD CONSTRAINT "Acls_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamInvitations" ADD CONSTRAINT "TeamInvitations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamInvitations" ADD CONSTRAINT "TeamInvitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TeamInvitations" ADD CONSTRAINT "TeamInvitations_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
