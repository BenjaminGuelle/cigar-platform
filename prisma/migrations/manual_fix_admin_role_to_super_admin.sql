-- Migration manuelle : Corriger le rôle legacy "ADMIN" → "SUPER_ADMIN"
-- Date: 2026-01-01
-- Raison: L'enum Role a été refactorisé (ADMIN supprimé, SUPER_ADMIN ajouté)
--
-- IMPORTANT: Cette migration doit être exécutée en deux parties :
-- 1. Base de données Prisma (ci-dessous)
-- 2. Custom claims Supabase (voir section Supabase ci-dessous)

-- ============================================
-- PARTIE 1: Mise à jour Prisma Database
-- ============================================

-- Mettre à jour tous les users avec role 'ADMIN' (si existant via ancienne migration)
-- Note: Normalement impossible car l'enum ne contient plus ADMIN,
-- mais cette requête est là pour la sécurité si des données legacy existent

DO $$
BEGIN
  -- Cette requête ne marchera que si ADMIN existe encore dans l'enum
  -- Sinon elle sera ignorée silencieusement
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel = 'ADMIN'
  ) THEN
    UPDATE users
    SET role = 'SUPER_ADMIN'
    WHERE role::text = 'ADMIN';

    RAISE NOTICE 'Mise à jour des users ADMIN → SUPER_ADMIN effectuée';
  ELSE
    RAISE NOTICE 'Aucun rôle ADMIN trouvé dans l''enum - migration skippée';
  END IF;
END $$;

-- ============================================
-- PARTIE 2: Mise à jour Supabase Custom Claims
-- ============================================

-- ATTENTION: Cette partie doit être exécutée MANUELLEMENT dans Supabase SQL Editor
-- car elle touche à auth.users (table système Supabase)

-- Étape 1: Mettre à jour les custom claims dans auth.users
UPDATE auth.users
SET raw_app_meta_data =
  jsonb_set(
    raw_app_meta_data,
    '{role}',
    '"SUPER_ADMIN"'
  )
WHERE raw_app_meta_data->>'role' = 'ADMIN';

-- Étape 2: Vérifier que la mise à jour a fonctionné
SELECT
  id,
  email,
  raw_app_meta_data->>'role' as role
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'SUPER_ADMIN';

-- ============================================
-- ROLLBACK (si nécessaire)
-- ============================================

-- Si besoin de revenir en arrière (à exécuter dans Supabase uniquement) :
-- UPDATE auth.users
-- SET raw_app_meta_data =
--   jsonb_set(
--     raw_app_meta_data,
--     '{role}',
--     '"ADMIN"'
--   )
-- WHERE raw_app_meta_data->>'role' = 'SUPER_ADMIN';

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

-- 1. Cette migration est IDEMPOTENTE (peut être exécutée plusieurs fois sans danger)
-- 2. La partie Supabase DOIT être exécutée manuellement via Supabase Dashboard > SQL Editor
-- 3. Après cette migration, le mapping ADMIN → SUPER_ADMIN dans le code peut être retiré
--    (mais on le garde pour la rétrocompatibilité pendant quelques semaines)
-- 4. Pour forcer le rafraîchissement des JWT, les users doivent se reconnecter
--    (ou attendre l'expiration naturelle du token)
