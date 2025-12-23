import { Component, input, output } from '@angular/core';
import { IconDirective, type IconName } from '../../directives/icon';

export type SidebarActionVariant = 'default' | 'destructive';

/**
 * Sidebar Action Component
 * Button optimized for sidebar footer with collapse/expand animation
 *
 * Features:
 * - Smooth collapse/expand with sidebar state
 * - Icon always visible (fixed width)
 * - Label fades and collapses smoothly
 * - Destructive variant for logout actions
 *
 * @example
 * <ui-sidebar-action
 *   icon="log-out"
 *   label="Déconnexion"
 *   variant="destructive"
 *   [isExpanded]="sidebar.isExpanded()"
 *   (clicked)="onSignOut()"
 * />
 */
@Component({
  selector: 'ui-sidebar-action',
  standalone: true,
  imports: [IconDirective],
  template: `
    <button
      (click)="handleClick()"
      class="group relative flex w-full items-center rounded-lg px-3 py-2.5 transition-all duration-500 ease-in-out hover:cursor-pointer"
      [class.text-smoke-300]="variant() === 'default'"
      [class.hover:text-smoke-50]="variant() === 'default'"
      [class.text-smoke-300]="variant() === 'destructive'"
      [class.hover:text-error-500]="variant() === 'destructive'"
    >
      <!-- Icon (always visible, fixed width) -->
      <div class="flex w-11 shrink-0 items-center justify-center">
        <i
          [name]="icon()"
          class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
        ></i>
      </div>

      <!-- Label (collapses with sidebar) -->
      <span
        class="text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap"
        [class.opacity-100]="isExpanded()"
        [class.max-w-[200px]]="isExpanded()"
        [class.opacity-0]="!isExpanded()"
        [class.max-w-0]="!isExpanded()"
        [class.pointer-events-none]="!isExpanded()"
      >
        {{ label() }}
      </span>
    </button>
  `,
})
export class SidebarActionComponent {
  icon = input.required<IconName>();
  label = input.required<string>();
  variant = input<SidebarActionVariant>('default');
  isExpanded = input<boolean>(true);

  clicked = output<void>();

  handleClick(): void {
    this.clicked.emit();
  }
}