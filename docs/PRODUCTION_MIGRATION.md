# Guide de Migration Production - Rôles ADMIN & SUPER_ADMIN

> **Date**: 2026-01-01
> **Contexte**: Restauration du rôle ADMIN (en plus de SUPER_ADMIN)
> **Status**: ✅ **RÉSOLU** - Plus besoin de migration Supabase !

## ⚠️ **MISE À JOUR : Migration simplifiée**

**Bonne nouvelle** : Le rôle `ADMIN` a été restauré dans l'enum !

Cela simplifie considérablement l'architecture :
- ✅ Pas de migration Supabase à faire
- ✅ Pas de mapping complexe
- ✅ Support natif des deux rôles (ADMIN + SUPER_ADMIN)

---

## 📋 État actuel de l'enum Role

```prisma
enum Role {
  SUPER_ADMIN  // ✅ Platform super admin (full control + platform config)
  ADMIN        // ✅ Platform admin (full access except platform config)
  MODERATOR    // ✅ Content moderation
  USER         // ✅ Standard user (default)
}
```

**Hiérarchie des permissions** :
1. `SUPER_ADMIN` : Contrôle total (plateforme + config)
2. `ADMIN` : Admin complet (sauf config plateforme)
3. `MODERATOR` : Modération de contenu
4. `USER` : Utilisateur standard

---

## ✅ Solutions mises en place

### 1. **Fonction helper centralisée** (`role.utils.ts`)

Tout le mapping des rôles passe maintenant par une **fonction unique** :

```typescript
// apps/api/src/common/utils/role.utils.ts
export function mapRole(roleValue: string | null | undefined): Role {
  if (!roleValue) return Role.USER;

  const normalizedRole = roleValue.toUpperCase();

  // Map legacy "ADMIN" to "SUPER_ADMIN"
  if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN') {
    return Role.SUPER_ADMIN;
  }

  if (normalizedRole === 'MODERATOR') {
    return Role.MODERATOR;
  }

  return Role.USER; // Safe fallback
}
```

**Avantages** :
- ✅ Centralisation (DRY principle)
- ✅ Backward compatibility (ADMIN → SUPER_ADMIN)
- ✅ Safe fallback (valeurs inconnues → USER)
- ✅ Facilite le retrait du legacy mapping à l'avenir

### 2. **Migration SQL Supabase** (`manual_fix_admin_role_to_super_admin.sql`)

Fichier de migration créé pour mettre à jour Supabase :
- Corrige les custom claims dans `auth.users`
- Idempotent (peut être exécuté plusieurs fois)
- Documentation complète incluse

### 3. **Code application**

Tous les points d'entrée utilisent maintenant `mapRole()` :
- ✅ `auth.service.ts` (getProfile, updateProfile)
- ✅ `jwt-auth.guard.ts` (custom claims JWT)

---

## 🚀 Plan de migration PRODUCTION

### Étape 1 : Préparation (AVANT déploiement)

1. **Backup Supabase** :
   ```bash
   # Via Supabase Dashboard > Project Settings > Database > Backups
   # Créer un backup manuel avant toute modification
   ```

2. **Vérifier les users affectés** :
   ```sql
   -- Dans Supabase SQL Editor
   SELECT
     id,
     email,
     raw_app_meta_data->>'role' as current_role
   FROM auth.users
   WHERE raw_app_meta_data->>'role' = 'ADMIN';
   ```

### Étape 2 : Migration Supabase (PENDANT maintenance)

**🔴 IMPORTANT** : Exécuter pendant une fenêtre de maintenance (auth ne fonctionnera pas entre l'étape 2 et 3)

1. **Ouvrir Supabase SQL Editor** :
   - Dashboard > SQL Editor > New query

2. **Copier-coller le contenu** de `prisma/migrations/manual_fix_admin_role_to_super_admin.sql`
   (Section "PARTIE 2: Mise à jour Supabase Custom Claims")

3. **Exécuter la requête** :
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data =
     jsonb_set(
       raw_app_meta_data,
       '{role}',
       '"SUPER_ADMIN"'
     )
   WHERE raw_app_meta_data->>'role' = 'ADMIN';
   ```

4. **Vérifier** que la mise à jour a fonctionné :
   ```sql
   SELECT
     id,
     email,
     raw_app_meta_data->>'role' as role
   FROM auth.users
   WHERE raw_app_meta_data->>'role' = 'SUPER_ADMIN';
   ```

### Étape 3 : Déploiement code (IMMÉDIATEMENT après)

1. **Déployer la nouvelle version** avec `mapRole()` :
   ```bash
   npm run build:all
   # Déployer sur serveur production
   ```

2. **Forcer la déconnexion des users** (optionnel mais recommandé) :
   - Les JWT existants contiennent encore "ADMIN" dans les claims
   - `mapRole()` gère la compatibilité, mais pour forcer le refresh :
   ```sql
   -- Invalider tous les refresh tokens (force reconnexion)
   DELETE FROM auth.refresh_tokens WHERE user_id IN (
     SELECT id FROM auth.users
     WHERE raw_app_meta_data->>'role' = 'SUPER_ADMIN'
   );
   ```

### Étape 4 : Validation post-déploiement

1. **Tester la connexion** d'un admin :
   - Se connecter avec un compte SUPER_ADMIN
   - Vérifier que le profil s'affiche correctement
   - Vérifier les permissions

2. **Vérifier les logs** :
   ```bash
   # Rechercher des erreurs liées au rôle
   grep "Invalid.*role" /var/log/app/*.log
   ```

3. **Monitorer Sentry/logs** pendant 24h

---

## 🔄 Rollback (si problème)

Si la migration échoue, procédure de rollback :

### 1. Rollback Supabase (restaurer ADMIN)
```sql
UPDATE auth.users
SET raw_app_meta_data =
  jsonb_set(
    raw_app_meta_data,
    '{role}',
    '"ADMIN"'
  )
WHERE raw_app_meta_data->>'role' = 'SUPER_ADMIN';
```

### 2. Rollback code
- Déployer la version précédente (sans `mapRole()`)
- Restaurer `as Role` casting

---

## 📊 Checklist de migration

- [ ] Backup Supabase créé
- [ ] Fenêtre de maintenance planifiée
- [ ] Query de vérification exécutée (combien d'ADMIN ?)
- [ ] Migration Supabase exécutée
- [ ] Vérification post-migration (count SUPER_ADMIN)
- [ ] Code déployé avec `mapRole()`
- [ ] Test de connexion admin OK
- [ ] Logs vérifiés (pas d'erreur role)
- [ ] Monitoring 24h activé

---

## 🎯 Post-migration (après 1 mois)

Une fois que tous les JWT ont été rafraîchis (expiration : 1h), on peut :

1. **Retirer le legacy mapping** :
   ```typescript
   // Simplifier mapRole() en retirant le check "ADMIN"
   export function mapRole(roleValue: string | null | undefined): Role {
     if (!roleValue) return Role.USER;

     const normalizedRole = roleValue.toUpperCase();

     // Legacy mapping removed - no longer needed
     if (normalizedRole === 'SUPER_ADMIN') return Role.SUPER_ADMIN;
     if (normalizedRole === 'MODERATOR') return Role.MODERATOR;

     return Role.USER;
   }
   ```

2. **Ajouter un test de validation** :
   ```typescript
   it('should reject legacy ADMIN role', () => {
     expect(() => mapRole('ADMIN')).toThrow();
   });
   ```

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Supabase (Dashboard > Logs)
2. Vérifier les logs applicatifs
3. Consulter cette documentation
4. Rollback si nécessaire (procédure ci-dessus)

---

## 📚 Références

- Migration SQL : `prisma/migrations/manual_fix_admin_role_to_super_admin.sql`
- Helper role : `apps/api/src/common/utils/role.utils.ts`
- Schema Prisma : `prisma/schema.prisma` (enum Role)