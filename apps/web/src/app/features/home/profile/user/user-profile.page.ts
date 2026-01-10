import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { injectUserStore, injectTastingStore } from '../../../../core/stores';
import { ToastService } from '../../../../core/services';
import { LayoutService } from '../../../../core/layout';
import {
  AvatarComponent,
  ButtonComponent,
  TooltipDirective,
  SkeletonProfilePageComponent,
  TastingsGridComponent,
} from '@cigar-platform/shared/ui';

/**
 * User Profile Page (Unified)
 *
 * Handles BOTH modes:
 * - Context-driven: /profile (when context = solo)
 * - URL-driven: /user/:username (public profile)
 *
 * Architecture:
 * - Single component, single data source (getTastingsByUser)
 * - Backend handles owner vs public logic automatically
 * - Instagram-like tasting grid with infinite scroll pagination
 */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AvatarComponent,
    ButtonComponent,
    TooltipDirective,
    SkeletonProfilePageComponent,
    TastingsGridComponent,
  ],
  templateUrl: './user-profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfilePage {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #userStore = injectUserStore();
  readonly #tastingStore = injectTastingStore();
  readonly #toastService = inject(ToastService);
  readonly #layout = inject(LayoutService);

  // Layout signals
  readonly isDesktop = this.#layout.isDesktop;

  // Current authenticated user
  readonly currentUser = this.#userStore.currentUser.data;

  // URL param (null if context-driven mode)
  readonly usernameParam = toSignal(
    this.#route.paramMap.pipe(map((p) => p.get('username'))),
    { initialValue: null }
  );

  // Mode detection: context-driven vs URL-driven
  readonly isUrlMode = computed(() => this.usernameParam() !== null);

  // Target username (from URL or current user)
  readonly targetUsername = computed(() => {
    const urlUsername = this.usernameParam();
    if (urlUsername) {
      // Remove @ prefix if present
      return urlUsername.startsWith('@') ? urlUsername.slice(1) : urlUsername;
    }
    return this.currentUser()?.username ?? '';
  });

  // Query for target user's public profile (works for both modes)
  readonly profileQuery = this.#userStore.getUserPublicProfile(() => this.targetUsername());

  // Computed states from query
  readonly loading = this.profileQuery.loading;
  readonly error = this.profileQuery.error;
  readonly profile = this.profileQuery.data;

  // isOwner: true if viewing own profile
  readonly isOwner = computed(() => {
    const current = this.currentUser();
    const target = this.targetUsername();
    if (!current || !target) return false;
    return current.username === target;
  });

  // Profile computed values
  readonly displayName = computed(() => this.profile()?.displayName ?? '');
  readonly username = computed(() => this.profile()?.username ?? '');
  readonly bio = computed(() => this.profile()?.bio ?? null);
  readonly avatarUrl = computed(() => this.profile()?.avatarUrl ?? null);

  // Stats computed values
  readonly evaluationCount = computed(() => this.profile()?.stats?.evaluationCount ?? 0);
  readonly brandCount = computed(() => this.profile()?.stats?.brandCount ?? 0);

  // Top cigars (from 5 best rated tastings)
  readonly hasTastings = computed(() => this.evaluationCount() > 0);
  readonly topCigars = computed(() => {
    const cigars = this.profile()?.stats?.topCigars;
    if (!cigars || cigars.length === 0) return null;
    return cigars.join(', ');
  });

  // User's clubs query (uses profile ID as identifier)
  readonly userClubsQuery = this.#userStore.getUserClubs(
    () => this.targetUsername(),
    () => 5 // Limit to 5 clubs for display
  );
  readonly userClubs = computed(() => this.userClubsQuery.data() ?? []);

  // User object for AvatarComponent
  readonly avatarUser = computed(() => {
    const p = this.profile();
    if (!p) return null;
    return {
      id: p.id,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl ?? null,
    };
  });

  // Profile URL for sharing
  readonly profileUrl = computed(() => {
    const uname = this.username();
    if (!uname) return '';
    return `${window.location.origin}/user/@${uname}`;
  });

  // Unified tastings query (backend handles owner vs public logic)
  readonly userTastingsQuery = this.#tastingStore.getTastingsByUser(() => this.targetUsername());

  // All tastings (paginated, accumulated across pages)
  readonly tastings = computed(() => this.userTastingsQuery.allTastings());
  readonly tastingsLoading = computed(() => this.userTastingsQuery.query.loading());

  // Infinite scroll (works for both owner and non-owner)
  readonly hasMoreTastings = computed(() => this.userTastingsQuery.hasMore());
  readonly loadingMore = computed(() => this.userTastingsQuery.loadingMore());

  /**
   * Copy profile link to clipboard
   */
  async copyProfileLink(): Promise<void> {
    const url = this.profileUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this.#toastService.success('Lien copié dans le presse-papier');
    } catch {
      this.#toastService.error('Impossible de copier le lien');
    }
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