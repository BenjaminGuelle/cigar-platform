import { Component, computed, Signal, input } from '@angular/core';
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
  imports: [CommonModule, RouterModule],
  template: `
    <nav
      class="hidden md:flex fixed top-0 left-18 right-0 z-40 h-14 items-center gap-1 bg-smoke-900 border-b border-smoke-700 px-6"
    >
      <ng-content />
    </nav>
  `,
})
export class DesktopTopTabsComponent {}

/**
 * Desktop Top Tab Item Component
 * Individual tab item for desktop top navigation
 */
@Component({
  selector: 'ui-desktop-top-tab-item',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective],
  template: `
    <a
      [routerLink]="route()"
      [routerLinkActive]="'active'"
      [routerLinkActiveOptions]="{ exact: exact() }"
      [class]="tabClasses()"
      #rla="routerLinkActive"
    >
      <!-- Icon (if provided) -->
      @if (icon()) {
        <i [name]="icon()!" class="h-4 w-4"></i>
      }

      <!-- Label -->
      <span class="font-medium">{{ label() }}</span>

      <!-- Badge (if provided) -->
      @if (badge() && badge()! > 0) {
        <span
          class="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-xs font-bold text-smoke-950"
        >
          {{ badge()! > 99 ? '99+' : badge() }}
        </span>
      }

      <!-- Active indicator -->
      @if (rla.isActive) {
        <div
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500"
        ></div>
      }
    </a>
  `,
})
export class DesktopTopTabItemComponent {
  readonly label = input<string>('');
  readonly route = input<string>('');
  readonly icon = input<IconName | undefined>(undefined);
  readonly badge = input<number | undefined>(undefined);
  readonly exact = input<boolean>(false);

  readonly tabClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'relative flex items-center gap-2 px-4 h-full',
      'text-sm text-smoke-300 transition-colors duration-200',
      'hover:text-smoke-100 hover:bg-smoke-800',
      'active:scale-95',
      // Active state handled by routerLinkActive
      '[&.active]:text-gold-500'
    );
  });
}
