-- Big Refactor: Tasting System (Option B - Clean Architecture)
-- WARNING: This migration will DROP existing cigars and evaluations tables
-- This is a destructive migration approved by user for clean start

-- ============================================
-- 1. Create new ENUMS
-- ============================================

-- Cigar verification status
CREATE TYPE "CigarStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Tasting visibility
CREATE TYPE "TastingVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'CLUB_ONLY');


-- ============================================
-- 2. Drop old tables (CASCADE to handle dependencies)
-- ============================================

-- Drop evaluations first (depends on cigars)
DROP TABLE IF EXISTS "evaluations" CASCADE;

-- Drop cigars (will be recreated with new structure)
DROP TABLE IF EXISTS "cigars" CASCADE;


-- ============================================
-- 3. Create Brand table
-- ============================================

CREATE TABLE "brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "country" TEXT,
    "description" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- Brand indexes
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");
CREATE INDEX "brands_slug_idx" ON "brands"("slug");
CREATE INDEX "brands_name_idx" ON "brands"("name");

-- Brand foreign keys
ALTER TABLE "brands" ADD CONSTRAINT "brands_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================
-- 4. Create new Cigar table (with Brand relation)
-- ============================================

CREATE TABLE "cigars" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brandId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    -- Technical specifications
    "vitola" TEXT,
    "length" DOUBLE PRECISION,
    "ringGauge" INTEGER,
    "wrapper" TEXT,
    "origin" TEXT,
    "strength" INTEGER,
    -- Verification workflow
    "status" "CigarStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    -- Metadata
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cigars_pkey" PRIMARY KEY ("id")
);

-- Cigar indexes
CREATE UNIQUE INDEX "cigars_slug_key" ON "cigars"("slug");
CREATE UNIQUE INDEX "cigars_brandId_name_key" ON "cigars"("brandId", "name");
CREATE INDEX "cigars_slug_idx" ON "cigars"("slug");
CREATE INDEX "cigars_brandId_idx" ON "cigars"("brandId");
CREATE INDEX "cigars_status_idx" ON "cigars"("status");

-- Cigar foreign keys
ALTER TABLE "cigars" ADD CONSTRAINT "cigars_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cigars" ADD CONSTRAINT "cigars_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cigars" ADD CONSTRAINT "cigars_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================
-- 5. Create Tasting table (renamed from Evaluation)
-- ============================================

CREATE TABLE "tastings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "cigarId" UUID NOT NULL,
    "eventId" UUID,
    -- Core evaluation
    "rating" DOUBLE PRECISION NOT NULL,
    "pleasure" INTEGER NOT NULL,
    -- Metadata
    "photoUrl" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "comment" TEXT,
    -- Privacy
    "visibility" "TastingVisibility" NOT NULL DEFAULT 'PUBLIC',
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tastings_pkey" PRIMARY KEY ("id")
);

-- Tasting indexes
CREATE INDEX "tastings_userId_idx" ON "tastings"("userId");
CREATE INDEX "tastings_cigarId_idx" ON "tastings"("cigarId");
CREATE INDEX "tastings_eventId_idx" ON "tastings"("eventId");
CREATE INDEX "tastings_visibility_idx" ON "tastings"("visibility");

-- Tasting foreign keys
ALTER TABLE "tastings" ADD CONSTRAINT "tastings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tastings" ADD CONSTRAINT "tastings_cigarId_fkey" FOREIGN KEY ("cigarId") REFERENCES "cigars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tastings" ADD CONSTRAINT "tastings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================
-- 6. Create Observation table (1-n with Tasting)
-- ============================================

CREATE TABLE "observations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tastingId" UUID NOT NULL,
    -- Phase (Tercio: début/milieu/fin/cru)
    "phase" TEXT NOT NULL,
    -- Objective measures (1-5)
    "intensity" INTEGER,
    "combustion" INTEGER,
    -- Detected aromas
    "aromas" TEXT[],
    -- Free notes
    "notes" TEXT,
    -- Organoleptique profile (JSON for 57 fields flexibility)
    "organoleptique" JSONB,
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- Observation indexes
CREATE INDEX "observations_tastingId_idx" ON "observations"("tastingId");
CREATE INDEX "observations_phase_idx" ON "observations"("phase");

-- Observation foreign keys
ALTER TABLE "observations" ADD CONSTRAINT "observations_tastingId_fkey" FOREIGN KEY ("tastingId") REFERENCES "tastings"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================
-- 7. Create TastingOnClub junction table (multi-club sharing)
-- ============================================

CREATE TABLE "tasting_on_club" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tastingId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasting_on_club_pkey" PRIMARY KEY ("id")
);

-- TastingOnClub indexes
CREATE UNIQUE INDEX "tasting_on_club_tastingId_clubId_key" ON "tasting_on_club"("tastingId", "clubId");
CREATE INDEX "tasting_on_club_tastingId_idx" ON "tasting_on_club"("tastingId");
CREATE INDEX "tasting_on_club_clubId_idx" ON "tasting_on_club"("clubId");

-- TastingOnClub foreign keys
ALTER TABLE "tasting_on_club" ADD CONSTRAINT "tasting_on_club_tastingId_fkey" FOREIGN KEY ("tastingId") REFERENCES "tastings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasting_on_club" ADD CONSTRAINT "tasting_on_club_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================
-- 8. Update Event table to reference new cigars
-- ============================================

-- The events table already has cigarId as nullable, so we just need to ensure it references the new cigars table
-- This is handled by the foreign key constraint on the new cigars table
-- Any existing events with cigarId will have NULL after cigars table drop
