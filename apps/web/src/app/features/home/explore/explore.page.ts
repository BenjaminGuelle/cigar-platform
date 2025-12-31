import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { ClubResponseDto } from '@cigar-platform/types';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  PageHeaderComponent,
  PageSectionComponent,
  InputComponent,
  IconDirective,
  ClubCardComponent,
} from '@cigar-platform/shared/ui';
import { SearchModalService } from '../../../core/services';
import { injectClubStore } from '../../../core/stores/club.store';

/**
 * Explore Page - Technical Fallback Only
 *
 * ⚠️ IMPORTANT: This is NOT a primary navigation destination
 *
 * Product Decision:
 * - App is usage-first, not browsing-first
 * - Discovery = Global Search Modal (accessible via search icon)
 * - This page exists ONLY as a technical fallback for:
 *   1. Deep-link support (/explore URLs from external sources)
 *   2. Auto-opens Global Search Modal on mount
 *   3. Shows minimal browse UI if modal is closed
 *
 * Primary UX Entry Points:
 * - Search icon (mobile header + desktop top bar)
 * - Cmd+K keyboard shortcut (future)
 *
 * Architecture:
 * - Opens Global Search Modal by default (ngOnInit)
 * - Fallback browse page if user closes modal
 * - NOT in primary navigation (removed from tabs)
 *
 * MVP Scope: Clubs only
 * Future: Users, Cigars, Events
 */

type ExploreFilter = 'clubs' | 'users' | 'cigars' | 'events';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    PageSectionComponent,
    InputComponent,
    IconDirective,
    ClubCardComponent,
  ],
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.css'],
})
export class ExplorePage implements OnInit {
  #router = inject(Router);
  #searchModal = inject(SearchModalService);
  #clubStore = injectClubStore();

  // State - Entity filter (MVP: clubs only)
  #entityFilter = signal<ExploreFilter>('clubs');
  readonly entityFilter = this.#entityFilter.asReadonly();

  // State - Clubs (using club store query for automatic cache invalidation)
  searchControl = new FormControl('');
  #searchQuery = signal<string>('');

  // Use club store's publicClubs query (auto-invalidates on auth changes)
  readonly publicClubsQuery = this.#clubStore.publicClubs;
  readonly loading = this.publicClubsQuery.loading;

  // Computed - Smart search (name, description, visibility)
  filteredClubs = computed(() => {
    const clubs = this.publicClubsQuery.data() ?? [];
    const query = this.#searchQuery().toLowerCase().trim();

    if (!query) {
      return clubs; // No filter, return all
    }

    return clubs.filter((club) => {
      const name = club.name.toLowerCase();
      const description = club.description ? String(club.description).toLowerCase() : '';
      const visibility = club.visibility.toLowerCase();

      // Smart search: name, description, or visibility keywords
      const matchesName = name.includes(query);
      const matchesDescription = description.includes(query);

      // Visibility keywords: "public", "privé", "prive", "private"
      const isPublicKeyword = ['public', 'publique'].some(kw => query.includes(kw));
      const isPrivateKeyword = ['privé', 'prive', 'private'].some(kw => query.includes(kw));

      const matchesVisibility =
        (isPublicKeyword && visibility === 'public') ||
        (isPrivateKeyword && visibility === 'private');

      return matchesName || matchesDescription || matchesVisibility;
    });
  });

  constructor() {
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.#searchQuery.set(value || '');
      });
  }

  ngOnInit(): void {
    // Open global search modal by default
    // Primary UX: Modal search > Browse page
    this.#searchModal.open();
  }

  /**
   * Set entity filter (clubs, users, cigars, events)
   * MVP: Only clubs supported
   */
  setEntityFilter(filter: ExploreFilter): void {
    this.#entityFilter.set(filter);
    // Future: Add queries for users, cigars, events
  }

  /**
   * Navigate to club public profile
   */
  navigateToClub(clubId: string): void {
    void this.#router.navigate(['/club', clubId]);
  }

  /**
   * Join/Request access to club
   */
  joinClub(clubId: string): void {
    // TODO: Open join/request modal
  }

  /**
   * Get member count
   */
  getMemberCount(club: ClubResponseDto): number {
    return club.memberCount || 0;
  }
}
