import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ClubBanResponseDto } from '@cigar-platform/types';
import { AvatarComponent, type AvatarUser } from '@cigar-platform/shared/ui';
import { IconDirective } from '@cigar-platform/shared/ui';

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
  imports: [CommonModule, AvatarComponent, IconDirective],
  template: `
    <div class="flex items-start justify-between py-4 px-4 hover:bg-white/[0.02] transition-colors group">
      <!-- Left: Avatar + Info -->
      <div class="flex items-start gap-4 flex-1 min-w-0">
        <ui-avatar
          [user]="bannedUser()"
          size="sm" />

        <div class="flex flex-col flex-1 min-w-0">
          <!-- Name -->
          <span class="text-sm font-medium text-white">
            {{ ban().user.displayName }}
          </span>

          <!-- Reason (if provided) -->
          @if (ban().reason) {
            <p class="text-xs text-smoke-400 mt-1 italic">
              "{{ ban().reason }}"
            </p>
          }

          <!-- Ban Details -->
          <div class="text-xs text-smoke-500 mt-2 space-y-0.5">
            <div>Banni le {{ formatDate(ban().createdAt) }}</div>
            <div>Par {{ ban().bannedByUser.displayName }}</div>
          </div>
        </div>
      </div>

      <!-- Right: Unban Button -->
      @if (canManage()) {
        <button
          (click)="unban.emit(ban())"
          type="button"
          class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-white/5 border border-orange-500/20 hover:border-orange-500/40">
          <i name="lock" class="w-3.5 h-3.5"></i>
          Débannir
        </button>
      }
    </div>
  `,
})
export class BannedMemberItemComponent {
  // Inputs
  readonly ban = input.required<ClubBanResponseDto>();
  readonly canManage = input<boolean>(false);

  // Outputs
  readonly unban = output<ClubBanResponseDto>();

  // Computed: User for Avatar component (type-safe)
  readonly bannedUser = computed((): AvatarUser => ({
    id: this.ban().user.id,
    displayName: this.ban().user.displayName,
    avatarUrl: this.ban().user.avatarUrl,
  }));

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
