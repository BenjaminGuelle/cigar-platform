-- ============================================
-- REGENERATE USERNAMES: Fix existing usernames with corrected slugify function
-- ============================================
-- This script re-generates all usernames using the corrected slugify function
-- that applies toLowerCase() BEFORE the regex pattern matching

DO $$
DECLARE
  user_record RECORD;
  new_username TEXT;
  counter INTEGER;
BEGIN
  -- Loop through all users
  FOR user_record IN SELECT id, "displayName", username FROM "User"
  LOOP
    -- Generate base username from displayName
    new_username := slugify(user_record."displayName");

    -- Ensure minimum length
    IF length(new_username) < 3 THEN
      new_username := new_username || '_user';
    END IF;

    -- Truncate to max 30 characters
    new_username := substring(new_username, 1, 30);

    -- Check for uniqueness and append counter if needed
    counter := 2;
    WHILE EXISTS (
      SELECT 1 FROM "User"
      WHERE username = new_username
      AND id != user_record.id
    ) LOOP
      -- Calculate max base length to fit counter
      new_username := substring(slugify(user_record."displayName"), 1, 30 - length('_' || counter::text)) || '_' || counter;
      counter := counter + 1;
    END LOOP;

    -- Update the user's username only if it changed
    IF user_record.username != new_username THEN
      UPDATE "User"
      SET username = new_username
      WHERE id = user_record.id;

      RAISE NOTICE 'Updated user %: % -> %', user_record.id, user_record.username, new_username;
    END IF;
  END LOOP;
END $$;