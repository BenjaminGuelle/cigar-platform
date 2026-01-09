/**
 * Layout Breakpoints
 *
 * Single source of truth for responsive breakpoints.
 * Aligned with Tailwind's default breakpoints.
 *
 * Usage:
 * - CSS: Use Tailwind classes (sm:, md:, lg:, xl:)
 * - TypeScript: Import these constants
 *
 * @example
 * ```typescript
 * import { BREAKPOINT_MD } from '@core/layout';
 *
 * if (window.innerWidth >= BREAKPOINT_MD) {
 *   // Desktop logic
 * }
 * ```
 */

/**
 * Small breakpoint (640px)
 * Tailwind: sm:
 */
export const BREAKPOINT_SM = 640;

/**
 * Medium breakpoint (768px)
 * Tailwind: md:
 * PRIMARY mobile/desktop threshold
 */
export const BREAKPOINT_MD = 768;

/**
 * Large breakpoint (1024px)
 * Tailwind: lg:
 */
export const BREAKPOINT_LG = 1024;

/**
 * Extra large breakpoint (1280px)
 * Tailwind: xl:
 */
export const BREAKPOINT_XL = 1280;

/**
 * 2x Extra large breakpoint (1536px)
 * Tailwind: 2xl:
 */
export const BREAKPOINT_2XL = 1536;

/**
 * Breakpoint map for programmatic access
 */
export const BREAKPOINTS = {
  sm: BREAKPOINT_SM,
  md: BREAKPOINT_MD,
  lg: BREAKPOINT_LG,
  xl: BREAKPOINT_XL,
  '2xl': BREAKPOINT_2XL,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;