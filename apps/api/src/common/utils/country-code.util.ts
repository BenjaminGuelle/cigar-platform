/**
 * Country Code Utility
 * Maps country names to ISO 3166-1 alpha-2 codes for flag-icons library
 */

/**
 * Mapping of common cigar origin country names to ISO codes
 * Includes common variations and aliases
 */
const COUNTRY_CODE_MAP: Record<string, string> = {
  // Major cigar producing countries
  'cuba': 'cu',
  'cubain': 'cu',
  'cuban': 'cu',
  'nicaragua': 'ni',
  'nicaraguan': 'ni',
  'dominican republic': 'do',
  'dominicaine': 'do',
  'rep. dom.': 'do',
  'republique dominicaine': 'do',
  'dominicana': 'do',
  'honduras': 'hn',
  'honduran': 'hn',
  'mexico': 'mx',
  'mexique': 'mx',
  'mexican': 'mx',
  'ecuador': 'ec',
  'equateur': 'ec',
  'ecuadorian': 'ec',
  'costa rica': 'cr',
  'brazil': 'br',
  'bresil': 'br',
  'brazilian': 'br',
  'peru': 'pe',
  'perou': 'pe',
  'peruvian': 'pe',
  'colombia': 'co',
  'colombie': 'co',
  'colombian': 'co',
  'panama': 'pa',
  'panamanian': 'pa',
  'jamaica': 'jm',
  'jamaique': 'jm',
  'jamaican': 'jm',
  'puerto rico': 'pr',
  'porto rico': 'pr',
  'cameroon': 'cm',
  'cameroun': 'cm',
  'cameroonian': 'cm',
  'sumatra': 'id',
  'indonesia': 'id',
  'indonesie': 'id',
  'indonesian': 'id',
  'java': 'id',
  'philippines': 'ph',
  'usa': 'us',
  'etats-unis': 'us',
  'united states': 'us',
  'connecticut': 'us',
  'dominican': 'do',
  'espagne': 'es',
  'spain': 'es',
  'canaries': 'es',
  'canary islands': 'es',
};

/**
 * Get ISO 3166-1 alpha-2 country code from country name
 * @param countryName - Country name in any supported format
 * @returns ISO code (lowercase) or 'xx' if not found
 */
export function getCountryCode(countryName: string | null | undefined): string {
  if (!countryName) {
    return 'xx';
  }

  const normalizedName = countryName.toLowerCase().trim();
  return COUNTRY_CODE_MAP[normalizedName] ?? 'xx';
}

/**
 * Check if a country code is valid (exists in our mapping)
 * @param countryName - Country name to check
 * @returns true if the country is in our mapping
 */
export function isKnownCountry(countryName: string | null | undefined): boolean {
  if (!countryName) {
    return false;
  }

  const normalizedName = countryName.toLowerCase().trim();
  return normalizedName in COUNTRY_CODE_MAP;
}