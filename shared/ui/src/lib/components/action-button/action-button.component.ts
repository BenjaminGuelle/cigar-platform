import { Component, input, output, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import clsx from 'clsx';

export type ActionButtonSize = 'sm' | 'md' | 'lg';
export type ActionButtonVariant = 'dashed' | 'solid';

/**
 * Action Button Component
 * Reusable circular button with rotation animation
 * Used for primary actions (create, add, etc.)
 *
 * Features:
 * - Dashed border that rotates on hover
 * - Icon stays fixed while border rotates
 * - Multiple sizes (sm, md, lg)
 * - Consistent animations across the app
 *
 * Usage:
 * <ui-action-button
 *   size="md"
 *   icon="plus"
 *   (clicked)="onCreate()"
 * />
 */
@Component({
  selector: 'ui-action-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="clicked.emit()"
      [class]="buttonClasses()"
      [attr.aria-label]="ariaLabel() || 'Action button'"
    >
      @if (icon() === 'plus') {
        <svg
          xmlns="http://www.w3.org/2000/svg"
          [attr.width]="iconSize()"
          [attr.height]="iconSize()"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-transform duration-300 ease-out group-hover:-rotate-90"
        >
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
      }
    </button>
  `,
})
export class ActionButtonComponent {
  // Inputs
  readonly size = input<ActionButtonSize>('md');
  readonly icon = input<'plus'>('plus');
  readonly variant = input<ActionButtonVariant>('dashed');
  readonly ariaLabel = input<string | undefined>(undefined);

  // Outputs
  readonly clicked = output<void>();

  /**
   * Icon size based on button size
   */
  readonly iconSize: Signal<number> = computed<number>(() => {
    const sizeMap = { sm: 16, md: 20, lg: 24 };
    return sizeMap[this.size()];
  });

  /**
   * Button classes with size variations
   */
  readonly buttonClasses: Signal<string> = computed<string>(() => {
    const sizeClasses = {
      sm: 'h-10 w-10',
      md: 'h-12 w-12',
      lg: 'h-14 w-14',
    };

    return clsx(
      'group relative flex items-center justify-center rounded-full',
      'bg-smoke-700 border-2 text-smoke-400',
      'transition-all duration-300 ease-out',
      'hover:border-gold-500 hover:text-gold-500 hover:bg-smoke-600 hover:rotate-90',
      'active:scale-95',
      'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-smoke-900',
      sizeClasses[this.size()],
      this.variant() === 'dashed' ? 'border-dashed border-smoke-600' : 'border-solid border-smoke-600'
    );
  });
}
