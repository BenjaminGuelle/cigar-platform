import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { User, ClubResponseDto } from '@cigar-platform/types';
import { AvatarComponent, IconDirective } from '@cigar-platform/shared/ui';

/**
 * Mobile Header Component
 * Top header with safe area support for PWA (iPhone notch)
 *
 * Layout:
 * - Left: Context avatar (user/club) → navigates to /profile
 * - Center: Context name + chevron → opens context switcher
 * - Right: Settings (on /profile/**) or Notifications (elsewhere)
 *
 * Hidden on desktop (≥768px)
 */
@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent, IconDirective],
  template: `
    <header
      class="fixed left-0 right-0 top-0 z-40 md:hidden"
      style="padding-top: env(safe-area-inset-top)"
    >
      <!-- Subtle gradient blur backdrop -->
      <div
        class="pointer-events-none absolute inset-0 -bottom-6"
        style="
          background: linear-gradient(
            to bottom,
            rgba(23, 23, 23, 0.4) 0%,
            rgba(23, 23, 23, 0.2) 40%,
            rgba(23, 23, 23, 0) 100%
          );
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          mask-image: linear-gradient(to bottom, black 0%, black 40%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 0%, black 40%, transparent 100%);
        "
      ></div>

      <!-- Floating elements container -->
      <div class="relative flex items-center justify-between px-4 pb-2 pt-4">
        <!-- Left: Avatar → Profile -->
        <button
          type="button"
          (click)="onAvatarClick()"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-smoke-600/40 bg-smoke-800/70 shadow-xl backdrop-blur-md transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-500"
          aria-label="Aller au profil"
        >
          @if (contextType() === 'solo') {
            <ui-avatar [user]="user()" size="md" />
          } @else if (contextType() === 'club' && clubAvatar()) {
            <ui-avatar [club]="clubAvatar()" size="md" />
          }
        </button>

        <!-- Center: Context Name + Chevron → Switch Context -->
        <button
          type="button"
          (click)="contextClick.emit()"
          class="flex items-center gap-2 rounded-full border border-smoke-600/40 bg-smoke-800/70 px-5 py-2.5 shadow-xl backdrop-blur-md transition-all duration-200 active:scale-95 hover:bg-smoke-700/70 focus:outline-none focus:ring-2 focus:ring-gold-500"
          aria-label="Changer de contexte"
        >
          <span class="max-w-40 truncate font-display text-lg font-extrabold text-smoke-50">
            {{ contextDisplayName() }}
          </span>
          <i name="chevron-down" class="h-4 w-4 text-smoke-50"></i>
        </button>

        <!-- Right: Notifications or Settings -->
        @if (isOnProfileRoute()) {
          <!-- Settings on /profile/** -->
          <button
            type="button"
            (click)="settingsClick.emit()"
            class="relative flex h-11 w-11 items-center justify-center rounded-full border border-smoke-600/40 bg-smoke-800/70 text-smoke-200 shadow-xl backdrop-blur-md transition-all duration-150 hover:bg-smoke-700/70 hover:text-gold-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-500"
            aria-label="Paramètres"
          >
            <i name="settings" class="h-5 w-5"></i>
          </button>
        } @else {
          <!-- Notifications elsewhere -->
          <button
            type="button"
            (click)="notificationsClick.emit()"
            class="relative flex h-11 w-11 items-center justify-center rounded-full border border-smoke-600/40 bg-smoke-800/70 text-smoke-200 shadow-xl backdrop-blur-md transition-all duration-150 hover:bg-smoke-700/70 hover:text-gold-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-500"
            aria-label="Notifications"
          >
            <i name="bell" class="h-5 w-5"></i>
            @if (notificationsBadge() > 0) {
              <span
                class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-xs font-bold text-white shadow-lg"
              >
                {{ notificationsBadge() > 99 ? '99+' : notificationsBadge() }}
              </span>
            }
          </button>
        }
      </div>
    </header>
  `,
})
export class MobileHeaderComponent {
  readonly #router = inject(Router);

  // Context information
  readonly contextType = input<'solo' | 'club'>('solo');
  readonly user = input<User | null>(null);
  readonly club = input<ClubResponseDto | null>(null);

  // Notifications
  readonly notificationsBadge = input<number>(0);

  // Events
  readonly contextClick = output<void>();
  readonly notificationsClick = output<void>();
  readonly settingsClick = output<void>();

  // Route detection for right icon
  readonly #currentUrl = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.#router.url)
    ),
    { initialValue: this.#router.url }
  );

  readonly isOnProfileRoute = computed(() => {
    const url = this.#currentUrl();
    return url.startsWith('/profile');
  });

  // Map ClubResponseDto to AvatarClub format (imageUrl: undefined → null)
  readonly clubAvatar = computed(() => {
    const c = this.club();
    if (!c) return null;
    return { id: c.id, name: c.name, imageUrl: c.imageUrl ?? null };
  });

  // Display name based on context
  readonly contextDisplayName = computed(() => {
    if (this.contextType() === 'club') {
      return this.club()?.name ?? 'Club';
    }
    // Solo context: displayName with fallback to username
    const currentUser = this.user();
    return currentUser?.displayName || currentUser?.username || 'Mon compte';
  });

  onAvatarClick(): void {
    void this.#router.navigate(['/profile']);
  }
}