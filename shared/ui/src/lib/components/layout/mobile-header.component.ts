import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@cigar-platform/types';
import { AvatarComponent } from '../avatar';
import { FabMenuComponent, type FabMenuItem } from '../fab-menu';
import { IconDirective } from '../../directives/icon';

/**
 * Mobile Header Component
 * Displays at the top of mobile screens with clickable context avatar
 * Shows user avatar in solo context, club avatar in club context
 * Hidden on desktop (≥768px)
 */
@Component({
  selector: 'ui-mobile-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent, FabMenuComponent, IconDirective],
  template: `
    <header class="fixed left-0 right-0 top-0 z-40 border-b border-smoke-800 backdrop-blur-xl md:hidden">
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Context Avatar (clickable to open context switcher) -->
        <button
          type="button"
          (click)="contextClick.emit()"
          class="flex items-center gap-3 transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-smoke-900 rounded-lg px-2 py-1"
        >
          <div class="relative">
            @if (contextType() === 'solo') {
              <div class="relative rounded-full ring-2 ring-gold-500 ring-offset-2 ring-offset-smoke-900">
                <ui-avatar [user]="user()" size="md" />
              </div>
            } @else if (contextType() === 'club' && club()) {
              <div class="relative rounded-full ring-2 ring-gold-500 ring-offset-2 ring-offset-smoke-900">
                <ui-avatar [club]="club()" size="md" />
              </div>
            }
          </div>

          <!-- Context Name -->
          <div class="flex flex-col items-start">
            <span class="text-sm font-semibold text-smoke-100">
              @if (contextType() === 'solo') {
                {{ user()?.displayName || 'Mon compte' }}
              } @else if (contextType() === 'club' && club()) {
                {{ club().name }}
              }
            </span>
            <span class="text-xs text-smoke-400">
              @if (contextType() === 'solo') {
                Personnel
              } @else {
                Club
              }
            </span>
          </div>
        </button>

        <!-- Page Title (optional, projected content) -->
        <div class="flex-1 text-center">
          <ng-content />
        </div>

        <!-- Search Button -->
        <button
          type="button"
          (click)="searchClick.emit()"
          class="flex items-center justify-center w-10 h-10 rounded-lg text-smoke-400 hover:text-gold-500 hover:bg-smoke-800/50 transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-smoke-900"
          aria-label="Rechercher"
        >
          <i name="search" class="w-5 h-5"></i>
        </button>

        <!-- FAB Menu (contextual quick actions) -->
        <ui-fab-menu
          variant="inline"
          [isOpen]="fabMenuOpen()"
          [items]="fabMenuItems()"
          (toggle)="fabMenuToggle.emit()"
          (close)="fabMenuClose.emit()"
          (itemClicked)="fabMenuItemClicked.emit($event)"
        />
      </div>
    </header>
  `,
})
export class MobileHeaderComponent {
  // Context information
  readonly contextType = input<'solo' | 'club'>('solo');
  readonly user = input<User | null>(null);
  readonly club = input<any | null>(null); // TODO: Replace with ClubDto

  // FAB menu
  readonly fabMenuOpen = input<boolean>(false);
  readonly fabMenuItems = input<FabMenuItem[]>([]);

  // Events
  readonly contextClick = output<void>();
  readonly searchClick = output<void>();
  readonly fabMenuToggle = output<void>();
  readonly fabMenuClose = output<void>();
  readonly fabMenuItemClicked = output<string>();
}
