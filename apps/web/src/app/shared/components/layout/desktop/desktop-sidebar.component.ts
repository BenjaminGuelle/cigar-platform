import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AvatarComponent,
  ActionButtonComponent,
  LogoComponent,
} from '@cigar-platform/shared/ui';
import clsx from 'clsx';

/**
 * Desktop Sidebar Component
 * Displays a vertical stack of context avatars for quick context switching
 * Inspired by Slack/Discord's server/workspace switcher
 *
 * Layout:
 * ┌────┐
 * │Logo│ <- App branding
 * ├────┤
 * │ Me │ <- Solo context (always visible)
 * ├────┤
 * │ C1 │ <- Club 1
 * │ C2 │ <- Club 2
 * │ C3 │ <- Club 3
 * │ +  │ <- Create/Join club
 * └────┘
 *
 * Hidden on mobile (< 768px)
 */
@Component({
  selector: 'app-desktop-sidebar',
  standalone: true,
  imports: [CommonModule, AvatarComponent, ActionButtonComponent, LogoComponent],
  template: `
    <aside
      class="fixed left-0 top-0 z-50 hidden h-screen w-18 flex-col items-center gap-3 border-r border-smoke-700 bg-smoke-800 py-4 md:flex"
    >
      <!-- Logo - Branding -->
      <div class="mb-2">
        <ui-logo variant="compact" size="md" />
      </div>

      <!-- Divider -->
      <div class="h-px w-10 bg-smoke-600"></div>

      <!-- Solo Context (User Avatar) -->
      <button
        type="button"
        (click)="contextSelected.emit({ type: 'solo', id: null })"
        [class]="getAvatarButtonClasses()"
        [attr.aria-label]="'Switch to solo context'"
        [title]="getSoloTooltip()"
      >
        <div [class]="getAvatarWrapperClasses(activeContextType() === 'solo')">
          <ui-avatar [user]="user()" size="md" />
        </div>
      </button>

      <!-- Divider -->
      <div class="h-px w-10 bg-smoke-600"></div>

      <!-- Club Contexts -->
      @for (club of clubs(); track club.id) {
        <button
          type="button"
          (click)="contextSelected.emit({ type: 'club', id: club.id, club: club })"
          [class]="getAvatarButtonClasses()"
          [attr.aria-label]="'Switch to ' + club.name"
          [title]="club.name"
        >
          <div
            [class]="
              getAvatarWrapperClasses(
                activeContextType() === 'club' && activeClubId() === club.id
              )
            "
          >
            <ui-avatar [club]="club" size="md" />
          </div>
        </button>
      }

      <!-- Create/Join Club Button -->
      <ui-action-button
        size="md"
        icon="plus"
        ariaLabel="Create or join club"
        (clicked)="createJoinClub.emit()"
      />
    </aside>
  `,
})
export class DesktopSidebarComponent {
  // Inputs
  readonly user = input<any | null>(null);
  readonly clubs = input<any[]>([]);
  readonly activeContextType = input<'solo' | 'club'>('solo');
  readonly activeClubId = input<string | null>(null);

  // Outputs
  readonly contextSelected = output<{
    type: 'solo' | 'club';
    id: string | null;
    club?: any;
  }>();
  readonly createJoinClub = output<void>();

  /**
   * Get dynamic classes for avatar button
   */
  getAvatarButtonClasses(): string {
    return clsx(
      'group relative flex h-12 w-12 items-center justify-center',
      'transition-all duration-200',
      'focus:outline-none',
      'active:scale-95'
    );
  }

  /**
   * Get dynamic classes for avatar wrapper with circular ring when active
   */
  getAvatarWrapperClasses(isActive: boolean): string {
    return clsx(
      'relative rounded-full transition-all duration-200',
      isActive
        ? 'scale-105 shadow-lg shadow-gold-500/20 ring-2 ring-gold-500 ring-offset-2 ring-offset-smoke-800'
        : 'opacity-60 hover:scale-105 hover:opacity-100'
    );
  }

  /**
   * Get tooltip text for solo context
   */
  getSoloTooltip(): string {
    const userName = this.user()?.displayName || 'Mon compte';
    return `${userName} (Personnel)`;
  }
}