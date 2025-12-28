import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { injectClubStore } from '../../../core/stores/club.store';
import { ToastService } from '../../../core/services';
import {
  PageHeaderComponent,
  PageSectionComponent,
  ButtonComponent,
  ModalComponent,
} from '@cigar-platform/shared/ui';

/**
 * Club Public Profile Page
 *
 * Route: /club/:id
 * Accessible: Without membership
 *
 * Features:
 * - View public club information
 * - See member count and basic stats
 * - CTA: Join (public clubs) or Request Access (private clubs)
 *
 * Does NOT show:
 * - Private settings (invite code, etc.)
 * - Internal club pages
 * - Member list (members-only feature)
 *
 * Architecture: ALL STARS ⭐
 * - Template in separate .html file
 * - Computed signals (no `!` assertions)
 * - Clean separation of concerns
 */
@Component({
  selector: 'app-club-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    PageSectionComponent,
    ButtonComponent,
    ModalComponent,
  ],
  templateUrl: './club-profile.page.html',
})
export class ClubProfilePage {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #clubStore = injectClubStore();
  #toastService = inject(ToastService);

  // Route params (toSignal pattern - no subscribe)
  readonly clubId = toSignal(
    this.#route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' }
  );

  // Reactive query with getter pattern
  readonly clubQuery = this.#clubStore.getClubById(() => this.clubId());

  // Computed states - extract signals from query
  readonly loading = this.clubQuery.loading;
  readonly error = this.clubQuery.error;
  readonly club = this.clubQuery.data;

  // Joining state (from store mutations)
  readonly joiningClub = this.#clubStore.joinClub.loading;
  readonly joiningByCode = this.#clubStore.joinByCode.loading;

  // Invite code modal
  readonly showInviteCodeModal = signal<boolean>(false);
  readonly inviteCode = signal<string>('');

  readonly memberCount = computed(() => {
    const club = this.club();
    return club?.memberCount ?? 0;
  });

  readonly hasMaxMembers = computed(() => {
    const club = this.club();
    return club?.maxMembers !== null && club?.maxMembers !== undefined;
  });

  readonly maxMembers = computed(() => {
    const club = this.club();
    return club?.maxMembers ?? 0;
  });

  readonly joinButtonLabel = computed(() => {
    const club = this.club();
    return club?.visibility === 'PUBLIC'
      ? 'Rejoindre le club'
      : "Demander l'accès";
  });

  readonly shouldShowJoinButton = computed(() => {
    const club = this.club();
    if (!club) return false;

    // Show join button if:
    // - User has no relationship (NONE)
    // - User was rejected but can re-apply (REJECTED)
    // Hide if: MEMBER, PENDING, or BANNED
    return !club.currentUserStatus || club.currentUserStatus === 'rejected';
  });

  readonly isMember = computed(() => {
    const club = this.club();
    return club?.currentUserStatus === 'member';
  });

  readonly isPending = computed(() => {
    const club = this.club();
    return club?.currentUserStatus === 'pending';
  });

  readonly isRejected = computed(() => {
    const club = this.club();
    return club?.currentUserStatus === 'rejected';
  });

  readonly isBanned = computed(() => {
    const club = this.club();
    return club?.currentUserStatus === 'banned';
  });

  readonly clubTypeLabel = computed(() => {
    const club = this.club();
    return club?.visibility === 'PUBLIC'
      ? 'Club public'
      : 'Club privé sur invitation';
  });

  readonly admissionLabel = computed(() => {
    const club = this.club();
    return club?.autoApproveMembers
      ? 'Admission automatique'
      : 'Les demandes sont examinées par les administrateurs';
  });

  /**
   * Join club or request access
   * - Public clubs with auto-approve: Instant join
   * - Public clubs without auto-approve: Creates pending request
   * - Private clubs: Creates pending request (requires approval)
   */
  async onJoinClub(): Promise<void> {
    const currentClub = this.club();
    if (!currentClub) return;

    // Store mutation handles API call + invalidation
    await this.#clubStore.joinClub.mutate({
      clubId: currentClub.id,
      data: {},
    });

    // Component handles UX only
    if (this.#clubStore.joinClub.error()) {
      this.#toastService.error('Échec de la demande d\'adhésion');
      return;
    }

    // Success toast based on club type
    const isPublic = currentClub.visibility === 'PUBLIC';
    const autoApprove = currentClub.autoApproveMembers ?? false;

    if (isPublic && autoApprove) {
      this.#toastService.success(`Vous avez rejoint ${currentClub.name}`);
    } else {
      this.#toastService.success('Demande envoyée avec succès');
    }
  }

  /**
   * Open invite code modal
   */
  openInviteCodeModal(): void {
    this.showInviteCodeModal.set(true);
    this.inviteCode.set('');
  }

  /**
   * Close invite code modal
   */
  closeInviteCodeModal(): void {
    this.showInviteCodeModal.set(false);
    this.inviteCode.set('');
  }

  /**
   * Join club by invite code
   */
  async onJoinByCode(): Promise<void> {
    const code = this.inviteCode().trim();
    if (!code) return;

    // Store mutation handles API call + invalidation
    await this.#clubStore.joinByCode.mutate({ code });

    // Component handles UX only
    if (this.#clubStore.joinByCode.error()) {
      this.#toastService.error('Code d\'invitation invalide ou expiré');
      return;
    }

    // Success
    this.#toastService.success('Vous avez rejoint le club avec succès');
    this.closeInviteCodeModal();
  }

  /**
   * Navigate back to explore page
   */
  goBackToExplore(): void {
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
