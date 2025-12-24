import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import clsx from 'clsx';
import { IconDirective } from '../../directives/icon';

/**
 * Sub-Sidebar Component
 * Nested sidebar that slides in next to main sidebar
 * Used for admin menus, settings, or other sub-navigation
 *
 * Features:
 * - Slides in from left when active
 * - Fixed width matching expanded main sidebar (w-70)
 * - Close button (X) to manually close
 * - Smart auto-close: stays open while navigating within same context
 * - Smooth transitions with duration-500 ease-in-out
 * - Lower z-index (z-30) than main sidebar (z-40) for smooth layering effect
 *
 * @example
 * <ui-sub-sidebar
 *   [isActive]="showAdminMenu()"
 *   [title]="'Administration'"
 *   (close)="closeAdminMenu()"
 * >
 *   <ui-sidebar-nav-item ... />
 * </ui-sub-sidebar>
 */
@Component({
  selector: 'ui-sub-sidebar',
  standalone: true,
  imports: [CommonModule, IconDirective],
  template: `
    <aside
      class="fixed left-22 top-0 z-30 flex flex-col h-screen bg-smoke-700 border-r border-smoke-700 transition-all duration-500 ease-in-out"
      [class]="sidebarClasses()"
    >
      <!-- Header with title and close button -->
      <div class="relative flex items-center justify-between border-b border-smoke-700 px-4 pt-4 pb-5">
        @if (title()) {
          <h2 class="text-sm font-semibold text-smoke-50">
            {{ title() }}
          </h2>
        }

        <button
          (click)="handleClose()"
          class="ml-auto flex items-center justify-center rounded-lg p-2 text-smoke-400 transition-all duration-200 hover:bg-smoke-800 hover:text-smoke-50"
          type="button"
          aria-label="Close"
        >
          <i
            name="x"
            class="h-5 w-5"
          ></i>
        </button>
      </div>

      <!-- Navigation content -->
      <nav class="flex-1 p-3 overflow-y-auto border-t border-smoke-600">
        <ng-content />
      </nav>

      <!-- Footer (optional) -->
      @if (hasFooter()) {
        <div class="border-t border-smoke-600 p-4">
          <ng-content select="[slot=footer]" />
        </div>
      }
    </aside>
  `,
})
export class SubSidebarComponent {
  readonly isActive = input<boolean>(false);
  readonly title = input<string | null>(null);
  readonly hasFooter = input<boolean>(false);

  readonly close = output<void>();

  readonly sidebarClasses = (): string => {
    return clsx(
      'w-70',
      this.isActive()
        ? 'translate-x-0 opacity-100'
        : '-translate-x-full opacity-0 pointer-events-none'
    );
  };

  handleClose(): void {
    this.close.emit();
  }
}