import { Role } from '@cigar-platform/prisma-client';

/**
 * Role Mapping Utilities
 *
 * Centralizes the logic for mapping legacy role values to current Role enum.
 * This ensures consistency across the application and makes it easy to remove
 * legacy support in the future.
 *
 * Context:
 * - The "ADMIN" role was renamed to "SUPER_ADMIN" in the schema refactor
 * - Supabase custom claims may still contain "ADMIN" for existing users
 * - This mapper ensures backward compatibility during the transition period
 *
 * @see prisma/migrations/manual_fix_admin_role_to_super_admin.sql
 */

/**
 * Map a role string to a valid Role enum value
 *
 * Valid mappings:
 * - "SUPER_ADMIN" → Role.SUPER_ADMIN
 * - "ADMIN" → Role.ADMIN
 * - "MODERATOR" → Role.MODERATOR
 * - "USER" → Role.USER
 * - null/undefined → Role.USER (default)
 * - unknown values → Role.USER (safe fallback)
 *
 * @param roleValue - Role string from Supabase custom claims or other sources
 * @returns Valid Role enum value
 *
 * @example
 * ```typescript
 * mapRole('ADMIN') // Returns Role.ADMIN
 * mapRole('SUPER_ADMIN') // Returns Role.SUPER_ADMIN
 * mapRole('USER') // Returns Role.USER
 * mapRole(null) // Returns Role.USER (default)
 * mapRole('INVALID') // Returns Role.USER (safe fallback)
 * ```
 */
export function mapRole(roleValue: string | null | undefined): Role {
  // Handle null/undefined (default to USER)
  if (!roleValue) {
    return Role.USER;
  }

  // Normalize to uppercase for case-insensitive comparison
  const normalizedRole = roleValue.toUpperCase();

  // Map valid roles
  switch (normalizedRole) {
    case 'SUPER_ADMIN':
      return Role.SUPER_ADMIN;
    case 'ADMIN':
      return Role.ADMIN;
    case 'MODERATOR':
      return Role.MODERATOR;
    case 'USER':
      return Role.USER;
    default:
      // Safe fallback for unknown values (prevents app crashes)
      return Role.USER;
  }
}

/**
 * Validate if a role string is a valid Role enum value
 *
 * @param roleValue - Role string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidRole('SUPER_ADMIN') // true
 * isValidRole('ADMIN') // true
 * isValidRole('USER') // true
 * isValidRole('INVALID') // false
 * ```
 */
export function isValidRole(roleValue: string): boolean {
  return (
    roleValue === 'SUPER_ADMIN' ||
    roleValue === 'ADMIN' ||
    roleValue === 'MODERATOR' ||
    roleValue === 'USER'
  );
}

/**
 * Get a human-readable label for a role
 *
 * @param role - Role enum value
 * @returns Localized label (French)
 *
 * @example
 * ```typescript
 * getRoleLabel(Role.SUPER_ADMIN) // "Super Administrateur"
 * getRoleLabel(Role.ADMIN) // "Administrateur"
 * getRoleLabel(Role.MODERATOR) // "Modérateur"
 * getRoleLabel(Role.USER) // "Utilisateur"
 * ```
 */
export function getRoleLabel(role: Role): string {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 'Super Administrateur';
    case Role.ADMIN:
      return 'Administrateur';
    case Role.MODERATOR:
      return 'Modérateur';
    case Role.USER:
      return 'Utilisateur';
    default:
      return 'Utilisateur';
  }
}