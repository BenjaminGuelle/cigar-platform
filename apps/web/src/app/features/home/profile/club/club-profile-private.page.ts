import { Component, inject, computed, signal, effect, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContextStore } from '../../../../core/stores/context.store';
import { injectClubStore } from '../../../../core/stores/club.store';
import {
  IconDirective,
  ButtonComponent,
  TooltipDirective,
  SkeletonProfileComponent,
} from '@cigar-platform/shared/ui';
import {
  ParcoursSectionComponent,
  AromaSignatureSectionComponent,
  TerroirsSectionComponent,
  JournalSectionComponent,
} from '../components';
import type { ClubResponseDto, ClubProfileStatsResponseDto } from '@cigar-platform/types';

/**
 * Club Profile Private Page
 *
 * Route: /profile (when context = club)
 * Accessible: To all club members (member, admin, owner)
 * Context-driven: Uses ContextStore.clubId
 *
 * Features:
 * - Display club information (avatar, name, description)
 * - Show parcours stats (tastings, members, events)
 * - Show aroma signature (from Premium members' chronic data)
 * - Show terroirs explored (from Premium members' chronic data)
 * - Show journal (last 3 tastings shared with club)
 * - Quick action CTAs
 *
 * Architecture: ALL STARS
 * - Uses profile-stats API for data
 * - Section components for modularity
 */
@Component({
  selector: 'app-club-profile-private',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconDirective,
    ButtonComponent,
    TooltipDirective,
    SkeletonProfileComponent,
    ParcoursSectionComponent,
    AromaSignatureSectionComponent,
    TerroirsSectionComponent,
    JournalSectionComponent,
  ],
  templateUrl: './club-profile-private.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubProfilePrivatePage {
  readonly contextStore = inject(ContextStore);
  readonly clubStore = injectClubStore();

  // Context ID
  readonly clubId = signal<string>('');

  // Reactive queries with getter pattern
  readonly clubQuery = this.clubStore.getClubById(() => this.clubId());
  readonly profileStatsQuery = this.clubStore.getClubProfileStats(() => this.clubId());

  // Computed states
  readonly loading = computed(() => this.clubQuery.loading());
  readonly profileStatsLoading = computed(() => this.profileStatsQuery.loading());
  readonly error = this.clubQuery.error;
  readonly club: Signal<ClubResponseDto | null> = this.clubQuery.data;
  readonly profileStats: Signal<ClubProfileStatsResponseDto | null> = this.profileStatsQuery.data;

  // Club basic info
  readonly name = computed(() => this.club()?.name ?? 'Club');
  readonly description = computed(() => this.club()?.description ?? null);
  readonly slug = computed(() => this.club()?.slug ?? '');

  // Profile Stats computed values
  readonly hasChronicData = computed(() => this.profileStats()?.hasChronicData ?? false);
  readonly chronicTastingCount = computed(() => this.profileStats()?.chronicTastingCount ?? 0);

  // Parcours stats
  readonly tastingCount = computed(() => this.profileStats()?.parcours?.tastingCount ?? 0);
  readonly memberCount = computed(() => this.profileStats()?.parcours?.memberCount ?? 0);
  readonly eventCount = computed(() => this.profileStats()?.parcours?.eventCount ?? 0);

  // Aroma signature
  readonly aromaSignature = computed(() => this.profileStats()?.aromaSignature ?? null);

  // Terroirs
  readonly terroirs = computed(() => this.profileStats()?.terroirs ?? null);

  // Journal
  readonly journal = computed(() => this.profileStats()?.journal ?? null);

  // Profile URL for sharing
  readonly profileUrl = computed(() => {
    const club = this.club();
    if (!club) return '';
    return `${window.location.origin}/club/${club.slug}`;
  });

  // Permissions
  readonly canAccessSettings = computed(() => this.contextStore.canAccessSettings());
  readonly canManageClub = computed(() => this.contextStore.canManageClub());

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
   * Copy club profile link to clipboard
   */
  async copyClubLink(): Promise<void> {
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