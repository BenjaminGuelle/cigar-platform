-- ============================================
-- FIX: Slugify function - Apply toLowerCase BEFORE regex
-- ============================================
-- BUG: Majuscules were replaced by underscores because lower() was applied AFTER regex [^a-z0-9]+
-- FIX: Apply lower() on text BEFORE the regex, at the very beginning

CREATE OR REPLACE FUNCTION slugify(text TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN
    regexp_replace(
      regexp_replace(
        regexp_replace(
          -- Remove accents and special chars (apply lower() FIRST)
          translate(lower(text), 'àáâãäåèéêëìíîïòóôõöùúûüýÿçñ', 'aaaaaaeeeeiiiiooooouuuuyyc'),
          '[^a-z0-9.]+', '_', 'g'  -- Replace non-alphanumeric (except dot) with underscore
        ),
        '^_+|_+$', '', 'g'  -- Remove leading/trailing underscores
      ),
      '_{2,}', '_', 'g'  -- Replace multiple underscores with single
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;