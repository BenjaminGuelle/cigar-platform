-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PlanSource" AS ENUM ('DEFAULT', 'SUBSCRIPTION', 'TRIAL', 'BETA', 'GIFT', 'LIFETIME');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user_plans" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "PlanType" NOT NULL DEFAULT 'FREE',
    "source" "PlanSource" NOT NULL DEFAULT 'DEFAULT',
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "giftedBy" UUID,
    "giftReason" TEXT,
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_plans_userId_key" ON "user_plans"("userId");

-- CreateIndex
CREATE INDEX "user_plans_type_idx" ON "user_plans"("type");

-- CreateIndex
CREATE INDEX "user_plans_status_idx" ON "user_plans"("status");

-- CreateIndex
CREATE INDEX "user_plans_expiresAt_idx" ON "user_plans"("expiresAt");

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;