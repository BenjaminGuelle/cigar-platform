import { Component, inject, computed, signal, effect, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContextStore } from '../../../../core/stores/context.store';
import { injectClubStore } from '../../../../core/stores/club.store';
import {
  IconDirective,
  PageSectionComponent,
  ButtonComponent,
  TooltipDirective,
} from '@cigar-platform/shared/ui';
import type { ClubResponseDto } from '@cigar-platform/types';

/**
 * Club Profile Private Page
 *
 * Route: /profile (when context = club)
 * Accessible: To all club members (member, admin, owner)
 * Context-driven: Uses ContextStore.clubId
 *
 * Features:
 * - Display club information (avatar, name, description)
 * - Show club stats (members, events, etc.)
 * - Quick action CTAs (create event, invite member, etc.)
 * - Access to settings via CTA (admins/owners only)
 *
 * Architecture: ALL STARS ⭐
 * - Template in separate .html file
 * - Clean separation of concerns
 * - Loaded by ProfileContextPage when context = club
 * - Never shown in public routes (public = club-profile.page)
 */
@Component({
  selector: 'app-club-profile-private',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconDirective,
    PageSectionComponent,
    ButtonComponent,
    TooltipDirective,
  ],
  templateUrl: './club-profile-private.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubProfilePrivatePage {
  readonly contextStore = inject(ContextStore);
  readonly clubStore = injectClubStore();

  // Context ID
  readonly clubId = signal<string>('');

  // Reactive query with getter pattern
  readonly clubQuery = this.clubStore.getClubById(() => this.clubId());

  // Computed states
  readonly loading = this.clubQuery.loading;
  readonly error = this.clubQuery.error;
  readonly club: Signal<ClubResponseDto | null> = this.clubQuery.data;

  // Computed values
  readonly name = computed(() => this.club()?.name ?? 'Club');
  readonly description = computed(() => this.club()?.description ?? null);
  readonly slug = computed(() => this.club()?.slug ?? '');
  readonly memberCount = computed(() => this.club()?.memberCount ?? 0);

  // Stats (TODO: Implement real stats when backend ready)
  readonly eventsCount = computed(() => 0);
  readonly tastingsCount = computed(() => 0);

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
