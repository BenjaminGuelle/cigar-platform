import { Component, inject, Signal, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../services';
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
 * Main Layout Component
 * Wraps all authenticated pages with sidebar (desktop) and bottom tab bar (mobile)
 * Uses content projection for page-specific content
 */
@Component({
  selector: 'app-layout',
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
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  #authService = inject(AuthService);

  readonly currentUser: Signal<UserWithAuth | null> = this.#authService.currentUser;

  // Sub-sidebar state management
  readonly adminMenuActive: WritableSignal<boolean> = signal<boolean>(false);

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