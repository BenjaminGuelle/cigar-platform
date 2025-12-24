import { Component, inject, Signal, signal, WritableSignal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services';
import type { UserWithAuth } from '@cigar-platform/types';
import {
  SidebarComponent,
  SidebarNavItemComponent,
  SidebarActionComponent,
  SidebarProfileComponent,
  SubSidebarComponent,
  BottomTabBarComponent,
  BottomTabItemComponent,
  MobileHeaderComponent,
} from '@cigar-platform/shared/ui';

/**
 * Home Component (Main App Layout)
 * Wraps all authenticated pages with sidebar (desktop) and bottom tab bar (mobile)
 * Contains router-outlet for child routes (dashboard, clubs, settings, etc.)
 *
 * Smart sub-sidebar management:
 * - Auto-closes when navigating away from admin routes
 * - Stays open while navigating within admin section
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    SidebarNavItemComponent,
    SidebarActionComponent,
    SidebarProfileComponent,
    SubSidebarComponent,
    BottomTabBarComponent,
    BottomTabItemComponent,
    MobileHeaderComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  #authService = inject(AuthService);
  #router = inject(Router);

  readonly currentUser: Signal<UserWithAuth | null> = this.#authService.currentUser;

  // Sub-sidebar state management
  readonly adminMenuActive: WritableSignal<boolean> = signal<boolean>(false);

  constructor() {
    // Smart auto-close: Close sub-sidebar when navigating away from admin routes
    this.#router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // If navigating to a non-admin route, close the admin sub-sidebar
        if (!event.urlAfterRedirects.startsWith('/admin')) {
          this.adminMenuActive.set(false);
        }
      });
  }

  onSignOut(): void {
    this.#authService.signOut().subscribe();
  }

  openAdminMenu(): void {
    this.adminMenuActive.set(true);
  }

  closeAdminMenu(): void {
    this.adminMenuActive.set(false);
  }
}
