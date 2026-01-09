import { Injectable, signal, computed, type WritableSignal, type Signal } from '@angular/core';

/**
 * Drawer/Modal identifiers used in the app shell
 */
export type ShellDrawerId =
  | 'context-switcher'
  | 'notifications'
  | 'settings'
  | 'create-join-club'
  | 'create-content'
  | 'coming-soon'
  | 'fab-menu';

/**
 * Shell State Service
 *
 * Centralized state management for the app shell UI elements:
 * - Drawers (notifications, settings, context switcher)
 * - Modals (create club, create content, coming soon)
 * - FAB menu state
 *
 * This service manages the open/closed state of shell UI elements.
 * For the Vaul scale effect, use DrawerStateService alongside this.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class AppShellComponent {
 *   private shell = inject(ShellStateService);
 *
 *   // Open notifications drawer
 *   onNotificationsClick() {
 *     this.shell.openDrawer('notifications');
 *   }
 *
 *   // Bind in template
 *   notificationsOpen = this.shell.isDrawerOpen('notifications');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ShellStateService {
  // ==========================================================================
  // DRAWER STATE SIGNALS
  // ==========================================================================

  /**
   * Context switcher (mobile bottom sheet)
   */
  readonly contextSwitcherOpen: WritableSignal<boolean> = signal(false);

  /**
   * Notifications drawer (right side)
   */
  readonly notificationsDrawerOpen: WritableSignal<boolean> = signal(false);

  /**
   * Settings drawer (right side)
   */
  readonly settingsDrawerOpen: WritableSignal<boolean> = signal(false);

  // ==========================================================================
  // MODAL STATE SIGNALS
  // ==========================================================================

  /**
   * Create/Join club modal
   */
  readonly createJoinClubModalOpen: WritableSignal<boolean> = signal(false);

  /**
   * Create content modal (events, etc.)
   */
  readonly createContentModalOpen: WritableSignal<boolean> = signal(false);

  /**
   * Coming soon feature modal
   */
  readonly comingSoonModalOpen: WritableSignal<boolean> = signal(false);

  /**
   * Coming soon feature name (for display)
   */
  readonly comingSoonFeature: WritableSignal<string> = signal('');

  // ==========================================================================
  // FAB MENU STATE
  // ==========================================================================

  /**
   * FAB menu open state
   */
  readonly fabMenuOpen: WritableSignal<boolean> = signal(false);

  // ==========================================================================
  // COMPUTED STATE
  // ==========================================================================

  /**
   * True if any drawer is currently open
   */
  readonly isAnyDrawerOpen: Signal<boolean> = computed(
    () =>
      this.contextSwitcherOpen() ||
      this.notificationsDrawerOpen() ||
      this.settingsDrawerOpen()
  );

  /**
   * True if any modal is currently open
   */
  readonly isAnyModalOpen: Signal<boolean> = computed(
    () =>
      this.createJoinClubModalOpen() ||
      this.createContentModalOpen() ||
      this.comingSoonModalOpen()
  );

  /**
   * True if any overlay (drawer or modal) is open
   */
  readonly isAnyOverlayOpen: Signal<boolean> = computed(
    () => this.isAnyDrawerOpen() || this.isAnyModalOpen() || this.fabMenuOpen()
  );

  // ==========================================================================
  // PUBLIC METHODS - DRAWERS
  // ==========================================================================

  /**
   * Open a specific drawer by ID
   */
  openDrawer(drawerId: ShellDrawerId): void {
    switch (drawerId) {
      case 'context-switcher':
        this.contextSwitcherOpen.set(true);
        break;
      case 'notifications':
        this.notificationsDrawerOpen.set(true);
        break;
      case 'settings':
        this.settingsDrawerOpen.set(true);
        break;
      case 'create-join-club':
        this.createJoinClubModalOpen.set(true);
        break;
      case 'create-content':
        this.createContentModalOpen.set(true);
        break;
      case 'fab-menu':
        this.fabMenuOpen.set(true);
        break;
    }
  }

  /**
   * Close a specific drawer by ID
   */
  closeDrawer(drawerId: ShellDrawerId): void {
    switch (drawerId) {
      case 'context-switcher':
        this.contextSwitcherOpen.set(false);
        break;
      case 'notifications':
        this.notificationsDrawerOpen.set(false);
        break;
      case 'settings':
        this.settingsDrawerOpen.set(false);
        break;
      case 'create-join-club':
        this.createJoinClubModalOpen.set(false);
        break;
      case 'create-content':
        this.createContentModalOpen.set(false);
        break;
      case 'fab-menu':
        this.fabMenuOpen.set(false);
        break;
      case 'coming-soon':
        this.comingSoonModalOpen.set(false);
        break;
    }
  }

  /**
   * Toggle a drawer open/closed
   */
  toggleDrawer(drawerId: ShellDrawerId): void {
    switch (drawerId) {
      case 'context-switcher':
        this.contextSwitcherOpen.update(v => !v);
        break;
      case 'notifications':
        this.notificationsDrawerOpen.update(v => !v);
        break;
      case 'settings':
        this.settingsDrawerOpen.update(v => !v);
        break;
      case 'fab-menu':
        this.fabMenuOpen.update(v => !v);
        break;
    }
  }

  /**
   * Check if a drawer is open
   */
  isDrawerOpen(drawerId: ShellDrawerId): Signal<boolean> {
    switch (drawerId) {
      case 'context-switcher':
        return this.contextSwitcherOpen;
      case 'notifications':
        return this.notificationsDrawerOpen;
      case 'settings':
        return this.settingsDrawerOpen;
      case 'create-join-club':
        return this.createJoinClubModalOpen;
      case 'create-content':
        return this.createContentModalOpen;
      case 'coming-soon':
        return this.comingSoonModalOpen;
      case 'fab-menu':
        return this.fabMenuOpen;
    }
  }

  // ==========================================================================
  // PUBLIC METHODS - COMING SOON MODAL
  // ==========================================================================

  /**
   * Open the coming soon modal with a feature name
   */
  openComingSoon(featureName: string): void {
    this.comingSoonFeature.set(featureName);
    this.comingSoonModalOpen.set(true);
  }

  /**
   * Close the coming soon modal
   */
  closeComingSoon(): void {
    this.comingSoonModalOpen.set(false);
  }

  // ==========================================================================
  // PUBLIC METHODS - CLOSE ALL
  // ==========================================================================

  /**
   * Close all drawers
   */
  closeAllDrawers(): void {
    this.contextSwitcherOpen.set(false);
    this.notificationsDrawerOpen.set(false);
    this.settingsDrawerOpen.set(false);
  }

  /**
   * Close all modals
   */
  closeAllModals(): void {
    this.createJoinClubModalOpen.set(false);
    this.createContentModalOpen.set(false);
    this.comingSoonModalOpen.set(false);
  }

  /**
   * Close everything (drawers, modals, FAB)
   */
  closeAll(): void {
    this.closeAllDrawers();
    this.closeAllModals();
    this.fabMenuOpen.set(false);
  }
}