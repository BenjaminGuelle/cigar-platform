import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProfilePageVariant = 'user' | 'club';

/**
 * Profile Page Skeleton
 *
 * Full page skeleton for profile pages (user/club).
 * Matches the actual profile page structure for smooth loading UX.
 *
 * Structure:
 * - Header: Avatar + Name + Stats
 * - Bio placeholder
 * - Clubs row (user variant only)
 * - Divider
 * - Tastings grid (9 cards)
 *
 * @example
 * <ui-skeleton-profile-page variant="user" />
 * <ui-skeleton-profile-page variant="club" />
 */
@Component({
  selector: 'ui-skeleton-profile-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Header Section -->
    <div class="flex items-start gap-4">
      <!-- Avatar (only for non-owner view simulation) -->
      @if (showAvatar()) {
        <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-smoke-600 animate-pulse flex-shrink-0"></div>
      }

      <!-- Name + Stats -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-4">
          <div>
            <!-- Display Name -->
            <div class="h-8 md:h-9 w-40 md:w-56 bg-smoke-600 animate-pulse rounded"></div>
            <!-- Username -->
            <div class="h-4 w-24 bg-smoke-600 animate-pulse rounded mt-2"></div>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4">
            <!-- Stat 1 -->
            <div class="text-left">
              <div class="h-5 w-8 bg-smoke-600 animate-pulse rounded"></div>
              <div class="h-3 w-16 bg-smoke-600 animate-pulse rounded mt-1"></div>
            </div>
            <!-- Stat 2 -->
            <div class="text-left">
              <div class="h-5 w-8 bg-smoke-600 animate-pulse rounded"></div>
              <div class="h-3 w-14 bg-smoke-600 animate-pulse rounded mt-1"></div>
            </div>
          </div>
        </div>

        <!-- Bio -->
        <div class="mt-3 space-y-2">
          <div class="h-4 w-full max-w-md bg-smoke-600 animate-pulse rounded"></div>
          <div class="h-4 w-3/4 max-w-sm bg-smoke-600 animate-pulse rounded"></div>
        </div>

        <!-- Favorite cigars line -->
        <div class="mt-3">
          <div class="h-4 w-64 bg-smoke-600 animate-pulse rounded"></div>
        </div>
      </div>
    </div>

    <!-- Clubs Row (user variant only) -->
    @if (variant() === 'user') {
      <div class="mt-4 flex items-center gap-3">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="w-10 h-10 rounded-full bg-smoke-600 animate-pulse flex-shrink-0"></div>
        }
      </div>
    }

    <!-- Divider -->
    <div class="mt-6 h-px bg-smoke-600"></div>

    <!-- Tastings Grid -->
    <div class="mt-6 grid grid-cols-3 md:grid-cols-5 gap-2">
      @for (i of [1, 2, 3, 4, 5, 6, 7, 8, 9]; track i) {
        <div class="aspect-4/5 rounded-sm bg-smoke-600 animate-pulse"></div>
      }
    </div>
  `,
})
export class SkeletonProfilePageComponent {
  /** Profile page variant */
  readonly variant = input<ProfilePageVariant>('user');

  /** Show avatar (for public profile view) */
  readonly showAvatar = input<boolean>(false);
}