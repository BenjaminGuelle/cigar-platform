import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { ClubBanResponseDto } from '@cigar-platform/types';
import { AvatarComponent, type AvatarUser, ButtonComponent } from '@cigar-platform/shared/ui';

/**
 * Banned Member Item Component
 *
 * Compact row-style display for banned club members with:
 * - User avatar and display name
 * - Ban reason (if provided)
 * - Ban date and who banned
 * - Unban button (shown for admins)
 *
 * Features:
 * - OnPush change detection for performance
 * - Signal inputs/outputs (Angular 17+)
 * - Hover effects for interactive elements
 * - Compact design (row > card)
 *
 * @example
 * ```html
 * <app-banned-member-item
 *   [ban]="ban"
 *   [canManage]="canManageClub()"
 *   (unban)="onUnbanMember($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-banned-member-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, AvatarComponent, ButtonComponent],
  template: `
    <div class="flex items-center justify-between py-3 px-4 hover:bg-white/[0.02] transition-colors group">
      <!-- Left: Avatar + Info -->
      <div class="flex items-center gap-4 flex-1 min-w-0">
        <a
          [routerLink]="['/user', ban().user.id]"
          class="flex items-center gap-4 group/link flex-1 min-w-0">
          <ui-avatar
            [user]="bannedUser()"
            size="sm" />

          <div class="flex flex-col gap-0.5 flex-1 min-w-0">
            <!-- Name + Badge -->
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-white group-hover/link:text-gold-400 group-hover/link:underline transition-colors">
                {{ ban().user.displayName }}
              </span>
              <span class="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border font-medium bg-red-500/10 border-red-500/20 text-red-400">
                Banni
              </span>
            </div>

            <!-- Reason (if provided) -->
            @if (ban().reason) {
              <p class="text-xs text-smoke-400 italic line-clamp-1">
                "{{ ban().reason }}"
              </p>
            }

            <!-- Ban Details -->
            <span class="text-xs text-smoke-300">
              Le {{ formatDate(ban().createdAt) }} par {{ ban().bannedByUser.displayName }}
            </span>
          </div>
        </a>
      </div>

      <!-- Right: Unban Button -->
      @if (canManage()) {
        <div class="shrink-0">
          <ui-button
            (clicked)="unban.emit(ban())"
            variant="secondary"
            size="sm"
            [loading]="isUnbanning()"
            [disabled]="isUnbanning()">
            Débannir
          </ui-button>
        </div>
      }
    </div>
  `,
})
export class BannedMemberItemComponent {
  // Inputs
  readonly ban = input.required<ClubBanResponseDto>();
  readonly canManage = input<boolean>(false);
  readonly unbanningUserId = input<string | null>(null);

  // Outputs
  readonly unban = output<ClubBanResponseDto>();

  // Computed: User for Avatar component (type-safe)
  readonly bannedUser = computed((): AvatarUser => ({
    id: this.ban().user.id,
    displayName: this.ban().user.displayName,
    avatarUrl: this.ban().user.avatarUrl,
  }));

  // Computed: Loading state for unban button
  readonly isUnbanning = computed(() => {
    return this.unbanningUserId() === this.ban().userId;
  });

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
