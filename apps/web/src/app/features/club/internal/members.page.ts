import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContextStore } from '../../../core/stores/context.store';
import { injectClubStore } from '../../../core/stores/club.store';
import type {
  ClubMemberResponseDto,
  ClubJoinRequestResponseDto,
} from '@cigar-platform/types';
import { ToastService } from '../../../core/services';
import {
  PageHeaderComponent,
  PageSectionComponent,
  ButtonComponent,
  MemberCardComponent,
  MemberCardUser,
} from '@cigar-platform/shared/ui';

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
    MemberCardComponent,
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
  readonly activeTab = signal<'members' | 'requests'>('members');

  // Reactive queries with getter pattern
  readonly membersQuery = this.#clubStore.getClubMembers(() => this.clubId());
  // Only fetch join requests if user can manage club
  readonly joinRequestsQuery = this.#clubStore.getJoinRequests(
    () => this.clubId(),
    () => this.contextStore.canManageClub()
  );

  // Computed states - extract signals from queries with fallbacks
  readonly loading = this.membersQuery.loading;
  readonly error = this.membersQuery.error;
  readonly members = computed(() => this.membersQuery.data() ?? []);
  readonly joinRequestsLoading = this.joinRequestsQuery.loading;
  readonly joinRequests = computed(() => this.joinRequestsQuery.data() ?? []);

  // Computed - Members by role
  readonly ownerMembers = computed(() =>
    this.members().filter((m) => m.role === 'owner')
  );

  readonly adminMembers = computed(() =>
    this.members().filter((m) => m.role === 'admin')
  );

  readonly regularMembers = computed(() =>
    this.members().filter((m) => m.role === 'member')
  );

  // Computed - Join requests
  readonly pendingRequestsCount = computed(() => this.joinRequests().length);

  readonly hasPendingRequests = computed(() => this.pendingRequestsCount() > 0);

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
  }

  /**
   * Manage member (update role, remove, ban)
   * Only accessible to club admins
   */
  onManageMember(member: MemberCardUser): void {
    // TODO: Open manage member modal
    console.log('[MembersPage] Manage member:', member);
  }

  /**
   * Approve join request
   */
  async onApproveRequest(request: ClubJoinRequestResponseDto): Promise<void> {
    const clubId = this.clubId();
    if (!clubId) return;

    // Call store mutation
    await this.#clubStore.updateJoinRequest.mutate({
      clubId,
      requestId: request.id,
      data: { status: 'APPROVED' },
    });

    // Handle UX
    if (this.#clubStore.updateJoinRequest.error()) {
      this.#toastService.error('Échec de l\'approbation');
      return;
    }

    this.#toastService.success('Demande approuvée avec succès');
  }

  /**
   * Reject join request
   */
  async onRejectRequest(request: ClubJoinRequestResponseDto): Promise<void> {
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
   * Switch active tab
   */
  setActiveTab(tab: 'members' | 'requests'): void {
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
