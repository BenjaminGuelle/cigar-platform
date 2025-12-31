-- ============================================
-- MANUAL MIGRATION: Regenerate missing cigar slugs
-- ============================================
-- Context: Cigars created before slug feature have NULL slugs
-- Solution: Generate slugs using format: {brand-slug}-{cigar-name}
-- Example: "cohiba" + "Behike 52" → "cohiba-behike-52"

-- Step 1: Update cigars with NULL slugs
UPDATE "cigars" c
SET slug = CONCAT(
  b.slug,
  '-',
  regexp_replace(
    regexp_replace(
      regexp_replace(
        translate(lower(c.name), 'àáâãäåèéêëìíîïòóôõöùúûüýÿçñ', 'aaaaaaeeeeiiiiooooouuuuyyc'),
        '[^a-z0-9]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    ),
    '-{2,}', '-', 'g'
  )
)
FROM "brands" b
WHERE c."brandId" = b.id
  AND c.slug IS NULL;

-- Step 2: Log results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM "cigars" WHERE slug IS NOT NULL;
  RAISE NOTICE 'Successfully regenerated slugs for cigars. Total cigars with slugs: %', updated_count;
END $$;
