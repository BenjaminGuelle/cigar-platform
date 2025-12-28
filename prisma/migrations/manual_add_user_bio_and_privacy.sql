-- Migration: Add bio and shareEvaluationsPublicly to users table
-- To execute: Copy this SQL and run it in Supabase Dashboard > SQL Editor

-- Add bio column (nullable text)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add shareEvaluationsPublicly column (boolean with default true)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "shareEvaluationsPublicly" BOOLEAN NOT NULL DEFAULT true;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('bio', 'shareEvaluationsPublicly');
