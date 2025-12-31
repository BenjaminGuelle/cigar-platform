/**
 * List of cigar-producing countries with emoji flags
 *
 * Ordered by cigar production importance:
 * 1. Major producers (Cuba, Dominican Republic, Nicaragua, Honduras)
 * 2. Secondary producers (Mexico, Brazil, Ecuador, etc.)
 * 3. Others
 *
 * Using country names (not ISO codes) for better UX and consistency with existing data
 */
export const CIGAR_COUNTRIES = [
  // ===== MAJOR PRODUCERS =====
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'DO', name: 'République Dominicaine', flag: '🇩🇴' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },

  // ===== SECONDARY PRODUCERS =====
  { code: 'MX', name: 'Mexique', flag: '🇲🇽' },
  { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  { code: 'EC', name: 'Équateur', flag: '🇪🇨' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CO', name: 'Colombie', flag: '🇨🇴' },
  { code: 'PE', name: 'Pérou', flag: '🇵🇪' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },

  // ===== OTHER PRODUCERS =====
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'JM', name: 'Jamaïque', flag: '🇯🇲' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonésie', flag: '🇮🇩' },
  { code: 'IN', name: 'Inde', flag: '🇮🇳' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
] as const;

export type CigarCountry = typeof CIGAR_COUNTRIES[number];