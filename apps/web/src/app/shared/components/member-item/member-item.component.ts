import { Component, ChangeDetectionStrategy, input, output, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ClubMemberResponseDto } from '@cigar-platform/types';
import { AvatarComponent, type AvatarUser } from '@cigar-platform/shared/ui';
import { IconDirective } from '@cigar-platform/shared/ui';
import { ManageMemberMenuComponent } from '../manage-member-menu/manage-member-menu.component';

/**
 * Member Item Component
 *
 * Compact row-style display for club members with:
 * - User avatar and display name
 * - Role badge (owner/admin/member)
 * - Join date
 * - Manage button (shown on hover for admins)
 *
 * Features:
 * - OnPush change detection for performance
 * - Signal inputs/outputs (Angular 17+)
 * - Hover effects for interactive elements
 * - Compact design (row > card)
 *
 * @example
 * ```html
 * <app-member-item
 *   [member]="member"
 *   [canManage]="canManageClub()"
 *   (manage)="onManageMember($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-member-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AvatarComponent, IconDirective, ManageMemberMenuComponent],
  template: `
    <div class="flex items-center justify-between py-3 px-4 hover:bg-white/[0.02] transition-colors group">
      <!-- Left: Avatar + Name + Date -->
      <div class="flex items-center gap-4">
        <ui-avatar
          [user]="avatarUser()"
          size="sm" />

        <div class="flex flex-col">
          <span class="text-sm font-medium text-white">
            {{ member().user.displayName }}
          </span>
          <span class="text-xs text-smoke-400">
            Membre depuis {{ formatDate(member().joinedAt) }}
          </span>
        </div>
      </div>

      <!-- Right: Badge + Manage Button -->
      <div class="flex items-center gap-2 relative">
        <!-- Role Badge -->
        <span
          [class]="roleClass()"
          class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium">
          {{ roleLabel() }}
        </span>

        <!-- Manage Button (only for admins, not for owners) -->
        @if (canManage() && member().role !== 'owner') {
          <button
            (click)="toggleMenu($event)"
            type="button"
            class="opacity-50 md:opacity-20 md:group-hover:opacity-100 hover:!opacity-100 transition-opacity text-smoke-400 hover:text-white"
            aria-label="Gérer le membre">
            <i name="settings" class="w-4.5 h-4.5"></i>
          </button>

          <!-- Manage Member Menu -->
          <app-manage-member-menu
            [member]="member()"
            [isOpen]="menuOpen()"
            (close)="menuOpen.set(false)"
            (promote)="promote.emit($event)"
            (demote)="demote.emit($event)"
            (remove)="remove.emit($event)"
            (ban)="ban.emit($event)"
          />
        }
      </div>
    </div>
  `,
})
export class MemberItemComponent {
  // Inputs
  readonly member = input.required<ClubMemberResponseDto>();
  readonly canManage = input<boolean>(false);

  // Outputs
  readonly promote = output<ClubMemberResponseDto>();
  readonly demote = output<ClubMemberResponseDto>();
  readonly remove = output<ClubMemberResponseDto>();
  readonly ban = output<ClubMemberResponseDto>();

  // State
  readonly menuOpen = signal<boolean>(false);

  // Computed: User for Avatar component (type-safe)
  readonly avatarUser = computed((): AvatarUser => ({
    id: this.member().user.id,
    displayName: this.member().user.displayName,
    avatarUrl: this.member().user.avatarUrl,
  }));

  // Computed: Role badge classes
  readonly roleClass = computed(() => {
    const role = this.member().role;
    if (role === 'owner') {
      return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    }
    if (role === 'admin') {
      return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
    return 'bg-green-500/10 border-green-500/20 text-green-400';
  });

  // Computed: Role label (translated)
  readonly roleLabel = computed(() => {
    const role = this.member().role;
    if (role === 'owner') return 'Propriétaire';
    if (role === 'admin') return 'Admin';
    return 'Membre';
  });

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Toggle menu open/close
   */
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update(open => !open);
  }

  /**
   * Close menu on click outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Menu will close automatically via click outside handling in ManageMemberMenuComponent
  }
}
