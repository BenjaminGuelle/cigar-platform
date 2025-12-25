-- Migration Part 2: Migrate role data and cleanup
-- Runs after enum values have been added and committed

-- Step 1: Create new Role enum type without ADMIN
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'MODERATOR', 'USER');

-- Step 2: Add temporary column with new enum type
ALTER TABLE "users" ADD COLUMN "role_new" "Role_new";

-- Step 3: Migrate existing data (ADMIN -> SUPER_ADMIN, others stay same)
UPDATE "users"
SET "role_new" = CASE
  WHEN "role"::text = 'ADMIN' THEN 'SUPER_ADMIN'::"Role_new"
  WHEN "role"::text = 'MODERATOR' THEN 'MODERATOR'::"Role_new"
  WHEN "role"::text = 'USER' THEN 'USER'::"Role_new"
  ELSE 'USER'::"Role_new"
END;

-- Step 4: Drop trigger that depends on role column (if exists)
DROP TRIGGER IF EXISTS on_user_role_change ON "users";

-- Step 5: Drop old role column
ALTER TABLE "users" DROP COLUMN "role";

-- Step 6: Rename new column to 'role'
ALTER TABLE "users" RENAME COLUMN "role_new" TO "role";

-- Step 7: Set NOT NULL constraint and default value
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Step 8: Drop old enum type
DROP TYPE "Role";

-- Step 9: Rename new enum type to 'Role'
ALTER TYPE "Role_new" RENAME TO "Role";

-- Step 10: Update ClubMembers where user is the club creator to be 'owner'
-- This sets the creator of each club as the owner in club_members
UPDATE "club_members" cm
SET "role" = 'owner'
FROM "clubs" c
WHERE cm."clubId" = c."id"
  AND cm."userId" = c."createdBy"
  AND cm."role" = 'admin';

-- Step 11: Ensure default value for club_members is still correct
ALTER TABLE "club_members"
  ALTER COLUMN "role" SET DEFAULT 'member';
