import { Injectable, signal, computed } from '@angular/core';

/**
 * DrawerStateService - Vaul-like Pattern for Angular
 *
 * Manages global state of open drawers/modals/bottomsheets.
 * Used by VaulWrapperDirective to apply scale transform to main content.
 *
 * Features:
 * - Tracks multiple simultaneous drawers (nested modals)
 * - Provides reactive signals for UI binding
 * - Handles scroll lock via CSS class (not position:fixed)
 *
 * @example
 * ```typescript
 * // In modal/drawer component
 * readonly #drawerState = inject(DrawerStateService);
 *
 * onOpen() {
 *   this.#drawerState.open('my-drawer-id');
 * }
 *
 * onClose() {
 *   this.#drawerState.close('my-drawer-id');
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DrawerStateService {
  /**
   * Set of currently open drawer IDs
   * Using Set for O(1) add/remove operations
   */
  readonly #openDrawers = signal<Set<string>>(new Set());

  /**
   * Reactive signal: true if any drawer is open
   */
  readonly isAnyOpen = computed(() => this.#openDrawers().size > 0);

  /**
   * Reactive signal: count of open drawers (for nested scenarios)
   */
  readonly openCount = computed(() => this.#openDrawers().size);

  /**
   * Reactive signal: list of open drawer IDs (for debugging)
   */
  readonly openIds = computed(() => Array.from(this.#openDrawers()));

  /**
   * Register a drawer as open
   * Triggers scale transform on wrapper via VaulWrapperDirective
   */
  open(drawerId: string): void {
    this.#openDrawers.update(set => {
      const newSet = new Set(set);
      newSet.add(drawerId);
      return newSet;
    });

    // Add scroll lock class to body (CSS handles the actual blocking)
    this.#updateBodyScrollLock();
  }

  /**
   * Register a drawer as closed
   * Removes scale transform when last drawer closes
   */
  close(drawerId: string): void {
    this.#openDrawers.update(set => {
      const newSet = new Set(set);
      newSet.delete(drawerId);
      return newSet;
    });

    // Update scroll lock state
    this.#updateBodyScrollLock();
  }

  /**
   * Check if a specific drawer is open
   */
  isOpen(drawerId: string): boolean {
    return this.#openDrawers().has(drawerId);
  }

  /**
   * Close all drawers (emergency reset)
   */
  closeAll(): void {
    this.#openDrawers.set(new Set());
    this.#updateBodyScrollLock();
  }

  /**
   * Update body scroll lock class based on drawer state
   * Uses CSS class instead of inline styles to avoid reflow issues
   */
  #updateBodyScrollLock(): void {
    if (typeof document === 'undefined') return;

    if (this.isAnyOpen()) {
      document.body.classList.add('vaul-drawer-open');
    } else {
      document.body.classList.remove('vaul-drawer-open');
    }
  }
}