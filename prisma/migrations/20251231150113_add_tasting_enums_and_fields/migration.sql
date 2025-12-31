/*
  Warnings:

  - You are about to drop the column `pleasure` on the `tastings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[inviteCode]` on the table `clubs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `clubs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClubVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TastingStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TastingMoment" AS ENUM ('MATIN', 'APRES_MIDI', 'SOIR');

-- CreateEnum
CREATE TYPE "TastingSituation" AS ENUM ('APERITIF', 'COCKTAIL', 'DIGESTIF');

-- CreateEnum
CREATE TYPE "PairingType" AS ENUM ('WHISKY', 'RHUM', 'COGNAC', 'CAFE', 'THE', 'EAU', 'VIN', 'BIERE', 'AUTRE');

-- DropIndex
DROP INDEX "tastings_visibility_idx";

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cigars" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "allowMemberInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoApproveMembers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublicDirectory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxMembers" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "visibility" "ClubVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "observations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasting_on_club" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tastings" DROP COLUMN "pleasure",
ADD COLUMN     "location" TEXT,
ADD COLUMN     "moment" "TastingMoment",
ADD COLUMN     "pairing" "PairingType",
ADD COLUMN     "pairingNote" TEXT,
ADD COLUMN     "situation" "TastingSituation",
ADD COLUMN     "status" "TastingStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "shareEvaluationsPublicly" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "club_join_requests" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_bans" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bannedBy" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_bans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_join_requests_clubId_idx" ON "club_join_requests"("clubId");

-- CreateIndex
CREATE INDEX "club_join_requests_userId_idx" ON "club_join_requests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "club_join_requests_clubId_userId_key" ON "club_join_requests"("clubId", "userId");

-- CreateIndex
CREATE INDEX "club_bans_clubId_idx" ON "club_bans"("clubId");

-- CreateIndex
CREATE INDEX "club_bans_userId_idx" ON "club_bans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "club_bans_clubId_userId_key" ON "club_bans"("clubId", "userId");

-- CreateIndex
CREATE INDEX "brands_isVerified_idx" ON "brands"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_inviteCode_key" ON "clubs"("inviteCode");

-- CreateIndex
CREATE INDEX "tastings_status_idx" ON "tastings"("status");

-- AddForeignKey
ALTER TABLE "club_join_requests" ADD CONSTRAINT "club_join_requests_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_join_requests" ADD CONSTRAINT "club_join_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_bans" ADD CONSTRAINT "club_bans_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_bans" ADD CONSTRAINT "club_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_bans" ADD CONSTRAINT "club_bans_bannedBy_fkey" FOREIGN KEY ("bannedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_cigarId_fkey" FOREIGN KEY ("cigarId") REFERENCES "cigars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
