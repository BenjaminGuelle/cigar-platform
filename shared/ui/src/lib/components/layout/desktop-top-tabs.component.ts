import { Component, computed, Signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import clsx from 'clsx';
import { IconDirective, type IconName } from '../../directives/icon/icon.directive';

export interface TopTab {
  label: string;
  route: string;
  icon?: IconName;
  badge?: number;
  exact?: boolean;
}

/**
 * Desktop Top Tabs Component
 * Horizontal navigation tabs for desktop view
 * Shows main app routes (Home, Clubs, Evaluations, etc.)
 *
 * Layout:
 * ┌─────────────────────────────────────────────┐
 * │ Home | Clubs | Evaluations | Events | ...  │
 * └─────────────────────────────────────────────┘
 *
 * Hidden on mobile (< 768px)
 */
@Component({
  selector: 'ui-desktop-top-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective],
  template: `
    <nav
      class="hidden md:flex fixed top-0 left-18 right-0 z-40 h-18 items-center gap-2 bg-smoke-800 border-b border-smoke-700/50 px-8 shadow-lg shadow-smoke-950/20"
    >
      <!-- Tabs -->
      <div class="flex items-center gap-2 flex-1">
        <ng-content />
      </div>

      <!-- Notifications Button -->
      <button
        type="button"
        (click)="notificationsClick.emit()"
        class="flex items-center justify-center w-10 h-10 rounded-lg text-smoke-400 hover:text-gold-500 hover:bg-smoke-700/50 transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-smoke-800 relative"
        aria-label="Notifications"
      >
        <i name="bell" class="w-5 h-5"></i>
        @if (notificationsBadge() && notificationsBadge()! > 0) {
          <span
            class="flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-xs font-bold text-white absolute -right-1 -top-1"
          >
            {{ notificationsBadge()! > 99 ? '99+' : notificationsBadge() }}
          </span>
        }
      </button>
    </nav>
  `,
})
export class DesktopTopTabsComponent {
  readonly notificationsBadge = input<number>(0);
  readonly notificationsClick = output<void>();
}

/**
 * Desktop Top Tab Item Component
 * Individual tab item for desktop top navigation
 *
 * Supports two modes:
 * 1. Route mode: Uses routerLink for navigation
 * 2. Click mode: Emits clicked event (for modals, etc.)
 */
@Component({
  selector: 'ui-desktop-top-tab-item',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective],
  template: `
    @if (route()) {
      <!-- Route mode: Navigation -->
      <a
        [routerLink]="route()"
        [routerLinkActive]="'active'"
        [routerLinkActiveOptions]="{ exact: exact() }"
        [class]="tabClasses()"
        #rla="routerLinkActive"
      >
        <div class="flex items-center gap-2.5">
          <!-- Icon (if provided) -->
          @if (icon()) {
            <i [name]="icon()!" class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"></i>
          }

          <!-- Label -->
          <span class="font-semibold text-sm">{{ label() }}</span>

          <!-- Badge (if provided) -->
          @if (badge() && badge()! > 0) {
            <span
              class="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-xs font-bold text-smoke-950"
            >
              {{ badge()! > 99 ? '99+' : badge() }}
            </span>
          }
        </div>

        <!-- Active indicator glow -->
        @if (rla.isActive) {
          <div
            class="absolute -bottom-2 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-gold-500 to-transparent shadow-lg shadow-gold-500/50"
          ></div>
        }
      </a>
    } @else {
      <!-- Click mode: Button -->
      <button
        type="button"
        (click)="clicked.emit()"
        [class]="tabClasses()"
      >
        <div class="flex items-center gap-2.5">
          <!-- Icon (if provided) -->
          @if (icon()) {
            <i [name]="icon()!" class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"></i>
          }

          <!-- Label -->
          <span class="font-semibold text-sm">{{ label() }}</span>

          <!-- Badge (if provided) -->
          @if (badge() && badge()! > 0) {
            <span
              class="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-xs font-bold text-smoke-950"
            >
              {{ badge()! > 99 ? '99+' : badge() }}
            </span>
          }
        </div>
      </button>
    }
  `,
})
export class DesktopTopTabItemComponent {
  readonly label = input<string>('');
  readonly route = input<string | null>(null);
  readonly icon = input<IconName | undefined>(undefined);
  readonly badge = input<number | undefined>(undefined);
  readonly exact = input<boolean>(false);

  // Output for click mode
  readonly clicked = output<void>();

  readonly tabClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'group relative flex items-center px-6 h-full',
      'text-smoke-400 transition-all duration-300',
      'hover:text-smoke-100 hover:bg-smoke-700/50',
      'active:scale-98',
      'rounded-lg mx-1',
      // Active state handled by routerLinkActive
      '[&.active]:text-gold-500',
      '[&.active]:bg-smoke-700/30',
      '[&.active]:shadow-lg',
      '[&.active]:shadow-gold-500/10'
    );
  });
}
