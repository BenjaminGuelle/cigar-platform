import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ClubMemberResponseDto } from '@cigar-platform/types';
import { ModalComponent, ButtonComponent } from '@cigar-platform/shared/ui';

/**
 * Manage Member Menu Component (ALL STARS ⭐)
 *
 * Responsive dropdown menu for member management actions
 * - Desktop: Positioned dropdown aligned with trigger
 * - Mobile: Bottom sheet modal
 *
 * Actions:
 * - Promote to admin (if member)
 * - Demote to member (if admin)
 * - Transfer ownership (if owner, can't transfer to self)
 * - Remove from club
 * - Ban from club
 *
 * Architecture:
 * - Uses ui-modal for responsive behavior
 * - Uses ui-button for consistent styling
 * - Left-aligned buttons with compact text
 * - Proper z-index handling
 *
 * @example
 * ```html
 * <app-manage-member-menu
 *   [member]="member()"
 *   [isOwner]="isOwner()"
 *   [isCurrentUser]="member().userId === currentUserId()"
 *   [isOpen]="menuOpen()"
 *   (close)="menuOpen.set(false)"
 *   (promote)="handlePromote($event)"
 *   (demote)="handleDemote($event)"
 *   (transferOwnership)="handleTransferOwnership($event)"
 *   (remove)="handleRemove($event)"
 *   (ban)="handleBan($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-manage-member-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      [position]="'bottom-right'"
      [size]="'sm'"
      [showCloseButton]="false"
      [closeOnBackdrop]="true"
      (close)="handleClose()">

      <!-- Header -->
      <div class="mb-4 pb-4 border-b border-smoke-700">
        <h3 class="text-xl font-display text-smoke-50 mb-2">
          Gérer le membre
        </h3>
        <p class="text-base font-medium text-smoke-100 mb-1">
          {{ member().user.displayName }}
        </p>
        <div class="text-sm text-smoke-300">
          @if (member().role === 'owner') {
            <span class="text-gold-400">Propriétaire</span>
          } @else if (member().role === 'admin') {
            <span class="text-blue-400">Administrateur</span>
          } @else {
            <span>Membre</span>
          }
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-1">

        <!-- Promote to Admin (only for members) -->
        @if (canPromote()) {
          <ui-button
            variant="ghost"
            icon="chevron-up"
            size="sm"
            fullWidth
            customClass="!justify-start cursor-pointer"
            (clicked)="handlePromote()">
            <span class="text-sm">Promouvoir admin</span>
          </ui-button>
        }

        <!-- Demote to Member (only for admins, owner only) -->
        @if (canDemote()) {
          <ui-button
            variant="ghost"
            icon="chevron-down"
            size="sm"
            fullWidth
            customClass="!justify-start cursor-pointer"
            (clicked)="handleDemote()">
            <span class="text-sm">Rétrograder membre</span>
          </ui-button>
        }

        <!-- Transfer Ownership (owner only, can't transfer to self) -->
        @if (canTransferOwnership()) {
          <ui-button
            variant="ghost"
            icon="users"
            size="sm"
            fullWidth
            customClass="!justify-start cursor-pointer"
            (clicked)="handleTransferOwnership()">
            <span class="text-sm text-gold-400">Transférer la propriété</span>
          </ui-button>
        }

        <!-- Divider (only if there are actions above) -->
        @if (canPromote() || canDemote() || canTransferOwnership()) {
          <div class="my-1 border-t border-smoke-700"></div>
        }

        <!-- Remove from Club -->
        <ui-button
          variant="ghost"
          icon="minus"
          size="sm"
          fullWidth
          customClass="!justify-start cursor-pointer"
          (clicked)="handleRemove()">
          <span class="text-sm text-orange-400">Retirer du club</span>
        </ui-button>

        <!-- Ban from Club -->
        <ui-button
          variant="ghost"
          icon="x"
          size="sm"
          fullWidth
          customClass="!justify-start cursor-pointer"
          (clicked)="handleBan()">
          <span class="text-sm text-red-400">Bannir du club</span>
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class ManageMemberMenuComponent {
  // Inputs
  readonly member = input.required<ClubMemberResponseDto>();
  readonly isOwner = input<boolean>(false); // Is the current viewer the owner?
  readonly isCurrentUser = input<boolean>(false); // Is this member the current user?
  readonly isOpen = input<boolean>(false);

  // Outputs
  readonly close = output<void>();
  readonly promote = output<ClubMemberResponseDto>();
  readonly demote = output<ClubMemberResponseDto>();
  readonly transferOwnership = output<ClubMemberResponseDto>();
  readonly remove = output<ClubMemberResponseDto>();
  readonly ban = output<ClubMemberResponseDto>();

  // Computed: Can promote (member → admin, viewer must be owner or admin)
  readonly canPromote = computed(() => {
    return this.member().role === 'member';
  });

  // Computed: Can demote (admin → member, viewer must be owner)
  readonly canDemote = computed(() => {
    return this.member().role === 'admin' && this.isOwner();
  });

  // Computed: Can transfer ownership (viewer is owner, target is not owner, can't transfer to self)
  readonly canTransferOwnership = computed(() => {
    return (
      this.isOwner() &&
      this.member().role !== 'owner' &&
      !this.isCurrentUser()
    );
  });

  /**
   * Handle promote action
   */
  handlePromote(): void {
    this.promote.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle demote action
   */
  handleDemote(): void {
    this.demote.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle transfer ownership action
   */
  handleTransferOwnership(): void {
    this.transferOwnership.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle remove action
   */
  handleRemove(): void {
    this.remove.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle ban action
   */
  handleBan(): void {
    this.ban.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle close
   */
  handleClose(): void {
    this.close.emit();
  }
}
