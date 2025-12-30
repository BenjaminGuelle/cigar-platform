import { Component, inject, computed, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectUserStore, UserStore } from '../../../../core/stores';
import {
  IconDirective,
  PageSectionComponent,
} from '@cigar-platform/shared/ui';
import { UserDto } from '@cigar-platform/types';

/**
 * User Profile Private Page
 *
 * Route: /profile (when context = solo)
 * Accessible: Always (user's personal profile)
 *
 * Features:
 * - Display user information (avatar, display name, username, bio)
 * - Show user stats (tastings, clubs, etc.)
 * - Quick action CTAs (create tasting, join club, etc.)
 * - Access to settings via CTA
 *
 * Architecture: ALL STARS ⭐
 * - Template in separate .html file
 * - Clean separation of concerns
 * - Loaded by ProfileContextPage when context = solo
 * - Never shown in public routes (public = user-profile.page)
 */
@Component({
  selector: 'app-user-profile-private',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconDirective,
    PageSectionComponent,
  ],
  templateUrl: './user-profile-private.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfilePrivatePage {
  readonly userStore: UserStore = injectUserStore();
  readonly currentUser: Signal<UserDto | null> = this.userStore.currentUser.data;

  // Computed values
  readonly displayName = computed(() => this.currentUser()?.displayName ?? 'Utilisateur');
  readonly username = computed(() => this.currentUser()?.username ?? '');
  readonly bio = computed(() => this.currentUser()?.bio ?? null);
  readonly avatarUrl = computed(() => this.currentUser()?.avatarUrl ?? null);
  readonly email = computed(() => this.currentUser()?.email ?? '');

  // Stats (TODO: Implement real stats when backend ready)
  readonly tastingsCount = computed(() => 0);
  readonly clubsCount = computed(() => 0);
  readonly reviewsCount = computed(() => 0);

  // Profile URL for sharing
  readonly profileUrl = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return `${window.location.origin}/user/@${user.username}`;
  });

  /**
   * Copy profile link to clipboard
   */
  async copyProfileLink(): Promise<void> {
    const url = this.profileUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      // TODO: Add toast notification
      console.log('Lien copié dans le presse-papier');
    } catch {
      console.error('Impossible de copier le lien');
    }
  }
}
