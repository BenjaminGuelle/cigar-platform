import { Component, computed, Signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import clsx from 'clsx';
import { IconDirective, type IconName } from '@cigar-platform/shared/ui';

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
  selector: 'app-desktop-top-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective],
  template: `
    <nav
      class="fixed left-18 right-0 top-0 z-40 hidden h-18 items-center gap-2 border-b border-smoke-700/50 bg-smoke-800 px-8 shadow-lg shadow-smoke-950/20 md:flex"
    >
      <!-- Tabs -->
      <div class="flex flex-1 items-center gap-2">
        <ng-content />
      </div>

      <!-- Notifications Button -->
      <button
        type="button"
        (click)="notificationsClick.emit()"
        class="relative flex h-10 w-10 items-center justify-center rounded-lg text-smoke-400 transition-all duration-150 hover:bg-smoke-700/50 hover:text-gold-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-smoke-800"
        aria-label="Notifications"
      >
        <i name="bell" class="h-5 w-5"></i>
        @if (notificationsBadge() && notificationsBadge()! > 0) {
          <span
            class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-xs font-bold text-white"
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
  selector: 'app-desktop-top-tab-item',
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
            <i
              [name]="icon()!"
              class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
            ></i>
          }

          <!-- Label -->
          <span class="text-sm font-semibold">{{ label() }}</span>

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
      <button type="button" (click)="clicked.emit()" [class]="tabClasses()">
        <div class="flex items-center gap-2.5">
          <!-- Icon (if provided) -->
          @if (icon()) {
            <i
              [name]="icon()!"
              class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
            ></i>
          }

          <!-- Label -->
          <span class="text-sm font-semibold">{{ label() }}</span>

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
      'group relative mx-1 flex h-full items-center rounded-lg px-6',
      'text-smoke-400 transition-all duration-300',
      'hover:bg-smoke-700/50 hover:text-smoke-100',
      'active:scale-98',
      // Active state handled by routerLinkActive
      '[&.active]:bg-smoke-700/30',
      '[&.active]:text-gold-500',
      '[&.active]:shadow-lg',
      '[&.active]:shadow-gold-500/10'
    );
  });
}