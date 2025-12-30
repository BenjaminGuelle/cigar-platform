import { Component, ChangeDetectionStrategy, input, output, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { ClubMemberResponseDto } from '@cigar-platform/types';
import { AvatarComponent, type AvatarUser, ButtonComponent, IconDirective } from '@cigar-platform/shared/ui';
import { ManageMemberMenuComponent } from '../manage-member-menu/manage-member-menu.component';

/**
 * Member Item Component (ALL STARS ⭐)
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
 * - Transfer ownership support
 *
 * @example
 * ```html
 * <app-member-item
 *   [member]="member"
 *   [canManage]="canManageClub()"
 *   [isOwner]="isOwner()"
 *   [currentUserId]="currentUserId()"
 *   (promote)="onPromote($event)"
 *   (demote)="onDemote($event)"
 *   (transferOwnership)="onTransferOwnership($event)"
 *   (remove)="onRemove($event)"
 *   (ban)="onBan($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-member-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, AvatarComponent, ButtonComponent, IconDirective, ManageMemberMenuComponent],
  template: `
    <div class="flex items-center justify-between py-3 px-4 hover:bg-white/[0.02] transition-colors group">
      <!-- Left: Avatar + Name/Badge + Date -->
      <div class="flex items-center gap-4">
        <a
          [routerLink]="['/user', '@' + member().user.username]"
          class="flex items-center gap-4 group/link">
          <ui-avatar
            [user]="avatarUser()"
            size="sm" />

          <div class="flex flex-col gap-0.5">
            <!-- Name + Badge on same line -->
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-white group-hover/link:text-gold-400 group-hover/link:underline transition-colors">
                {{ member().user.displayName }}
              </span>
              <span
                [class]="roleClass()"
                class="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border font-medium">
                {{ roleLabel() }}
              </span>
            </div>
            <!-- Date -->
            <span class="text-xs text-smoke-300">
              Membre depuis {{ formatDate(member().joinedAt) }}
            </span>
          </div>
        </a>
      </div>

      <!-- Right: Manage Button (centered vertically) -->
      @if (canManage() && member().role !== 'owner') {
        <div class="relative">
          <ui-button
            (clicked)="toggleMenu($event)"
            variant="ghost"
            size="icon"
            customClass="text-smoke-400 hover:text-smoke-200">
            <i name="ellipsis-vertical" class="w-5 h-5"></i>
            <span class="sr-only">Gérer le membre</span>
          </ui-button>

          <!-- Manage Member Menu -->
          <app-manage-member-menu
            [member]="member()"
            [isOwner]="isOwner()"
            [isCurrentUser]="isCurrentUser()"
            [isOpen]="menuOpen()"
            (close)="menuOpen.set(false)"
            (promote)="promote.emit($event)"
            (demote)="demote.emit($event)"
            (transferOwnership)="transferOwnership.emit($event)"
            (remove)="remove.emit($event)"
            (ban)="ban.emit($event)"
          />
        </div>
      }
    </div>
  `,
})
export class MemberItemComponent {
  // Inputs
  readonly member = input.required<ClubMemberResponseDto>();
  readonly canManage = input<boolean>(false);
  readonly isOwner = input<boolean>(false);
  readonly currentUserId = input<string>('');

  // Outputs
  readonly promote = output<ClubMemberResponseDto>();
  readonly demote = output<ClubMemberResponseDto>();
  readonly transferOwnership = output<ClubMemberResponseDto>();
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

  // Computed: Is this member the current user?
  readonly isCurrentUser = computed(() => {
    return this.member().userId === this.currentUserId();
  });

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
