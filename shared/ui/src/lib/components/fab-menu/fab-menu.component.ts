import { Component, input, output, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective, type IconName } from '../../directives/icon';
import clsx from 'clsx';

export interface FabMenuItem {
  icon: IconName;
  label: string;
  action: string;
  show?: boolean; // Optional: control visibility
}

export type FabMenuVariant = 'fixed' | 'inline';

/**
 * FAB Menu Component
 * Floating Action Button with contextual menu
 * Opens a menu with quick actions on click
 *
 * Variants:
 * - fixed: Desktop FAB (fixed bottom-right)
 * - inline: Mobile FAB (relative position, fits in container)
 */
@Component({
  selector: 'ui-fab-menu',
  standalone: true,
  imports: [CommonModule, IconDirective],
  template: `
    <!-- Backdrop -->
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-40 md:bg-transparent animate-fade-in"
        (click)="close.emit()"
      ></div>
    }

    <!-- FAB Button -->
    <button
      type="button"
      (click)="toggleMenu()"
      [class]="fabClasses()"
      [attr.aria-label]="ariaLabel() || 'Quick actions'"
      [attr.aria-expanded]="isOpen()"
    >
      <i
        [name]="isOpen() ? 'x' : 'plus'"
        [class]="iconClasses()"
      ></i>
    </button>

    <!-- Menu Items -->
    @if (isOpen()) {
      <div [class]="menuClasses()">
        @for (item of visibleItems(); track item.action) {
          <button
            type="button"
            (click)="onItemClick(item.action)"
            class="group flex items-center gap-3 bg-smoke-800 hover:bg-smoke-700 text-smoke-50 rounded-full px-4 py-3 shadow-lg border border-smoke-700 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <div class="flex items-center justify-center h-10 w-10 rounded-full bg-smoke-700 group-hover:bg-gold-500 transition-colors duration-200">
              <i [name]="item.icon" class="w-5 h-5 group-hover:text-smoke-950"></i>
            </div>
            <span class="font-medium pr-2">{{ item.label }}</span>
          </button>
        }
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-scale-in {
      animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  `],
})
export class FabMenuComponent {
  readonly isOpen = input<boolean>(false);
  readonly items = input<FabMenuItem[]>([]);
  readonly variant = input<FabMenuVariant>('fixed');
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly toggle = output<void>();
  readonly close = output<void>();
  readonly itemClicked = output<string>();

  /**
   * Filter items to show only visible ones
   */
  readonly visibleItems: Signal<FabMenuItem[]> = computed(() => {
    return this.items().filter(item => item.show !== false);
  });

  readonly fabClasses: Signal<string> = computed(() => {
    const isFixed = this.variant() === 'fixed';
    const isInline = this.variant() === 'inline';

    return clsx(
      'group flex items-center justify-center rounded-full',
      'bg-smoke-700 border-2 border-dashed border-smoke-600 text-smoke-400',
      'transition-all duration-300 ease-out',
      'hover:border-gold-500 hover:text-gold-500 hover:bg-smoke-600 hover:rotate-90',
      'active:scale-95',
      'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-smoke-900',
      this.isOpen() && 'rotate-90 border-gold-500 text-gold-500 bg-smoke-600',
      // Variant-specific classes
      isFixed && 'fixed bottom-8 right-8 z-50 h-14 w-14',
      isInline && 'relative h-9 w-9'
    );
  });

  readonly iconClasses: Signal<string> = computed(() => {
    const isInline = this.variant() === 'inline';

    return clsx(
      'transition-transform duration-300 ease-out',
      'group-hover:-rotate-90',
      this.isOpen() && '-rotate-90',
      isInline ? 'w-5 h-5' : 'w-6 h-6'
    );
  });

  readonly menuClasses: Signal<string> = computed(() => {
    const isFixed = this.variant() === 'fixed';
    const isInline = this.variant() === 'inline';

    return clsx(
      'z-50 flex flex-col-reverse gap-3 animate-scale-in',
      isFixed && 'fixed bottom-24 right-8',
      isInline && 'absolute top-full right-0 mt-2'
    );
  });

  toggleMenu(): void {
    this.toggle.emit();
  }

  onItemClick(action: string): void {
    this.itemClicked.emit(action);
    this.close.emit();
  }
}
