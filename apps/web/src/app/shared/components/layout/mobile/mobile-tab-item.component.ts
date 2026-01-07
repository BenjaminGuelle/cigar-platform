import { Component, input, output, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconDirective, type IconName } from '@cigar-platform/shared/ui';
import clsx from 'clsx';

/**
 * Mobile Tab Item Component
 * Individual tab item with iOS-style animations and active state
 *
 * Supports two modes:
 * 1. Route mode: Uses routerLink for navigation
 * 2. Click mode: Emits clicked event (for modals, etc.)
 */
@Component({
  selector: 'app-mobile-tab-item',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective],
  template: `
    @if (route()) {
      <!-- Route mode: Navigation -->
      <a
        [routerLink]="route()"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: exact() }"
        [class]="itemClasses()"
      >
        <div [class]="pillClasses()"></div>

        <div class="relative z-10 flex items-center justify-center">
          <i
            [name]="icon()"
            class="h-6 w-6 transition-all duration-200 ease-out group-active:scale-90 text-smoke-300 group-[.active]:text-gold-500"
          ></i>

          @if (badge() && badge()! > 0) {
            <span
              class="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-error-500/30 animate-pulse"
            >
              {{ badge()! > 99 ? '99+' : badge() }}
            </span>
          }
        </div>

        @if (label()) {
          <span [class]="labelClasses()">
            {{ label() }}
          </span>
        }
      </a>
    } @else {
      <!-- Click mode: Button -->
      <button type="button" (click)="clicked.emit()" [class]="itemClasses()">
        <div [class]="pillClasses()"></div>

        <div class="relative z-10 flex items-center justify-center">
          <i
            [name]="icon()"
            class="h-6 w-6 transition-all duration-200 ease-out group-active:scale-90 text-smoke-300 group-[.active]:text-gold-500"
          ></i>

          @if (badge() && badge()! > 0) {
            <span
              class="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-error-500/30 animate-pulse"
            >
              {{ badge()! > 99 ? '99+' : badge() }}
            </span>
          }
        </div>

        @if (label()) {
          <span [class]="labelClasses()">
            {{ label() }}
          </span>
        }
      </button>
    }
  `,
})
export class MobileTabItemComponent {
  readonly icon = input.required<IconName>();
  readonly label = input<string>('');
  readonly route = input<string | null>(null);
  readonly exact = input<boolean>(false);
  readonly badge = input<number | null>(null);

  // Output for click mode
  readonly clicked = output<void>();

  readonly itemClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'group relative flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-16',
      'text-smoke-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
      'active:scale-95',
      '[&.active]:text-gold-500'
    );
  });

  readonly pillClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'absolute inset-x-2 inset-y-1 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
      'opacity-0 scale-75 bg-gold-500/10',
      'group-[.active]:opacity-100 group-[.active]:scale-100'
    );
  });

  readonly labelClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'relative z-10 text-[10px] font-semibold transition-all duration-300',
      'group-[.active]:scale-105'
    );
  });
}