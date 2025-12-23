import { Component, input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '@cigar-platform/types';
import { AvatarComponent } from '../avatar';

/**
 * Mobile Header Component
 * Displays at the top of mobile screens with clickable avatar
 * Hidden on desktop (≥768px)
 */
@Component({
  selector: 'ui-mobile-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent],
  template: `
    <header class="fixed left-0 right-0 top-0 z-40 border-b border-smoke-800 backdrop-blur-xl md:hidden">
      <div class="flex items-center justify-between px-4 py-3">
        <a
          routerLink="/settings"
          class="flex items-center transition-transform duration-200 active:scale-95"
        >
          <ui-avatar [user]="user()" size="md" />
        </a>

        <!-- Page Title (optional, projected content) -->
        <div class="flex-1 text-center">
          <ng-content />
        </div>

        <!-- Right side placeholder for balance/symmetry -->
        <div class="w-9"></div>
      </div>
    </header>
  `,
})
export class MobileHeaderComponent {
  readonly user = input<User | null>(null);
}
