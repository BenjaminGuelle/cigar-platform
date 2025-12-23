import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import clsx from 'clsx';
import { IconDirective } from '../../directives/icon';

/**
 * Sub-Sidebar Component
 * Nested sidebar that slides in to replace main sidebar (Instagram-style)
 * Used for admin menus, settings, or other sub-navigation
 *
 * Features:
 * - Slides in from left when active
 * - Fixed width matching expanded main sidebar
 * - Back button to return to main sidebar
 * - Smooth transitions
 *
 * @example
 * <ui-sub-sidebar
 *   [isActive]="showAdminMenu()"
 *   [title]="'Administration'"
 *   (back)="closeAdminMenu()"
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
      class="fixed left-22 top-0 z-50 flex flex-col h-screen bg-smoke-700 border-r border-smoke-700 transition-all duration-500 ease-in-out"
      [class]="sidebarClasses()"
    >
      <!-- Header with back button -->
      <div class="relative flex items-center border-b border-smoke-700 px-4 py-4">
        <button
          (click)="handleBack()"
          class="flex items-center gap-3 text-smoke-300 hover:text-smoke-50 transition-colors duration-200"
          type="button"
          aria-label="Back to main menu"
        >
          <i
            name="chevron-left"
            class="h-5 w-5"
          ></i>
          <span class="text-sm font-medium">Retour</span>
        </button>

        @if (title()) {
          <h2 class="ml-auto text-sm font-semibold text-smoke-50">
            {{ title() }}
          </h2>
        }
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

  readonly back = output<void>();

  readonly sidebarClasses = (): string => {
    return clsx(
      'w-70',
      this.isActive()
        ? 'translate-x-0 opacity-100'
        : '-translate-x-full opacity-0 pointer-events-none'
    );
  };

  handleBack(): void {
    this.back.emit();
  }
}