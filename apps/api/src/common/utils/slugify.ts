/**
 * Slugify utilities for URL-friendly identifiers
 * Uses same pattern as club/user slugs
 */

/**
 * Generate slug for brand
 * Example: "Cohiba" → "cohiba"
 * Example: "Arturo Fuente" → "arturo-fuente"
 */
export function slugifyBrand(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

/**
 * Generate slug for cigar
 * Example: ("cohiba", "Behike 52") → "cohiba-behike-52"
 */
export function slugifyCigar(brandSlug: string, cigarName: string): string {
  const cigarSlug = cigarName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${brandSlug}-${cigarSlug}`;
}
