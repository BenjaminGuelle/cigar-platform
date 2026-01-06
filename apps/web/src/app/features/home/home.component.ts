import { Component, inject, Signal, signal, WritableSignal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, SearchModalService } from '../../core/services';
import { ContextStore, type ClubWithRole } from '../../core/stores/context.store';
import type { UserWithAuth } from '@cigar-platform/types';
import {
  BottomTabBarComponent,
  BottomTabItemComponent,
  MobileHeaderComponent,
  ContextSidebarComponent,
  DesktopTopTabsComponent,
  DesktopTopTabItemComponent,
  ContextSwitcherComponent,
  FabMenuComponent,
  ComingSoonModalComponent,
  type FabMenuItem,
} from '@cigar-platform/shared/ui';
import { CreateJoinClubModalComponent } from '../../shared/components/create-join-club-modal';
import { CreateContentModalComponent } from '../../shared/components/create-content-modal';
import { GlobalSearchComponent } from '../../shared/components/global-search';

/**
 * Home Component (Main App Layout)
 * Wraps all authenticated pages with context-based navigation
 * - Desktop: Context sidebar (left) + Top tabs (horizontal)
 * - Mobile: Header with context avatar + Bottom tab bar
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    BottomTabBarComponent,
    BottomTabItemComponent,
    MobileHeaderComponent,
    ContextSidebarComponent,
    DesktopTopTabsComponent,
    DesktopTopTabItemComponent,
    ContextSwitcherComponent,
    CreateJoinClubModalComponent,
    CreateContentModalComponent,
    FabMenuComponent,
    GlobalSearchComponent,
    ComingSoonModalComponent,
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  #authService = inject(AuthService);
  #searchModal = inject(SearchModalService);
  #router = inject(Router);

  // Expose contextStore for template access to permission methods
  readonly contextStore = inject(ContextStore);

  readonly currentUser: Signal<UserWithAuth | null> = this.#authService.currentUser;
  readonly context = this.contextStore.context;
  readonly userClubs = this.contextStore.userClubs;

  // Admin check for navigation visibility
  readonly isAdmin: Signal<boolean> = computed(() => {
    const user = this.currentUser();
    if (!user?.role) return false;
    return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MODERATOR';
  });

  // Global search modal state (shared service)
  readonly searchModalOpen = this.#searchModal.isOpen;

  // Context switcher state (mobile bottom sheet)
  readonly contextSwitcherOpen: WritableSignal<boolean> = signal<boolean>(false);

  // Create/Join club modal state
  readonly createJoinClubModalOpen: WritableSignal<boolean> = signal<boolean>(false);

  // Create content modal state
  readonly createContentModalOpen: WritableSignal<boolean> = signal<boolean>(false);

  // Coming Soon modal state
  readonly comingSoonModalOpen: WritableSignal<boolean> = signal<boolean>(false);
  readonly comingSoonFeature: WritableSignal<string> = signal<string>('');

  // FAB menu state (Mobile + Desktop)
  readonly fabMenuOpen: WritableSignal<boolean> = signal<boolean>(false);
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

  constructor() {
    // Senior Dev Pattern: Load clubs + hydrate context after authentication
    // APP_INITIALIZER only restored clubId from localStorage (optimistic state)
    // Now we load real data and hydrate the "pending" club context
    this.contextStore.loadUserClubs().then(() => {
      const context = this.contextStore.context();

      // If we have a club context but no club data, hydrate it
      if (context.type === 'club' && context.clubId && !context.club) {
        this.contextStore.hydrateClubContext(context.clubId);
      }
    });

    // Close search modal on navigation (mobile bottom tab clicks)
    this.#router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.#searchModal.close();
      });
  }

  onSignOut(): void {
    this.#authService.signOut().subscribe();
  }

  onContextClick(): void {
    this.contextSwitcherOpen.set(true);
  }

  onContextSwitcherClose(): void {
    this.contextSwitcherOpen.set(false);
  }

  onContextSelected(event: { type: 'solo' | 'club'; id: string | null; club?: ClubWithRole }): void {
    if (event.type === 'solo') {
      this.contextStore.switchToSolo();
    } else if (event.type === 'club' && event.club) {
      // Use actual role from club data (included via /clubs/me endpoint)
      const role = event.club.myRole || 'member';
      this.contextStore.switchToClub(event.club, role);
    }
  }

  onCreateJoinClub(): void {
    this.createJoinClubModalOpen.set(true);
  }

  onCreateJoinClubModalClose(): void {
    this.createJoinClubModalOpen.set(false);
  }

  onClubCreated(): void {
    // TODO: Refresh user clubs
  }

  onClubJoined(): void {
    // TODO: Refresh user clubs
  }

  onCreateContentModalClose(): void {
    this.createContentModalOpen.set(false);
  }

  onEventCreated(): void {
    // TODO: Refresh events / navigate to event
  }

  onFabMenuToggle(): void {
    // Close search modal when opening FAB menu
    this.#searchModal.close();
    this.fabMenuOpen.update(open => !open);
  }

  onFabMenuClose(): void {
    this.fabMenuOpen.set(false);
  }

  onFabMenuItemClick(action: string): void {
    if (action === 'create-evaluation') {
      // Navigate to tasting page (context auto-détecté)
      void this.#router.navigate(['/tasting', 'new']);
    } else if (action === 'create-event') {
      this.createContentModalOpen.set(true);
    }
  }

  onSearchOpen(): void {
    // Toggle search modal (open if closed, close if open)
    if (this.searchModalOpen()) {
      this.#searchModal.close();
    } else {
      this.#searchModal.open();
    }
  }

  onSearchClose(): void {
    this.#searchModal.close();
  }

  onComingSoonOpen(featureName: string): void {
    // Close search modal when opening coming soon modal (mobile bottom tab)
    this.#searchModal.close();
    this.comingSoonFeature.set(featureName);
    this.comingSoonModalOpen.set(true);
  }

  onComingSoonClose(): void {
    this.comingSoonModalOpen.set(false);
  }
}
