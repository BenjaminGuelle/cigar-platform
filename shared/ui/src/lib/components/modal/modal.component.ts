import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective } from '../../directives/icon';
import clsx from 'clsx';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalPosition = 'center' | 'right' | 'bottom-right';

/**
 * Modal Component
 * Reusable modal/dialog with backdrop and animations
 *
 * Features:
 * - Responsive: Full screen on mobile, centered or right-aligned on desktop
 * - Backdrop click to close
 * - ESC key to close
 * - Smooth animations
 * - Multiple sizes and positions
 * - Light backdrop option for popover mode
 */
@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule, IconDirective],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        [class]="backdropClasses()"
        (click)="onBackdropClick()"
        [attr.aria-hidden]="true"
      ></div>

      <!-- Modal Container -->
      <div
        [class]="containerClasses()"
        [attr.role]="'dialog'"
        [attr.aria-modal]="true"
        [attr.aria-labelledby]="'modal-title'"
      >
        <div
          [class]="modalClasses()"
          (click)="$event.stopPropagation()"
        >
          <!-- Close Button -->
          @if (showCloseButton()) {
            <button
              type="button"
              (click)="close.emit()"
              class="absolute top-4 right-4 p-2 rounded-full text-smoke-400 hover:text-smoke-200 hover:bg-smoke-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
              aria-label="Close modal"
            >
              <i name="x" class="w-5 h-5"></i>
            </button>
          }

          <!-- Content Slot -->
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-slide-up {
      animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .animate-slide-right {
      animation: slideInRight 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    }
  `],
})
export class ModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly size = input<ModalSize>('md');
  readonly position = input<ModalPosition>('center');
  readonly showCloseButton = input<boolean>(true);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);

  readonly close = output<void>();

  constructor() {
    // Handle ESC key
    effect(() => {
      if (this.isOpen() && this.closeOnEscape()) {
        const handleEscape = (event: KeyboardEvent): void => {
          if (event.key === 'Escape') {
            this.close.emit();
          }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
      return;
    });
  }

  backdropClasses(): string {
    const pos = this.position();
    const isPopover = pos === 'right' || pos === 'bottom-right';

    return clsx(
      'fixed inset-0 z-50 animate-fade-in',
      isPopover
        ? 'bg-smoke-950/80 backdrop-blur-sm md:bg-smoke-950/20 md:backdrop-blur-none' // Mobile: standard, Desktop: light
        : 'bg-smoke-950/80 backdrop-blur-sm'   // Standard modal backdrop
    );
  }

  containerClasses(): string {
    const pos = this.position();

    return clsx(
      'fixed z-50',
      // Center position (default modal)
      pos === 'center' && 'inset-0 flex items-center justify-center p-4',
      // Right position (popover from sidebar)
      pos === 'right' && 'inset-0 flex items-center justify-center p-4 md:inset-y-0 md:left-18 md:items-start md:pt-4 md:pr-4 md:justify-start',
      // Bottom-right position (popover from FAB)
      pos === 'bottom-right' && 'inset-0 flex items-center justify-center p-4 md:bottom-24 md:right-8 md:top-auto md:left-auto md:items-end md:justify-end md:p-0'
    );
  }

  modalClasses(): string {
    const sizeMap = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    };

    const pos = this.position();

    return clsx(
      'relative w-full bg-smoke-800 rounded-2xl shadow-2xl',
      'border border-smoke-700',
      'p-6',
      // Animation based on position
      pos === 'right' && 'animate-slide-up md:animate-slide-right',
      pos === 'bottom-right' && 'animate-slide-up',
      pos === 'center' && 'animate-slide-up',
      sizeMap[this.size()]
    );
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }
}
