import { InjectionToken } from '@angular/core';

/**
 * Interface for drawer state management
 * Implemented by app-specific DrawerStateService
 */
export interface DrawerStateHandler {
  /**
   * Notify that a drawer/modal is opening
   * @param drawerId Unique identifier for the drawer instance
   */
  open(drawerId: string): void;

  /**
   * Notify that a drawer/modal is closing
   * @param drawerId Unique identifier for the drawer instance
   */
  close(drawerId: string): void;
}

/**
 * InjectionToken for drawer state handler
 *
 * Apps can provide their own DrawerStateService implementation:
 *
 * @example
 * ```typescript
 * // In app.config.ts or module providers
 * providers: [
 *   {
 *     provide: DRAWER_STATE_HANDLER,
 *     useExisting: DrawerStateService
 *   }
 * ]
 * ```
 */
export const DRAWER_STATE_HANDLER = new InjectionToken<DrawerStateHandler>(
  'DrawerStateHandler'
);