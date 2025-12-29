/**
 * Username & Slug Utilities
 *
 * Règles de validation (ALL STARS 2026):
 * - Pattern: ^[a-z0-9._]{3,30}$
 * - Lowercase only
 * - Alphanumeric + underscore (_) + dot (.)
 * - No spaces, no accents, no special chars
 * - Length: 3-30 characters
 */

/**
 * Slugify text for username/slug generation
 * Transform "Benjamin Guelle" → "benjamin_guelle"
 * Transform "Les Connoisseurs" → "les_connoisseurs"
 *
 * @param text - Input text to slugify
 * @returns Slugified text (lowercase, a-z0-9._)
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-z0-9.]+/g, '_') // Replace non-alphanumeric (except dot) with underscore
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single
    .substring(0, 30); // Truncate to max length
}

/**
 * Ensure minimum length for username/slug
 * If too short, append '_user' or '_club'
 *
 * @param slug - Base slug
 * @param suffix - Suffix to append if too short (default: 'user')
 * @returns Slug with minimum 3 characters
 */
export function ensureMinLength(slug: string, suffix: 'user' | 'club' = 'user'): string {
  if (slug.length >= 3) return slug;

  const withSuffix = `${slug}_${suffix}`;
  return withSuffix.substring(0, 30);
}

/**
 * Generate unique username from base text
 * Handles duplicates by appending numbers: @ben, @ben_2, @ben_3
 *
 * @param baseText - Base text (displayName or club name)
 * @param existingUsernames - Array of existing usernames to check against
 * @param suffix - Suffix for min length (default: 'user')
 * @returns Unique username
 */
export function generateUniqueUsername(
  baseText: string,
  existingUsernames: string[],
  suffix: 'user' | 'club' = 'user'
): string {
  const baseSlug = ensureMinLength(slugify(baseText), suffix);

  // If base is unique, return it
  if (!existingUsernames.includes(baseSlug)) {
    return baseSlug;
  }

  // Otherwise, append numbers until unique
  let counter = 2;
  let uniqueUsername: string;

  do {
    // Calculate max base length to fit counter
    const counterStr = `_${counter}`;
    const maxBaseLength = 30 - counterStr.length;

    uniqueUsername = baseSlug.substring(0, maxBaseLength) + counterStr;
    counter++;
  } while (existingUsernames.includes(uniqueUsername));

  return uniqueUsername;
}

/**
 * Validate username/slug format
 * Pattern: ^[a-z0-9._]{3,30}$
 *
 * @param username - Username or slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false;

  const usernamePattern = /^[a-z0-9._]{3,30}$/;
  return usernamePattern.test(username);
}

/**
 * Validate username/slug with detailed error message
 *
 * @param username - Username or slug to validate
 * @param field - Field name for error message (default: 'Username')
 * @returns Error message if invalid, null if valid
 */
export function validateUsername(username: string, field: string = 'Username'): string | null {
  if (!username) {
    return `${field} is required`;
  }

  if (username.length < 3) {
    return `${field} must be at least 3 characters`;
  }

  if (username.length > 30) {
    return `${field} must be at most 30 characters`;
  }

  if (username !== username.toLowerCase()) {
    return `${field} must be lowercase only`;
  }

  if (!/^[a-z0-9._]+$/.test(username)) {
    return `${field} can only contain lowercase letters, numbers, dots (.) and underscores (_)`;
  }

  return null;
}

/**
 * Extract username from email local part
 * "benjamin.guelle@example.com" → "benjamin_guelle"
 *
 * @param email - Email address
 * @returns Slugified username from email local part
 */
export function usernameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  return slugify(localPart);
}