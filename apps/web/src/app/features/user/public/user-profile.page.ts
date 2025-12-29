import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { injectUserStore } from '../../../core/stores/user.store';
import {
  PageSectionComponent,
  AvatarComponent,
  TooltipDirective,
} from '@cigar-platform/shared/ui';

/**
 * User Public Profile Page
 *
 * Route: /user/:id
 * Accessible: Public (no auth required)
 *
 * Features:
 * - View user public information (avatar, bio, displayName)
 * - View user statistics (evaluation count, favorite brand, club count)
 * - View user's public clubs (max 6)
 *
 * Privacy:
 * - Only shows public clubs
 * - Respects shareEvaluationsPublicly setting (future: hide evaluations if false)
 *
 * Architecture: ALL STARS ⭐
 * - Template in separate .html file
 * - Computed signals (no `!` assertions)
 * - Clean separation of concerns
 */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    PageSectionComponent,
    AvatarComponent,
    TooltipDirective,
  ],
  templateUrl: './user-profile.page.html',
})
export class UserProfilePage {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #userStore = injectUserStore();

  // Route params (toSignal pattern - no subscribe)
  readonly userId = toSignal(
    this.#route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' }
  );

  // Reactive queries with getter pattern
  readonly profileQuery = this.#userStore.getUserPublicProfile(() => this.userId());
  readonly clubsQuery = this.#userStore.getUserClubs(() => this.userId(), () => 6);

  // Computed states - extract signals from queries
  readonly profileLoading = this.profileQuery.loading;
  readonly profileError = this.profileQuery.error;
  readonly profile = this.profileQuery.data;

  readonly clubsLoading = this.clubsQuery.loading;
  readonly clubs = this.clubsQuery.data;

  // Computed profile fields with safe fallbacks
  readonly displayName = computed(() => this.profile()?.displayName ?? '');
  readonly username = computed(() => this.profile()?.username ?? '');
  readonly visibility = computed(() => this.profile()?.visibility ?? 'PUBLIC');
  readonly avatarUrl = computed(() => this.profile()?.avatarUrl ?? null);
  readonly bio = computed(() => this.profile()?.bio ?? null);
  readonly createdAt = computed(() => this.profile()?.createdAt ?? null);

  // Privacy-aware display name
  // PUBLIC: show displayName (with @username as subtitle)
  // PRIVATE: show only @username
  readonly primaryName = computed(() => {
    const visibility = this.visibility();
    const displayName = this.displayName();
    const username = this.username();

    return visibility === 'PRIVATE' ? `@${username}` : displayName;
  });

  readonly shouldShowUsername = computed(() => this.visibility() === 'PUBLIC');

  // Stats computed
  readonly evaluationCount = computed(() => this.profile()?.stats.evaluationCount ?? 0);
  readonly favoriteBrand = computed(() => this.profile()?.stats.favoriteBrand ?? null);
  readonly clubCount = computed(() => this.profile()?.stats.clubCount ?? 0);

  // User object for avatar component
  readonly user = computed(() => {
    const profile = this.profile();
    if (!profile) return null;
    return {
      id: profile.id,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? null,
    };
  });

  readonly hasClubs = computed(() => {
    const clubs = this.clubs();
    return clubs && clubs.length > 0;
  });

  /**
   * Navigate to club detail page
   */
  navigateToClub(clubId: string): void {
    this.#router.navigate(['/club', clubId]);
  }

  /**
   * Format date helper
   */
  formatMemberSince(date: string | null): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
    }).format(dateObj);
  }
}