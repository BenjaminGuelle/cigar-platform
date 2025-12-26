import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type { ClubResponseDto } from '@cigar-platform/types';
import {
  PageSectionComponent,
  ButtonComponent,
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
    PageSectionComponent,
    ButtonComponent,
  ],
  templateUrl: './club-profile.page.html',
})
export class ClubProfilePage {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #clubsService = inject(ClubsService);

  // State
  clubId = signal<string | null>(null);
  club = signal<ClubResponseDto | null>(null);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  // Computed (ALL STARS - no `!` assertions)
  readonly currentClub = computed(() => this.club());

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

  constructor() {
    // Load club ID from route params
    effect(() => {
      this.#route.paramMap.subscribe((params) => {
        const id = params.get('id');
        this.clubId.set(id);
        if (id) {
          this.loadClub(id);
        }
      });
    });
  }

  /**
   * Load club data from API
   */
  async loadClub(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(false);

    try {
      const club: ClubResponseDto = await this.#clubsService.clubControllerFindOne(id);

      if (club?.id) {
        this.club.set(club);
      } else {
        this.error.set(true);
      }
    } catch (err) {
      console.error('[ClubProfilePage] Failed to load club:', err);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Join club or request access
   */
  onJoinClub(): void {
    const currentClub = this.club();
    if (!currentClub) return;

    // TODO: Open join/request modal or handle join logic
    console.log('[ClubProfilePage] Join club:', currentClub.id);
  }

  /**
   * Navigate back to explore page
   */
  goBackToExplore(): void {
    this.#router.navigate(['/explore']);
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
