/**
 * Cigar Constants
 * Shared constants for cigar domain
 *
 * ALL STARS Architecture ⭐
 * - Type-safe constants
 * - Shared between frontend & backend
 * - Single source of truth
 */

/**
 * Standard Cigar Vitola Values (raw string array)
 * Ordered from most common to less common
 *
 * Reference: Traditional Cuban vitola nomenclature + modern formats
 */
export const CIGAR_VITOLA_VALUES = [
  'Robusto',
  'Toro',
  'Churchill',
  'Corona',
  'Petit Corona',
  'Panatela',
  'Lancero',
  'Lonsdale',
  'Figurado',
  'Torpedo',
  'Belicoso',
  'Perfecto',
  'Double Corona',
  'Gordo',
] as const;

/**
 * Vitola type derived from array
 * Use for type-safe vitola selection
 */
export type CigarVitola = (typeof CIGAR_VITOLA_VALUES)[number];

/**
 * Cigar Vitolas as SelectOption[] for ui-select component
 * Transformed from CIGAR_VITOLA_VALUES
 */
export const CIGAR_VITOLAS: Array<{ value: string; label: string }> = CIGAR_VITOLA_VALUES.map(vitola => ({
  value: vitola,
  label: vitola,
}));

/**
 * Cigar Strength Levels (1-5)
 * Used for slider component and filtering
 */
export const CIGAR_STRENGTH_MIN = 1;
export const CIGAR_STRENGTH_MAX = 5;

/**
 * Strength labels for display
 */
export const CIGAR_STRENGTH_LABELS = {
  1: 'Très doux',
  2: 'Doux',
  3: 'Moyen',
  4: 'Corsé',
  5: 'Très corsé',
} as const;
