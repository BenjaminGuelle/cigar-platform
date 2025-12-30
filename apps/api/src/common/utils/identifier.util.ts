/**
 * Identifier Utilities
 * Helper functions for working with UUIDs, usernames, and slugs
 *
 * ALL STARS Architecture ⭐
 * - Pure functions
 * - Type-safe
 * - Reusable across services
 */

/**
 * UUID v4 regex pattern
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID v4
 * @param value - String to check
 * @returns True if value is a valid UUID v4
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Normalize username by removing leading @ symbol if present
 * @param username - Username with or without @
 * @returns Username without @ symbol
 * @example
 * normalizeUsername('@johndoe') // 'johndoe'
 * normalizeUsername('johndoe') // 'johndoe'
 */
export function normalizeUsername(username: string): string {
  return username.startsWith('@') ? username.slice(1) : username;
}

/**
 * Normalize slug by removing leading # symbol if present
 * @param slug - Slug with or without #
 * @returns Slug without # symbol
 * @example
 * normalizeSlug('#cuban-cigars') // 'cuban-cigars'
 * normalizeSlug('cuban-cigars') // 'cuban-cigars'
 */
export function normalizeSlug(slug: string): string {
  return slug.startsWith('#') ? slug.slice(1) : slug;
}
