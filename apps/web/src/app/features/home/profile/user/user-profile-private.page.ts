import { Component, inject, computed, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectUserStore, UserStore } from '../../../../core/stores';
import {
  IconDirective,
  ButtonComponent,
  TooltipDirective,
} from '@cigar-platform/shared/ui';
import {
  ParcoursSectionComponent,
  AromaSignatureSectionComponent,
  TerroirsSectionComponent,
  JournalSectionComponent,
} from '../components';
import { UserDto, UserProfileStatsResponseDto } from '@cigar-platform/types';

/**
 * User Profile Private Page
 *
 * Route: /profile (when context = solo)
 * Accessible: Always (user's personal profile)
 *
 * Features:
 * - Display user information (avatar, display name, username, bio)
 * - Show parcours stats (tastings, brands, terroirs)
 * - Show aroma signature (Premium only)
 * - Show terroirs explored (Premium only)
 * - Show journal (last 3 tastings)
 * - Quick action CTAs
 *
 * Architecture: ALL STARS
 * - Uses profile-stats API for data
 * - Section components for modularity
 */
@Component({
  selector: 'app-user-profile-private',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconDirective,
    ButtonComponent,
    TooltipDirective,
    ParcoursSectionComponent,
    AromaSignatureSectionComponent,
    TerroirsSectionComponent,
    JournalSectionComponent,
  ],
  templateUrl: './user-profile-private.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfilePrivatePage {
  readonly userStore: UserStore = injectUserStore();
  readonly currentUser: Signal<UserDto | null> = this.userStore.currentUser.data;
  readonly profileStats: Signal<UserProfileStatsResponseDto | null> = this.userStore.profileStats.data;
  readonly profileStatsLoading: Signal<boolean> = this.userStore.profileStats.loading;

  // User computed values
  readonly displayName = computed(() => this.currentUser()?.displayName ?? 'Utilisateur');
  readonly username = computed(() => this.currentUser()?.username ?? '');
  readonly bio = computed(() => this.currentUser()?.bio ?? null);

  // Profile Stats computed values
  readonly isPremium = computed(() => this.profileStats()?.isPremium ?? false);
  readonly hasChronicData = computed(() => this.profileStats()?.hasChronicData ?? false);

  // Parcours stats
  readonly tastingCount = computed(() => this.profileStats()?.parcours?.tastingCount ?? 0);
  readonly brandCount = computed(() => this.profileStats()?.parcours?.brandCount ?? 0);
  readonly terroirCount = computed(() => this.profileStats()?.parcours?.terroirCount ?? 0);

  // Aroma signature
  readonly aromaSignature = computed(() => this.profileStats()?.aromaSignature ?? null);

  // Terroirs
  readonly terroirs = computed(() => this.profileStats()?.terroirs ?? null);

  // Journal
  readonly journal = computed(() => this.profileStats()?.journal ?? null);

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
    } catch {
      // TODO: Show error toast
    }
  }
}