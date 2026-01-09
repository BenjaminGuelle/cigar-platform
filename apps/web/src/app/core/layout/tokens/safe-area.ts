/**
 * Safe Area Tokens
 *
 * Helpers for handling iOS/Android safe areas (notch, home indicator).
 * Uses CSS env() function for native values.
 *
 * @example
 * ```typescript
 * import { SAFE_AREA_CSS_VARS, getSafeAreaStyle } from '@core/layout';
 *
 * // In component template
 * [style]="getSafeAreaStyle('top')"
 * ```
 */

// =============================================================================
// CSS CUSTOM PROPERTIES
// =============================================================================

/**
 * CSS custom property names for safe areas
 * These mirror the env() values for easier access
 */
export const SAFE_AREA_CSS_VARS = {
  top: '--safe-area-top',
  right: '--safe-area-right',
  bottom: '--safe-area-bottom',
  left: '--safe-area-left',
} as const;

/**
 * CSS env() expressions for safe areas
 */
export const SAFE_AREA_ENV = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
} as const;

// =============================================================================
// STYLE HELPERS
// =============================================================================

export type SafeAreaPosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Get inline style for safe area padding
 *
 * @param position - Which safe area to apply
 * @param additionalPx - Additional pixels to add (e.g., header height)
 * @returns CSS string for [style] binding
 *
 * @example
 * ```html
 * <header [style]="getSafeAreaPadding('top')">
 * <footer [style]="getSafeAreaPadding('bottom', 8)">
 * ```
 */
export function getSafeAreaPadding(
  position: SafeAreaPosition,
  additionalPx = 0
): string {
  const env = SAFE_AREA_ENV[position];

  if (additionalPx === 0) {
    return `padding-${position}: ${env}`;
  }

  return `padding-${position}: calc(${additionalPx}px + ${env})`;
}

/**
 * Get CSS calc expression for safe area + additional value
 *
 * @param position - Which safe area
 * @param additionalPx - Additional pixels
 * @returns CSS calc() expression
 *
 * @example
 * ```typescript
 * const headerHeight = getSafeAreaCalc('top', MOBILE_HEADER_HEIGHT);
 * // Returns: "calc(56px + env(safe-area-inset-top, 0px))"
 * ```
 */
export function getSafeAreaCalc(
  position: SafeAreaPosition,
  additionalPx = 0
): string {
  const env = SAFE_AREA_ENV[position];

  if (additionalPx === 0) {
    return env;
  }

  return `calc(${additionalPx}px + ${env})`;
}

/**
 * Get max() expression for safe area with minimum value
 *
 * @param position - Which safe area
 * @param minimumPx - Minimum value in pixels
 * @returns CSS max() expression
 *
 * @example
 * ```typescript
 * const padding = getSafeAreaMax('top', 8);
 * // Returns: "max(8px, env(safe-area-inset-top, 0px))"
 * ```
 */
export function getSafeAreaMax(
  position: SafeAreaPosition,
  minimumPx: number
): string {
  return `max(${minimumPx}px, ${SAFE_AREA_ENV[position]})`;
}