import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContextStore } from '../../../core/stores/context.store';
import { injectClubStore } from '../../../core/stores/club.store';
import type {
  ClubMemberResponseDto,
  ClubJoinRequestResponseDto,
  ClubBanResponseDto,
} from '@cigar-platform/types';
import { ToastService } from '../../../core/services';
import {
  PageHeaderComponent,
  PageSectionComponent,
  ButtonComponent,
} from '@cigar-platform/shared/ui';
import { MemberItemComponent } from '../../../shared/components/member-item/member-item.component';
import { BannedMemberItemComponent } from '../../../shared/components/banned-member-item/banned-member-item.component';
import { ConfirmationModalComponent, type ConfirmationResult } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

/**
 * Club Members Page (Internal)
 *
 * Route: /membres
 * Accessible: Only when context = club
 * Context-driven: Uses ContextStore.clubId
 *
 * Features:
 * - View club members list
 * - Admin: Update member roles
 * - Admin: Remove/ban members
 * - View pending join requests (admin)
 *
 * Architecture: ALL STARS ⭐
 * - Template in separate .html file
 * - Clean separation of concerns
 * - NOT nested under /club/:id
 * - Slack/Discord style navigation
 * - Context selects the page, page never decides context
 */
@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    PageSectionComponent,
    ButtonComponent,
    MemberItemComponent,
    BannedMemberItemComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './members.page.html',
})
export class MembersPage {
  contextStore = inject(ContextStore);
  #router = inject(Router);
  #clubStore = injectClubStore();
  #toastService = inject(ToastService);

  // Route params
  readonly clubId = signal<string>('');

  // Tab state
  readonly activeTab = signal<'members' | 'requests' | 'banned'>('members');

  // Confirmation modals state
  readonly showRemoveConfirm = signal<boolean>(false);
  readonly showBanConfirm = signal<boolean>(false);
  readonly memberToAction = signal<ClubMemberResponseDto | null>(null);

  // Reactive queries with getter pattern
  readonly membersQuery = this.#clubStore.getClubMembers(() => this.clubId());
  // Only fetch join requests if user can manage club
  readonly joinRequestsQuery = this.#clubStore.getJoinRequests(
    () => this.clubId(),
    () => this.contextStore.canManageClub()
  );
  // Only fetch banned members if user can manage club
  readonly bannedMembersQuery = this.#clubStore.getBannedMembers(
    () => this.clubId(),
    () => this.contextStore.canManageClub()
  );

  // Computed states - extract signals from queries with fallbacks
  readonly loading = this.membersQuery.loading;
  readonly error = this.membersQuery.error;
  readonly members = computed(() => this.membersQuery.data() ?? []);
  readonly joinRequestsLoading = this.joinRequestsQuery.loading;
  readonly joinRequests = computed(() => this.joinRequestsQuery.data() ?? []);
  readonly bannedMembersLoading = this.bannedMembersQuery.loading;
  readonly bannedMembers = computed(() => this.bannedMembersQuery.data() ?? []);

  // Computed - Sorted members (Owner > Admin > Member)
  readonly sortedMembers = computed(() => {
    const members = this.members();
    const roleOrder = { owner: 1, admin: 2, member: 3 };

    return [...members].sort((a, b) => {
      const roleA = roleOrder[a.role as keyof typeof roleOrder] ?? 99;
      const roleB = roleOrder[b.role as keyof typeof roleOrder] ?? 99;
      return roleA - roleB;
    });
  });

  // Computed - Join requests
  readonly pendingRequestsCount = computed(() => this.joinRequests().length);
  readonly hasPendingRequests = computed(() => this.pendingRequestsCount() > 0);

  // Computed - Banned members
  readonly bannedMembersCount = computed(() => this.bannedMembers().length);
  readonly hasBannedMembers = computed(() => this.bannedMembersCount() > 0);

  // Exposed mutation loading states for UI locking
  readonly removingMember = this.#clubStore.removeMember.loading;
  readonly banningMember = this.#clubStore.banMember.loading;
  readonly updatingJoinRequest = this.#clubStore.updateJoinRequest.loading;

  constructor() {
    // Update club ID from context
    effect(() => {
      const context = this.contextStore.context();
      if (context.type === 'club' && context.clubId) {
        this.clubId.set(context.clubId);
      } else {
        this.clubId.set('');
      }
    });

    // Guard: Redirect to home if context switches to solo
    // Members page is only accessible in club context
    effect(() => {
      const context = this.contextStore.context();
      if (context.type === 'solo') {
        void this.#router.navigate(['/']);
      }
    });
  }

  /**
   * Promote member to admin
   */
  async onPromoteMember(member: ClubMemberResponseDto): Promise<void> {
    const clubId = this.clubId();
    if (!clubId) return;

    await this.#clubStore.updateMemberRole.mutate({
      clubId,
      userId: member.userId,
      role: 'admin',
    });

    if (this.#clubStore.updateMemberRole.error()) {
      this.#toastService.error('Échec de la promotion');
      return;
    }

    this.#toastService.success(`${member.user.displayName} est maintenant admin`);
  }

  /**
   * Demote admin to member
   */
  async onDemoteMember(member: ClubMemberResponseDto): Promise<void> {
    const clubId = this.clubId();
    if (!clubId) return;

    await this.#clubStore.updateMemberRole.mutate({
      clubId,
      userId: member.userId,
      role: 'member',
    });

    if (this.#clubStore.updateMemberRole.error()) {
      this.#toastService.error('Échec de la rétrogradation');
      return;
    }

    this.#toastService.success(`${member.user.displayName} est maintenant membre`);
  }

  /**
   * Remove member from club
   */
  onRemoveMember(member: ClubMemberResponseDto): void {
    this.memberToAction.set(member);
    this.showRemoveConfirm.set(true);
  }

  /**
   * Confirm remove member
   * Locked during mutation to prevent double-clicks
   */
  async onConfirmRemoveMember(): Promise<void> {
    // Lock: Prevent double-click/double-execution
    if (this.#clubStore.removeMember.loading()) return;

    const clubId = this.clubId();
    const member = this.memberToAction();

    if (!clubId || !member) return;

    // Close modal
    this.showRemoveConfirm.set(false);

    await this.#clubStore.removeMember.mutate({
      clubId,
      userId: member.userId,
    });

    if (this.#clubStore.removeMember.error()) {
      this.#toastService.error('Échec de l\'exclusion');
      return;
    }

    this.#toastService.success(`${member.user.displayName} a été retiré du club`);

    // Reset
    this.memberToAction.set(null);
  }

  /**
   * Ban member from club
   */
  onBanMember(member: ClubMemberResponseDto): void {
    this.memberToAction.set(member);
    this.showBanConfirm.set(true);
  }

  /**
   * Confirm ban member
   * Locked during mutation to prevent double-clicks
   */
  async onConfirmBanMember(result: ConfirmationResult): Promise<void> {
    // Lock: Prevent double-click/double-execution
    if (this.#clubStore.banMember.loading()) return;

    const clubId = this.clubId();
    const member = this.memberToAction();

    if (!clubId || !member) return;

    // Close modal
    this.showBanConfirm.set(false);

    await this.#clubStore.banMember.mutate({
      clubId,
      userId: member.userId,
      reason: result.reason || undefined,
    });

    if (this.#clubStore.banMember.error()) {
      this.#toastService.error('Échec du bannissement');
      return;
    }

    this.#toastService.success(`${member.user.displayName} a été banni du club`);

    // Reset
    this.memberToAction.set(null);
  }

  /**
   * Approve join request
   * Locked during mutation to prevent double-clicks
   */
  async onApproveRequest(request: ClubJoinRequestResponseDto): Promise<void> {
    // Lock: Prevent double-click/double-execution
    if (this.#clubStore.updateJoinRequest.loading()) return;

    const clubId = this.clubId();
    if (!clubId) return;

    await this.#clubStore.updateJoinRequest.mutate({
      clubId,
      requestId: request.id,
      data: { status: 'APPROVED' },
    });

    if (this.#clubStore.updateJoinRequest.error()) {
      this.#toastService.error('Échec de l\'approbation');
      return;
    }

    this.#toastService.success('Demande approuvée avec succès');
  }

  /**
   * Reject join request
   * Locked during mutation to prevent double-clicks
   */
  async onRejectRequest(request: ClubJoinRequestResponseDto): Promise<void> {
    // Lock: Prevent double-click/double-execution
    if (this.#clubStore.updateJoinRequest.loading()) return;

    const clubId = this.clubId();
    if (!clubId) return;

    // Call store mutation
    await this.#clubStore.updateJoinRequest.mutate({
      clubId,
      requestId: request.id,
      data: { status: 'REJECTED' },
    });

    // Handle UX
    if (this.#clubStore.updateJoinRequest.error()) {
      this.#toastService.error('Échec du rejet');
      return;
    }

    this.#toastService.success('Demande rejetée');
  }

  /**
   * Unban member
   */
  async onUnbanMember(ban: ClubBanResponseDto): Promise<void> {
    const clubId = this.clubId();
    if (!clubId) return;

    await this.#clubStore.unbanMember.mutate({
      clubId,
      userId: ban.userId,
    });

    if (this.#clubStore.unbanMember.error()) {
      this.#toastService.error('Échec du débannissement');
      return;
    }

    this.#toastService.success(`${ban.user.displayName} a été débanni`);
  }

  /**
   * Switch active tab
   */
  setActiveTab(tab: 'members' | 'requests' | 'banned'): void {
    this.activeTab.set(tab);
  }

  /**
   * Navigate to explore page
   */
  goToExplore(): void {
    void this.#router.navigate(['/explore']);
  }

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
