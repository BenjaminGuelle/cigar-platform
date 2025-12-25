import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar';
import { ActionButtonComponent } from '../action-button';
import { LogoComponent } from '../logo';
import clsx from 'clsx';

/**
 * Context Sidebar Component (Desktop Only)
 * Displays a vertical stack of context avatars for quick context switching
 * Inspired by Slack/Discord's server/workspace switcher
 *
 * Layout:
 * ┌────┐
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
  selector: 'ui-context-sidebar',
  standalone: true,
  imports: [CommonModule, AvatarComponent, ActionButtonComponent, LogoComponent],
  template: `
    <aside
      class="hidden md:flex fixed left-0 top-0 z-50 h-screen w-18 flex-col items-center gap-3 bg-smoke-800 border-r border-smoke-700 py-4"
    >
      <!-- Logo - Branding -->
      <div class="mb-2">
        <ui-logo variant="compact" size="md" />
      </div>

      <!-- Divider -->
      <div class="w-10 h-px bg-smoke-600"></div>

      <!-- Solo Context (User Avatar) -->
      <button
        type="button"
        (click)="contextSelected.emit({ type: 'solo', id: null })"
        [class]="getAvatarButtonClasses('solo')"
        [attr.aria-label]="'Switch to solo context'"
      >
        <div [class]="getAvatarWrapperClasses(activeContextType() === 'solo')">
          <ui-avatar [user]="user()" size="md" />
        </div>
      </button>

      <!-- Divider -->
      <div class="w-10 h-px bg-smoke-600"></div>

      <!-- Club Contexts -->
      @for (club of clubs(); track club.id) {
        <button
          type="button"
          (click)="contextSelected.emit({ type: 'club', id: club.id, club: club })"
          [class]="getAvatarButtonClasses('club', club.id)"
          [attr.aria-label]="'Switch to ' + club.name"
        >
          <div [class]="getAvatarWrapperClasses(activeContextType() === 'club' && activeClubId() === club.id)">
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
export class ContextSidebarComponent {
  // Inputs
  readonly user = input<any | null>(null); // TODO: Replace with UserDto
  readonly clubs = input<any[]>([]); // TODO: Replace with ClubDto[]
  readonly activeContextType = input<'solo' | 'club'>('solo');
  readonly activeClubId = input<string | null>(null);

  // Outputs
  readonly contextSelected = output<{ type: 'solo' | 'club'; id: string | null; club?: any }>();
  readonly createJoinClub = output<void>();

  /**
   * Get dynamic classes for avatar button based on active state
   */
  getAvatarButtonClasses(type: 'solo' | 'club', clubId?: string): string {
    return clsx(
      'relative group flex items-center justify-center h-12 w-12',
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
      'relative',
      isActive && 'ring-2 ring-gold-500 rounded-full'
    );
  }
}
