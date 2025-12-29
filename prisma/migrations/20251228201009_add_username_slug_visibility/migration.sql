-- CreateEnum: UserVisibility
CREATE TYPE "UserVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- ============================================
-- STEP 1: Add new columns (nullable first)
-- ============================================

-- Add username column (temp nullable)
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Add visibility column with default
ALTER TABLE "users" ADD COLUMN "visibility" "UserVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Add slug column to clubs (temp nullable)
ALTER TABLE "clubs" ADD COLUMN "slug" TEXT;

-- ============================================
-- STEP 2: Generate unique usernames for existing users
-- ============================================

-- Function to slugify text (lowercase, replace spaces/special chars with underscore)
CREATE OR REPLACE FUNCTION slugify(text TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          -- Remove accents and special chars
          translate(text, 'àáâãäåèéêëìíîïòóôõöùúûüýÿçñ', 'aaaaaaeeeeiiiiooooouuuuyyc'),
          '[^a-z0-9]+', '_', 'g'  -- Replace non-alphanumeric with underscore
        ),
        '^_+|_+$', '', 'g'  -- Remove leading/trailing underscores
      ),
      '_{2,}', '_', 'g'  -- Replace multiple underscores with single
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate unique username
CREATE OR REPLACE FUNCTION generate_unique_username(base_text TEXT, existing_usernames TEXT[]) RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_username TEXT;
  counter INTEGER := 2;
BEGIN
  -- Slugify the base text
  base_slug := slugify(base_text);

  -- Ensure minimum length (pad if too short)
  IF length(base_slug) < 3 THEN
    base_slug := base_slug || '_user';
  END IF;

  -- Truncate to max 30 chars
  base_slug := substring(base_slug from 1 for 30);

  -- Start with base
  final_username := base_slug;

  -- If exists, append numbers until unique
  WHILE final_username = ANY(existing_usernames) LOOP
    final_username := substring(base_slug from 1 for (30 - length(counter::TEXT) - 1)) || '_' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Generate usernames for all existing users
DO $$
DECLARE
  user_record RECORD;
  existing_usernames TEXT[] := ARRAY[]::TEXT[];
  new_username TEXT;
BEGIN
  FOR user_record IN SELECT id, "displayName", email FROM users ORDER BY "createdAt" LOOP
    -- Generate unique username from displayName (fallback to email local part)
    new_username := generate_unique_username(
      COALESCE(user_record."displayName", split_part(user_record.email, '@', 1)),
      existing_usernames
    );

    -- Update user
    UPDATE users SET username = new_username WHERE id = user_record.id;

    -- Add to existing list
    existing_usernames := array_append(existing_usernames, new_username);
  END LOOP;
END $$;

-- ============================================
-- STEP 3: Generate unique slugs for existing clubs
-- ============================================

-- Generate slugs for all existing clubs
DO $$
DECLARE
  club_record RECORD;
  existing_slugs TEXT[] := ARRAY[]::TEXT[];
  new_slug TEXT;
BEGIN
  FOR club_record IN SELECT id, name FROM clubs ORDER BY "createdAt" LOOP
    -- Generate unique slug from club name
    new_slug := generate_unique_username(club_record.name, existing_slugs);

    -- Update club
    UPDATE clubs SET slug = new_slug WHERE id = club_record.id;

    -- Add to existing list
    existing_slugs := array_append(existing_slugs, new_slug);
  END LOOP;
END $$;

-- ============================================
-- STEP 4: Make columns NOT NULL and add constraints
-- ============================================

-- Make username NOT NULL and UNIQUE
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");

-- Make slug NOT NULL and UNIQUE
ALTER TABLE "clubs" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_slug_key" UNIQUE ("slug");

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

CREATE INDEX "users_username_idx" ON "users"("username");
CREATE INDEX "clubs_slug_idx" ON "clubs"("slug");

-- ============================================
-- STEP 6: Cleanup helper functions
-- ============================================

DROP FUNCTION IF EXISTS generate_unique_username(TEXT, TEXT[]);
DROP FUNCTION IF EXISTS slugify(TEXT);