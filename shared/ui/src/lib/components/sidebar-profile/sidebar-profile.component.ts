import { Component, input } from '@angular/core';
import { User } from '@cigar-platform/types';
import { AvatarComponent } from '../avatar';

/**
 * Sidebar Profile Component
 * User profile display for sidebar footer with collapse/expand animation
 *
 * Features:
 * - Avatar always visible (fixed width)
 * - User name fades and collapses smoothly
 * - Synced with sidebar expanded state
 *
 * @example
 * <ui-sidebar-profile
 *   [user]="currentUser()"
 *   [isExpanded]="sidebar.isExpanded()"
 * />
 */
@Component({
  selector: 'ui-sidebar-profile',
  standalone: true,
  imports: [AvatarComponent],
  template: `
    <div class="group relative flex items-center rounded-lg px-3 py-2.5 text-smoke-300">
      <div class="flex w-11 shrink-0 items-center justify-center">
        <ui-avatar [user]="user()" size="md" />
      </div>

      <div
        class="min-w-0 transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap"
        [class.opacity-100]="isExpanded()"
        [class.max-w-[200px]]="isExpanded()"
        [class.opacity-0]="!isExpanded()"
        [class.max-w-0]="!isExpanded()"
        [class.pointer-events-none]="!isExpanded()"
      >
        <p class="truncate text-sm font-semibold text-smoke-50">
          {{ user().displayName || 'User' }}
        </p>
      </div>
    </div>
  `,
})
export class SidebarProfileComponent {
  user = input.required<User>();
  isExpanded = input<boolean>(true);
}