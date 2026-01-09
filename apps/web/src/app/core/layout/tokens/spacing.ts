/**
 * Layout Spacing Tokens
 *
 * Single source of truth for layout dimensions.
 * Used by AppShell and layout components.
 *
 * Values in pixels for consistency with CSS calculations.
 *
 * @example
 * ```typescript
 * import { SIDEBAR_WIDTH, HEADER_HEIGHT } from '@core/layout';
 *
 * // Calculate content offset
 * const contentLeft = isDesktop ? SIDEBAR_WIDTH : 0;
 * ```
 */

// =============================================================================
// DESKTOP LAYOUT
// =============================================================================

/**
 * Desktop sidebar width (72px = w-18 in Tailwind)
 */
export const SIDEBAR_WIDTH = 72;

/**
 * Desktop top tabs height (72px = h-18 in Tailwind)
 */
export const DESKTOP_HEADER_HEIGHT = 72;

// =============================================================================
// MOBILE LAYOUT
// =============================================================================

/**
 * Mobile header height (56px)
 * Does NOT include safe area - that's added dynamically
 */
export const MOBILE_HEADER_HEIGHT = 56;

/**
 * Mobile tab bar height (64px)
 * Does NOT include safe area - that's added dynamically
 */
export const MOBILE_TAB_BAR_HEIGHT = 64;

// =============================================================================
// CONTENT SPACING
// =============================================================================

/**
 * Default horizontal padding for content (16px = px-4)
 */
export const CONTENT_PADDING_X = 16;

/**
 * Desktop content padding right (32px = pr-8)
 */
export const DESKTOP_CONTENT_PADDING_RIGHT = 32;

/**
 * Bottom padding for content to clear tab bar on mobile (96px = pb-24)
 */
export const MOBILE_CONTENT_PADDING_BOTTOM = 96;

/**
 * Bottom padding for content on desktop (32px = pb-8)
 */
export const DESKTOP_CONTENT_PADDING_BOTTOM = 32;

// =============================================================================
// CSS CUSTOM PROPERTIES
// =============================================================================

/**
 * CSS custom property names for layout values
 * Use these with var() in CSS
 */
export const CSS_VARS = {
  sidebarWidth: '--layout-sidebar-width',
  headerHeight: '--layout-header-height',
  tabBarHeight: '--layout-tab-bar-height',
  contentPaddingTop: '--layout-content-pt',
  contentPaddingBottom: '--layout-content-pb',
  contentPaddingLeft: '--layout-content-pl',
  contentPaddingRight: '--layout-content-pr',
} as const;

/**
 * Generate CSS custom properties string for inline styles
 */
export function getLayoutCssVars(isMobile: boolean): string {
  if (isMobile) {
    return `
      ${CSS_VARS.headerHeight}: ${MOBILE_HEADER_HEIGHT}px;
      ${CSS_VARS.tabBarHeight}: ${MOBILE_TAB_BAR_HEIGHT}px;
      ${CSS_VARS.contentPaddingBottom}: ${MOBILE_CONTENT_PADDING_BOTTOM}px;
    `;
  }

  return `
    ${CSS_VARS.sidebarWidth}: ${SIDEBAR_WIDTH}px;
    ${CSS_VARS.headerHeight}: ${DESKTOP_HEADER_HEIGHT}px;
    ${CSS_VARS.contentPaddingBottom}: ${DESKTOP_CONTENT_PADDING_BOTTOM}px;
  `;
}