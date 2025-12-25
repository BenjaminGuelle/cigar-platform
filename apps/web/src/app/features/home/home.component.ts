import { Component, inject, Signal, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services';
import { ContextStore } from '../../core/stores/context.store';
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
  type FabMenuItem,
} from '@cigar-platform/shared/ui';
import { CreateJoinClubModalComponent } from '../../shared/components/create-join-club-modal';
import { CreateContentModalComponent } from '../../shared/components/create-content-modal';

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
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  #authService = inject(AuthService);
  #contextStore = inject(ContextStore);

  readonly currentUser: Signal<UserWithAuth | null> = this.#authService.currentUser;
  readonly context = this.#contextStore.context;
  readonly userClubs = this.#contextStore.userClubs;

  // Context switcher state (mobile bottom sheet)
  readonly contextSwitcherOpen: WritableSignal<boolean> = signal<boolean>(false);

  // Create/Join club modal state
  readonly createJoinClubModalOpen: WritableSignal<boolean> = signal<boolean>(false);

  // Create content modal state
  readonly createContentModalOpen: WritableSignal<boolean> = signal<boolean>(false);

  // FAB menu state
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

  onSignOut(): void {
    this.#authService.signOut().subscribe();
  }

  onContextClick(): void {
    this.contextSwitcherOpen.set(true);
  }

  onContextSwitcherClose(): void {
    this.contextSwitcherOpen.set(false);
  }

  onContextSelected(event: { type: 'solo' | 'club'; id: string | null; club?: any }): void {
    if (event.type === 'solo') {
      this.#contextStore.switchToSolo();
    } else if (event.type === 'club' && event.club) {
      // TODO: Get user's actual role in the club
      this.#contextStore.switchToClub(event.club, 'member');
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
    console.log('[Home] Club created successfully');
  }

  onClubJoined(): void {
    // TODO: Refresh user clubs
    console.log('[Home] Club joined successfully');
  }

  onCreateContentModalClose(): void {
    this.createContentModalOpen.set(false);
  }

  onEventCreated(): void {
    // TODO: Refresh events / navigate to event
    console.log('[Home] Event created successfully');
  }

  onFabMenuToggle(): void {
    this.fabMenuOpen.update(open => !open);
  }

  onFabMenuClose(): void {
    this.fabMenuOpen.set(false);
  }

  onFabMenuItemClick(action: string): void {
    if (action === 'create-evaluation') {
      // TODO: Navigate to /evaluations/new with context
      console.log('[Home] Navigate to create evaluation');
    } else if (action === 'create-event') {
      this.createContentModalOpen.set(true);
    }
  }
}
