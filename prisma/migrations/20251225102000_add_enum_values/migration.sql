-- Migration Part 1: Add new enum values only
-- This must be in a separate migration due to PostgreSQL transaction constraints

-- Add 'owner' to ClubRole enum
ALTER TYPE "ClubRole" ADD VALUE IF NOT EXISTS 'owner';

-- Add 'SUPER_ADMIN' to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
