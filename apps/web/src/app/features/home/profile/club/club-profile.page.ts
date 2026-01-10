import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ContextStore } from '../../../../core/stores/context.store';
import { injectClubStore } from '../../../../core/stores/club.store';
import { injectTastingStore } from '../../../../core/stores/tasting.store';
import { ToastService } from '../../../../core/services';
import { LayoutService } from '../../../../core/layout';
import {
  ButtonComponent,
  TooltipDirective,
  SkeletonProfilePageComponent,
  ModalComponent,
  TastingsGridComponent,
} from '@cigar-platform/shared/ui';

/**
 * Club Profile Page (Unified)
 *
 * Handles BOTH modes:
 * - Context-driven: /profile (when context = club)
 * - URL-driven: /club/:slug (public profile)
 *
 * Architecture:
 * - Single component, unified data source
 * - Uses isMember() to differentiate display (like isOwner for user)
 * - Instagram-like tasting grid with infinite scroll
 */
@Component({
  selector: 'app-club-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonComponent,
    TooltipDirective,
    SkeletonProfilePageComponent,
    ModalComponent,
    TastingsGridComponent,
  ],
  templateUrl: './club-profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubProfilePage {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #contextStore = inject(ContextStore);
  readonly #clubStore = injectClubStore();
  readonly #tastingStore = injectTastingStore();
  readonly #toastService = inject(ToastService);
  readonly #layout = inject(LayoutService);

  // Layout
  readonly isDesktop = this.#layout.isDesktop;

  // URL param (null if context-driven mode)
  readonly slugParam = toSignal(
    this.#route.paramMap.pipe(map((p) => p.get('slug'))),
    { initialValue: null }
  );

  // Mode detection: context-driven vs URL-driven
  readonly isUrlMode = computed(() => this.slugParam() !== null);

  // Target club identifier (from URL or context)
  readonly targetClubId = computed(() => {
    const urlSlug = this.slugParam();
    if (urlSlug) {
      return urlSlug.startsWith('#') ? urlSlug.slice(1) : urlSlug;
    }
    const context = this.#contextStore.context();
    return context.type === 'club' ? context.clubId ?? '' : '';
  });

  // Query for club data (backend accepts both ID and slug)
  readonly clubQuery = this.#clubStore.getClubById(() => this.targetClubId());

  // Computed states from query
  readonly loading = this.clubQuery.loading;
  readonly error = this.clubQuery.error;
  readonly club = this.clubQuery.data;

  // isMember: true if current user is a member of this club
  readonly isMember = computed(() => {
    const clubData = this.club();
    if (!clubData) return false;
    return clubData.currentUserStatus === 'member';
  });

  // Club computed values
  readonly name = computed(() => this.club()?.name ?? '');
  readonly slug = computed(() => this.club()?.slug ?? '');
  readonly description = computed(() => this.club()?.description ?? null);
  readonly imageUrl = computed(() => this.club()?.imageUrl ?? null);
  readonly initial = computed(() => this.name().charAt(0).toUpperCase() || 'C');

  // Stats (from API)
  readonly memberCount = computed(() => this.club()?.memberCount ?? 0);
  readonly tastingCount = computed(() => this.club()?.stats?.tastingCount ?? 0);
  readonly brandCount = computed(() => this.club()?.stats?.brandCount ?? 0);

  // Favorite cigars (from club tastings)
  readonly hasTastings = computed(() => this.tastingCount() > 0);
  readonly topCigars = computed(() => {
    const cigars = this.club()?.stats?.topCigars ?? [];
    return cigars.length > 0 ? cigars.join(', ') : '';
  });

  // Join status (for non-members)
  readonly isPending = computed(() => this.club()?.currentUserStatus === 'pending');
  readonly isBanned = computed(() => this.club()?.currentUserStatus === 'banned');
  readonly shouldShowJoinButton = computed(() => {
    const status = this.club()?.currentUserStatus;
    return !status || status === 'rejected';
  });

  // Join state (from store mutations)
  readonly joiningClub = this.#clubStore.joinClub.loading;
  readonly joiningByCode = this.#clubStore.joinByCode.loading;

  // Join button label (based on club visibility)
  readonly joinButtonLabel = computed(() => {
    return this.club()?.visibility === 'PUBLIC' ? 'Rejoindre' : "Demander l'accès";
  });

  // Dynamic join status label (handles all states)
  readonly joinStatusLabel = computed(() => {
    if (this.joiningClub()) return 'En cours...';
    if (this.isPending()) return 'Demande en attente';
    if (this.isBanned()) return 'Accès restreint';
    return this.joinButtonLabel();
  });

  // Dynamic join button variant (handles all states)
  readonly joinButtonVariant = computed(() => {
    if (this.isPending()) return 'outline' as const;
    if (this.isBanned()) return 'destructive' as const;
    return 'primary' as const;
  });

  // Invite code modal state
  readonly showInviteCodeModal = signal(false);
  readonly inviteCode = signal('');

  // Club tastings query (uses club ID from loaded club data)
  readonly clubTastingsQuery = this.#tastingStore.getTastingsByClub(() => this.club()?.id ?? '');
  readonly tastings = computed(() => this.clubTastingsQuery.data() ?? []);
  readonly tastingsLoading = computed(() => this.clubTastingsQuery.loading());

  /**
   * Copy club profile link to clipboard
   */
  async copyClubLink(): Promise<void> {
    const clubSlug = this.club()?.slug ?? '';
    if (!clubSlug) return;

    const url = `${window.location.origin}/club/${clubSlug}`;

    try {
      await navigator.clipboard.writeText(url);
      this.#toastService.success('Lien copié dans le presse-papier');
    } catch {
      this.#toastService.error('Impossible de copier le lien');
    }
  }

  /**
   * Join club or request access
   */
  async onJoinClub(): Promise<void> {
    const currentClub = this.club();
    if (!currentClub) return;

    await this.#clubStore.joinClub.mutate({
      clubId: currentClub.id,
      data: {},
    });

    if (this.#clubStore.joinClub.error()) {
      this.#toastService.error("Échec de la demande d'adhésion");
      return;
    }

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

    await this.#clubStore.joinByCode.mutate({ code });

    if (this.#clubStore.joinByCode.error()) {
      this.#toastService.error("Code d'invitation invalide ou expiré");
      return;
    }

    this.#toastService.success('Vous avez rejoint le club avec succès');
    this.closeInviteCodeModal();
  }

  /**
   * Navigate to tasting detail page
   */
  onTastingClick(tastingId: string): void {
    void this.#router.navigate(['/tastings', tastingId]);
  }

  /**
   * Navigate to create new tasting
   */
  navigateToCreateTasting(): void {
    void this.#router.navigate(['/tasting/new']);
  }
}