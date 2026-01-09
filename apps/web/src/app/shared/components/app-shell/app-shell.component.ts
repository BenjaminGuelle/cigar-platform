import {
  Component,
  inject,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  type Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { LayoutService, ShellStateService } from '../../../core/layout';
import { AuthService } from '../../../core/services';
import { ContextStore, type ClubWithRole } from '../../../core/stores/context.store';
import type { UserWithAuth, ClubResponseDto } from '@cigar-platform/types';
import {
  FabMenuComponent,
  ComingSoonModalComponent,
  type FabMenuItem,
} from '@cigar-platform/shared/ui';

// Layout sub-components
import {
  MobileHeaderComponent,
  MobileHeaderExploreComponent,
  MobileTabBarComponent,
  MobileTabItemComponent,
  ContextSwitcherComponent,
  DesktopSidebarComponent,
  DesktopTopTabsComponent,
  DesktopTopTabItemComponent,
} from '../layout';
import { PullToRefreshDirective, VaulWrapperDirective } from '../../directives';
import { CreateJoinClubModalComponent } from '../create-join-club-modal';
import { CreateContentModalComponent } from '../create-content-modal';
import { NotificationsDrawerComponent } from '../notifications-drawer';
import { SettingsDrawerComponent } from '../settings-drawer';

/**
 * AppShell Component
 *
 * Main layout wrapper providing responsive shell structure.
 * Single source of truth for app layout following ALL STARS architecture.
 *
 * Structure:
 * - Desktop (≥768px): Sidebar (left) + Top tabs + Content
 * - Mobile (<768px): Header + Content + TabBar
 *
 * Features:
 * - Automatic responsive layout via LayoutService
 * - Centralized drawer/modal state via ShellStateService
 * - Vaul-like scale effect on drawer open
 * - Pull-to-refresh on mobile
 * - Safe area support for PWA
 *
 * @example
 * ```html
 * <app-shell>
 *   <router-outlet />
 * </app-shell>
 * ```
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    // Layout components
    MobileHeaderComponent,
    MobileHeaderExploreComponent,
    MobileTabBarComponent,
    MobileTabItemComponent,
    ContextSwitcherComponent,
    DesktopSidebarComponent,
    DesktopTopTabsComponent,
    DesktopTopTabItemComponent,
    // Directives
    PullToRefreshDirective,
    VaulWrapperDirective,
    // Feature components
    CreateJoinClubModalComponent,
    CreateContentModalComponent,
    FabMenuComponent,
    ComingSoonModalComponent,
    // Drawer components
    NotificationsDrawerComponent,
    SettingsDrawerComponent,
  ],
  templateUrl: './app-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  // ==========================================================================
  // SERVICES
  // ==========================================================================

  readonly #router = inject(Router);
  readonly #authService = inject(AuthService);
  readonly layout = inject(LayoutService);
  readonly shell = inject(ShellStateService);
  readonly contextStore = inject(ContextStore);

  // ==========================================================================
  // INPUTS
  // ==========================================================================

  /**
   * Whether to show admin tab (based on user role)
   */
  readonly showAdminTab = input<boolean>(false);

  // ==========================================================================
  // OUTPUTS
  // ==========================================================================

  /**
   * Emitted when FAB action is triggered
   */
  readonly fabAction = output<string>();

  // ==========================================================================
  // STATE FROM SERVICES
  // ==========================================================================

  readonly currentUser: Signal<UserWithAuth | null> = this.#authService.currentUser;
  readonly context = this.contextStore.context;
  readonly userClubs = this.contextStore.userClubs;

  // Shell state (delegated to ShellStateService)
  readonly contextSwitcherOpen = this.shell.contextSwitcherOpen;
  readonly createJoinClubModalOpen = this.shell.createJoinClubModalOpen;
  readonly createContentModalOpen = this.shell.createContentModalOpen;
  readonly comingSoonModalOpen = this.shell.comingSoonModalOpen;
  readonly comingSoonFeature = this.shell.comingSoonFeature;
  readonly fabMenuOpen = this.shell.fabMenuOpen;
  readonly notificationsDrawerOpen = this.shell.notificationsDrawerOpen;
  readonly settingsDrawerOpen = this.shell.settingsDrawerOpen;

  // ==========================================================================
  // COMPUTED
  // ==========================================================================

  /**
   * Check if current user has admin privileges
   */
  readonly isAdmin: Signal<boolean> = computed(() => {
    const user = this.currentUser();
    if (!user?.role) return false;
    return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MODERATOR';
  });

  /**
   * Route-based visibility: detect /explore page for header hiding
   */
  readonly #currentUrl = toSignal(
    this.#router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.#router.url)
    )
  );

  readonly isExplorePage: Signal<boolean> = computed(() => {
    const url = this.#currentUrl();
    return url?.startsWith('/explore') ?? false;
  });

  /**
   * FAB menu items based on context
   */
  readonly fabMenuItems: Signal<FabMenuItem[]> = computed(() => {
    const items: FabMenuItem[] = [
      {
        icon: 'flame',
        label: 'Nouvelle dégustation',
        action: 'create-evaluation',
        show: true,
      },
    ];

    // Show event creation only in club context
    if (this.context().type === 'club') {
      items.push({
        icon: 'calendar',
        label: 'Nouvel événement',
        action: 'create-event',
        show: true,
      });
    }

    return items;
  });

  // ==========================================================================
  // EVENT HANDLERS - Context
  // ==========================================================================

  onContextClick(): void {
    this.shell.openDrawer('context-switcher');
  }

  onContextSwitcherClose(): void {
    this.shell.closeDrawer('context-switcher');
  }

  onContextSelected(event: { type: 'solo' | 'club'; id: string | null; club?: ClubWithRole }): void {
    if (event.type === 'solo') {
      this.contextStore.switchToSolo();
    } else if (event.type === 'club' && event.club) {
      const role = event.club.myRole || 'member';
      this.contextStore.switchToClub(event.club, role);
    }
  }

  // ==========================================================================
  // EVENT HANDLERS - Modals
  // ==========================================================================

  onCreateJoinClub(): void {
    this.shell.openDrawer('create-join-club');
  }

  onCreateJoinClubModalClose(): void {
    this.shell.closeDrawer('create-join-club');
  }

  onClubCreated(): void {
    // Refresh user clubs after creation
    void this.contextStore.loadUserClubs();
  }

  onClubJoined(): void {
    // Refresh user clubs after joining
    void this.contextStore.loadUserClubs();
  }

  onCreateContentModalClose(): void {
    this.shell.closeDrawer('create-content');
  }

  onEventCreated(): void {
    // TODO: Navigate to event or refresh
  }

  // ==========================================================================
  // EVENT HANDLERS - FAB
  // ==========================================================================

  onFabMenuToggle(): void {
    this.shell.toggleDrawer('fab-menu');
  }

  onFabMenuClose(): void {
    this.shell.closeDrawer('fab-menu');
  }

  onFabMenuItemClick(action: string): void {
    if (action === 'create-evaluation') {
      void this.#router.navigate(['/tasting', 'new']);
    } else if (action === 'create-event') {
      this.shell.openDrawer('create-content');
    }
    this.fabAction.emit(action);
  }

  // ==========================================================================
  // EVENT HANDLERS - Coming Soon
  // ==========================================================================

  onComingSoonOpen(featureName: string): void {
    this.shell.openComingSoon(featureName);
  }

  onComingSoonClose(): void {
    this.shell.closeComingSoon();
  }

  // ==========================================================================
  // EVENT HANDLERS - Drawers
  // ==========================================================================

  onNotificationsOpen(): void {
    this.shell.openDrawer('notifications');
  }

  onNotificationsClose(): void {
    this.shell.closeDrawer('notifications');
  }

  onSettingsOpen(): void {
    this.shell.openDrawer('settings');
  }

  onSettingsClose(): void {
    this.shell.closeDrawer('settings');
  }
}