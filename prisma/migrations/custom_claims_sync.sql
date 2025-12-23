-- ============================================
-- Custom Claims: Sync User role to JWT
-- All Stars 2026 - Automatic JWT claims synchronization
-- ============================================

-- Fonction pour synchroniser le role User → JWT claims
CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- Met à jour les app_metadata de auth.users avec le role
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'role', NEW.role::text,
      'displayName', NEW."displayName"
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur INSERT/UPDATE de users
DROP TRIGGER IF EXISTS on_user_role_change ON public.users;

CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE OF role, "displayName" ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_jwt();

-- ============================================
-- Migration : Sync tous les users existants
-- ============================================

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, role, "displayName" FROM public.users
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object(
        'role', user_record.role::text,
        'displayName', user_record."displayName"
      )
    WHERE id = user_record.id;
  END LOOP;
END $$;
